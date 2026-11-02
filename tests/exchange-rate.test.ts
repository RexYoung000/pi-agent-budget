import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CONFIG } from "../src/config.js";
import { effectiveExchangeRate, exchangeRateSource, shouldRefreshExchangeRate, fetchExchangeRate } from "../src/core/exchange-rate.js";
import { calculateCostFromTokens, getPricingInfo } from "../src/core/pricing.js";

const now = Date.parse("2026-11-02T12:00:00Z");
const response = (data: unknown, status = 200) => (async () => new Response(JSON.stringify(data), { status })) as typeof fetch;
const quote = { base: "USD", quote: "CNY", rate: 6.65, date: "2026-10-30" };

test("automatic cache expires after 24 hours and failed retries wait one hour", () => {
  assert.equal(shouldRefreshExchangeRate(DEFAULT_CONFIG, now), true);
  const fx = { cachedRate: 6.65, fetchedAt: new Date(now).toISOString() };
  assert.equal(shouldRefreshExchangeRate({ ...DEFAULT_CONFIG, exchangeRate: fx }, now + 23 * 3600000), false);
  assert.equal(shouldRefreshExchangeRate({ ...DEFAULT_CONFIG, exchangeRate: fx }, now + 24 * 3600000), true);
  assert.equal(shouldRefreshExchangeRate({ ...DEFAULT_CONFIG, exchangeRate: { ...fx, attemptedAt: new Date(now).toISOString(), lastError: "offline" } }, now + 1800000), false);
  assert.equal(shouldRefreshExchangeRate({ ...DEFAULT_CONFIG, exchangeRate: { mode: "fixed", fixedRate: 7 } }, now), false);
});

test("fixed rate wins over cached rate; invalid saved rates never produce NaN", () => {
  const config = { ...DEFAULT_CONFIG, exchangeRate: { mode: "fixed" as const, fixedRate: 7, cachedRate: 6.65 } };
  assert.equal(effectiveExchangeRate(config), 7);
  assert.equal(exchangeRateSource(config), "fixed");
  for (const fixedRate of [0, -1, NaN, Infinity]) {
    assert.equal(effectiveExchangeRate({ ...config, exchangeRate: { ...config.exchangeRate, fixedRate } }), 6.65);
  }
  assert.equal(effectiveExchangeRate(DEFAULT_CONFIG), 7.2);
});

test("successful refresh records actual market date separately from fetch time", async () => {
  const result = await fetchExchangeRate({ lastError: "offline" }, { fetcher: response(quote), now });
  assert.equal(result.cachedRate, 6.65);
  assert.equal(result.rateDate, "2026-10-30");
  assert.equal(result.fetchedAt, new Date(now).toISOString());
  assert.equal(result.lastError, undefined);
});

test("bad responses retain previous valid rate and data date", async () => {
  const previous = { cachedRate: 7, rateDate: "2026-10-29", fetchedAt: "2026-10-29T12:00:00Z" };
  for (const data of [{ ...quote, rate: 0 }, { ...quote, rate: "6.65" }, { ...quote, base: "EUR" },
    { ...quote, date: "2026-02-30" }, { ...quote, date: "2099-01-01" }, {}]) {
    const result = await fetchExchangeRate(previous, { fetcher: response(data), now });
    assert.ok(result.lastError);
    assert.equal(result.cachedRate, 7);
    assert.equal(result.rateDate, previous.rateDate);
    assert.equal(result.fetchedAt, previous.fetchedAt);
  }
  const result = await fetchExchangeRate(previous, { fetcher: response({}, 503), now });
  assert.match(result.lastError!, /503/);
  assert.equal(result.cachedRate, 7);
});

test("network failure is visible; shutdown cancellation propagates", async () => {
  const fetcher = (async () => { throw new Error("network unreachable"); }) as typeof fetch;
  assert.match((await fetchExchangeRate({}, { fetcher, now })).lastError!, /network unreachable/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchExchangeRate({}, { signal: controller.signal, fetcher: (async (_url, init) => {
    init?.signal?.throwIfAborted();
    return new Response();
  }) as typeof fetch, now }));
});

test("model cost fallback and pricing info use the active rate, not native-currency shortcuts", () => {
  const info = getPricingInfo({ ...DEFAULT_CONFIG, exchangeRate: { mode: "fixed", fixedRate: 5 } }, "deepseek-chat");
  assert.equal(info.exchangeRate, 5);
  assert.equal(info.fxSource, "fixed");
  assert.equal(info.fxDate, undefined);
  assert.equal(calculateCostFromTokens(1000000, 0, 0, 0, "deepseek-chat", 5).total, 0.2);
  const cached = getPricingInfo({ ...DEFAULT_CONFIG, fxUpdatedAt: "2099-01-01", pricingUpdatedAt: "2099-01-01", exchangeRate: { cachedRate: 6.65, rateDate: "2026-10-30" } }, "deepseek-chat");
  assert.equal(cached.fxDate, "2026-10-30");
  assert.equal(cached.priceDate, "2026-06-07");
});
