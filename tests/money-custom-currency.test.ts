import { test, expect } from "bun:test";
import { Currency, Money, defineCurrency } from "../src";

test("defineCurrency creates a valid currency definition", () => {
	const gold = defineCurrency("XAU", 4);
	expect(gold.code).toBe("XAU");
	expect(gold.decimalPlaces).toBe(4);
});

test("defineCurrency returns a frozen object", () => {
	const gold = defineCurrency("XAU", 4);
	expect(Object.isFrozen(gold)).toBe(true);
});

test("defineCurrency throws on empty code", () => {
	expect(() => defineCurrency("", 2)).toThrow("Currency code must be a non-empty string");
});

test("defineCurrency throws on negative decimalPlaces", () => {
	expect(() => defineCurrency("XAU", -1)).toThrow("Decimal places must be a non-negative integer");
});

test("defineCurrency throws on non-integer decimalPlaces", () => {
	expect(() => defineCurrency("XAU", 2.5)).toThrow("Decimal places must be a non-negative integer");
});

test("Money.fromNumber works with custom currency", () => {
	const gold = defineCurrency("XAU", 4);
	const m = Money.fromNumber(gold, 1.2345);
	expect(m.toNumber()).toBe(1.2345);
	expect(m.toMinor()).toBe(12345);
});

test("Money.fromMinor works with custom currency", () => {
	const gold = defineCurrency("XAU", 4);
	const m = Money.fromMinor(gold, 12345);
	expect(m.toNumber()).toBe(1.2345);
	expect(m.toMinor()).toBe(12345);
});

test("arithmetic between two Money values of the same custom currency", () => {
	const gold = defineCurrency("XAU", 4);
	const a = Money.fromNumber(gold, 10.5);
	const b = Money.fromNumber(gold, 3.25);
	expect(Money.add(a, b).toNumber()).toBe(13.75);
	expect(Money.subtract(a, b).toNumber()).toBe(7.25);
});

test("currency mismatch between custom and built-in currencies", () => {
	const custom = defineCurrency("FOO", 2);
	const usd = Money.fromNumber(Currency.USD, 10);
	const foo = Money.fromNumber(custom, 10);
	expect(() => Money.add(usd, foo)).toThrow("currency mismatch");
});

test("conversion from built-in to custom currency", () => {
	const custom = defineCurrency("XYZ", 2);
	const usd = Money.fromNumber(Currency.USD, 100);
	const converted = Money.convert(usd, custom, 1.5);
	expect(converted.toNumber()).toBe(150);
	expect(converted.currency.code).toBe("XYZ");
});

test("zero decimal places custom currency", () => {
	const reward = defineCurrency("PTS", 0);
	const m = Money.fromNumber(reward, 42);
	expect(m.toNumber()).toBe(42);
	expect(m.toMinor()).toBe(42);
});
