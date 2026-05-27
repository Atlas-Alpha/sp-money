import { expect, test } from "bun:test";
import { Currency, defineCurrency, Money } from "../src";

test("format renders ISO 4217 currency via Intl", () => {
	const m = Money.fromNumber(Currency.USD, 1234.5);
	const out = m.format("en-US");
	// en-US USD typically renders "$1,234.50"
	expect(out).toContain("1,234.50");
	expect(out).toMatch(/\$|USD/);
});

test("format respects currency decimal places (JPY = 0)", () => {
	const m = Money.fromNumber(Currency.JPY, 1500);
	const out = m.format("en-US");
	expect(out).not.toContain(".");
	expect(out).toContain("1,500");
});

test("format respects higher precision for custom decimal places (BTC = 8)", () => {
	const m = Money.fromNumber(Currency.BTC, 0.12345678);
	const out = m.format("en-US");
	expect(out).toContain("0.12345678");
	// non-ISO falls back to "BTC <number>"
	expect(out.startsWith("BTC ")).toBe(true);
});

test("format uses displayCode for non-ISO aliases (USDH -> USD)", () => {
	const m = Money.fromNumber(Currency.USDH, 12.345);
	const out = m.format("en-US");
	// USDH has displayCode USD, but its own 3-decimal precision
	expect(out).toContain("12.345");
	expect(out).toMatch(/\$|USD/);
});

test("format falls back to decimal style for unsupported codes", () => {
	const custom = defineCurrency("FOO", 2);
	const m = Money.fromNumber(custom, 9.5);
	const out = m.format("en-US");
	expect(out).toBe("FOO 9.50");
});

test("format respects locale", () => {
	const m = Money.fromNumber(Currency.EUR, 1234.56);
	const out = m.format("de-DE");
	// de-DE uses "." as thousands and "," as decimal
	expect(out).toContain("1.234,56");
});

test("format allows fraction-digit override", () => {
	const m = Money.fromNumber(Currency.USD, 1.5);
	const out = m.format("en-US", {
		minimumFractionDigits: 4,
		maximumFractionDigits: 4,
	});
	expect(out).toContain("1.5000");
});

test("format preserves exact minor units near the safe integer limit", () => {
	const m = Money.fromMinor(Currency.USD, Number.MAX_SAFE_INTEGER);
	const out = m.format("en-US");
	expect(out).toContain("90,071,992,547,409.91");
});

test("format preserves exact high-precision minor units in decimal fallback", () => {
	const m = Money.fromMinor(Currency.BTC, Number.MAX_SAFE_INTEGER);
	const out = m.format("en-US");
	expect(out).toBe("BTC 90,071,992.54740991");
});

test("format allows a maximum fraction digit override without minimum override", () => {
	const m = Money.fromNumber(Currency.USD, 1.2);
	const out = m.format("en-US", { maximumFractionDigits: 1 });
	expect(out).toContain("1.2");
});

test("format allows a minimum fraction digit override without maximum override", () => {
	const m = Money.fromNumber(Currency.USD, 1.2);
	const out = m.format("en-US", { minimumFractionDigits: 4 });
	expect(out).toContain("1.2000");
});
