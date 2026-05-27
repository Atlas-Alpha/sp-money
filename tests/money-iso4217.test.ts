import { expect, test } from "bun:test";
import { Currency, type CurrencyDefinition, defineCurrency } from "../src";

test("standard currencies carry ISO 4217 numeric codes", () => {
	expect(Currency.USD.numericCode).toBe(840);
	expect(Currency.EUR.numericCode).toBe(978);
	expect(Currency.JPY.numericCode).toBe(392);
	expect(Currency.USD.iso4217).toBe(true);
});

test("non-ISO assets are flagged", () => {
	const btc: CurrencyDefinition = Currency.BTC;
	expect(btc.iso4217).toBe(false);
	expect(btc.numericCode).toBeUndefined();
	expect(Currency.USDH.iso4217).toBe(false);
	expect(Currency.USDH.displayCode).toBe("USD");
});

test("defineCurrency accepts ISO 4217 metadata", () => {
	const sle = defineCurrency("SLE", 2, { numericCode: 925, iso4217: true });
	expect(sle.code).toBe("SLE");
	expect(sle.numericCode).toBe(925);
	expect(sle.iso4217).toBe(true);
});

test("defineCurrency rejects bad ISO 4217 alpha code", () => {
	expect(() =>
		defineCurrency("usd", 2, { numericCode: 840, iso4217: true }),
	).toThrow("three uppercase letters");
});

test("defineCurrency requires numericCode when iso4217 is true", () => {
	expect(() => defineCurrency("USD", 2, { iso4217: true })).toThrow(
		"numericCode",
	);
});

test("defineCurrency rejects out-of-range numericCode", () => {
	expect(() => defineCurrency("XYZ", 2, { numericCode: 1000 })).toThrow(
		"numericCode must be an integer in 0..999",
	);
});

test("defineCurrency rejects malformed displayCode", () => {
	expect(() => defineCurrency("FOO", 2, { displayCode: "us" })).toThrow(
		"displayCode",
	);
});

test("defineCurrency still works with no options (backwards compatible)", () => {
	const gold = defineCurrency("XAU", 4);
	expect(gold.code).toBe("XAU");
	expect(gold.decimalPlaces).toBe(4);
	expect(gold.iso4217).toBeUndefined();
	expect(gold.numericCode).toBeUndefined();
});
