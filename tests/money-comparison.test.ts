import { describe, expect, test } from "bun:test";
import { Currency, Money } from "../src";

describe("Money", () => {
	describe("Money.equals (static)", () => {
		test("returns true for equal values", () => {
			const a = Money.fromNumber(Currency.USD, 10.5);
			const b = Money.fromNumber(Currency.USD, 10.5);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("returns false for different values", () => {
			const a = Money.fromNumber(Currency.USD, 10.5);
			const b = Money.fromNumber(Currency.USD, 10.51);
			expect(Money.equals(a, b)).toBe(false);
		});

		test("returns true for zero values", () => {
			const a = Money.fromMinor(Currency.USD, 0);
			const b = Money.fromNumber(Currency.USD, 0);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("returns true for negative equal values", () => {
			const a = Money.fromNumber(Currency.USD, -5.25);
			const b = Money.fromNumber(Currency.USD, -5.25);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => Money.equals(usd, eur)).toThrow();
		});

		test("throws descriptive error for currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const gbp = Money.fromNumber(Currency.GBP, 10);
			expect(() => Money.equals(usd, gbp)).toThrow(
				/USD.*GBP|currency|mismatch/i,
			);
		});

		test("accepts equivalent currency objects (value equality)", () => {
			const usdClone = { code: "USD", decimalPlaces: 2 } as const;
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(usdClone, 10);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("handles JPY (0 decimal places) correctly", () => {
			const a = Money.fromNumber(Currency.JPY, 1000);
			const b = Money.fromNumber(Currency.JPY, 1000);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("handles BTC (8 decimal places) correctly", () => {
			const a = Money.fromNumber(Currency.BTC, 0.00000001);
			const b = Money.fromMinor(Currency.BTC, 1);
			expect(Money.equals(a, b)).toBe(true);
		});

		test("handles USDH (3 decimal places) correctly", () => {
			const a = Money.fromNumber(Currency.USDH, 10.005);
			const b = Money.fromMinor(Currency.USDH, 10005);
			expect(Money.equals(a, b)).toBe(true);
		});
	});

	describe("Money.compare (static)", () => {
		test("returns 0 for equal values", () => {
			const a = Money.fromNumber(Currency.USD, 10.5);
			const b = Money.fromNumber(Currency.USD, 10.5);
			expect(Money.compare(a, b)).toBe(0);
		});

		test("returns positive when first is greater", () => {
			const a = Money.fromNumber(Currency.USD, 10.51);
			const b = Money.fromNumber(Currency.USD, 10.5);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});

		test("returns negative when first is less", () => {
			const a = Money.fromNumber(Currency.USD, 10.49);
			const b = Money.fromNumber(Currency.USD, 10.5);
			expect(Money.compare(a, b)).toBeLessThan(0);
		});

		test("handles zero correctly", () => {
			const zero = Money.fromMinor(Currency.USD, 0);
			const positive = Money.fromNumber(Currency.USD, 1);
			const negative = Money.fromNumber(Currency.USD, -1);

			expect(Money.compare(zero, positive)).toBeLessThan(0);
			expect(Money.compare(zero, negative)).toBeGreaterThan(0);
			expect(Money.compare(zero, zero)).toBe(0);
		});

		test("handles negative values correctly", () => {
			const a = Money.fromNumber(Currency.USD, -5);
			const b = Money.fromNumber(Currency.USD, -10);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => Money.compare(usd, eur)).toThrow();
		});

		test("throws descriptive error for currency mismatch", () => {
			const cad = Money.fromNumber(Currency.CAD, 10);
			const aud = Money.fromNumber(Currency.AUD, 10);
			expect(() => Money.compare(cad, aud)).toThrow(
				/CAD.*AUD|currency|mismatch/i,
			);
		});

		test("accepts equivalent currency objects (value equality)", () => {
			const eurClone = { code: "EUR", decimalPlaces: 2 } as const;
			const a = Money.fromNumber(Currency.EUR, 10);
			const b = Money.fromNumber(eurClone, 5);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});

		test("can be used for sorting", () => {
			const items = [
				Money.fromNumber(Currency.USD, 30),
				Money.fromNumber(Currency.USD, 10),
				Money.fromNumber(Currency.USD, 20),
			];
			const sorted = [...items].sort(Money.compare);
			expect(sorted[0].toNumber()).toBe(10);
			expect(sorted[1].toNumber()).toBe(20);
			expect(sorted[2].toNumber()).toBe(30);
		});

		test("handles JPY (0 decimal places) correctly", () => {
			const a = Money.fromNumber(Currency.JPY, 1001);
			const b = Money.fromNumber(Currency.JPY, 1000);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});

		test("handles BTC (8 decimal places) correctly", () => {
			const a = Money.fromMinor(Currency.BTC, 2);
			const b = Money.fromMinor(Currency.BTC, 1);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});

		test("handles USDH (3 decimal places) correctly", () => {
			const a = Money.fromNumber(Currency.USDH, 10.001);
			const b = Money.fromNumber(Currency.USDH, 10.0);
			expect(Money.compare(a, b)).toBeGreaterThan(0);
		});
	});

	describe("Money.lessThan (static)", () => {
		test("returns true when first is less", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.lessThan(a, b)).toBe(true);
		});

		test("returns false when first is greater", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(Money.lessThan(a, b)).toBe(false);
		});

		test("returns false when equal", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.lessThan(a, b)).toBe(false);
		});

		test("handles negative values", () => {
			const a = Money.fromNumber(Currency.USD, -10);
			const b = Money.fromNumber(Currency.USD, -5);
			expect(Money.lessThan(a, b)).toBe(true);
		});

		test("handles zero comparisons", () => {
			const zero = Money.fromMinor(Currency.USD, 0);
			const positive = Money.fromNumber(Currency.USD, 1);
			const negative = Money.fromNumber(Currency.USD, -1);

			expect(Money.lessThan(zero, positive)).toBe(true);
			expect(Money.lessThan(zero, negative)).toBe(false);
			expect(Money.lessThan(negative, zero)).toBe(true);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 5);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => Money.lessThan(usd, eur)).toThrow();
		});

		test("throws descriptive error for currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 5);
			const gbp = Money.fromNumber(Currency.GBP, 10);
			expect(() => Money.lessThan(usd, gbp)).toThrow(
				/USD.*GBP|currency|mismatch/i,
			);
		});

		test("accepts equivalent currency objects (value equality)", () => {
			const usdClone = { code: "USD", decimalPlaces: 2 } as const;
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(usdClone, 10);
			expect(Money.lessThan(a, b)).toBe(true);
		});

		test("handles sub-cent differences in USDH", () => {
			const a = Money.fromNumber(Currency.USDH, 10.001);
			const b = Money.fromNumber(Currency.USDH, 10.002);
			expect(Money.lessThan(a, b)).toBe(true);
		});

		test("handles satoshi differences in BTC", () => {
			const a = Money.fromMinor(Currency.BTC, 1);
			const b = Money.fromMinor(Currency.BTC, 2);
			expect(Money.lessThan(a, b)).toBe(true);
		});
	});

	describe("Money.greaterThan (static)", () => {
		test("returns true when first is greater", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(Money.greaterThan(a, b)).toBe(true);
		});

		test("returns false when first is less", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.greaterThan(a, b)).toBe(false);
		});

		test("returns false when equal", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.greaterThan(a, b)).toBe(false);
		});

		test("handles negative values", () => {
			const a = Money.fromNumber(Currency.USD, -5);
			const b = Money.fromNumber(Currency.USD, -10);
			expect(Money.greaterThan(a, b)).toBe(true);
		});

		test("handles zero comparisons", () => {
			const zero = Money.fromMinor(Currency.USD, 0);
			const positive = Money.fromNumber(Currency.USD, 1);
			const negative = Money.fromNumber(Currency.USD, -1);

			expect(Money.greaterThan(zero, negative)).toBe(true);
			expect(Money.greaterThan(zero, positive)).toBe(false);
			expect(Money.greaterThan(positive, zero)).toBe(true);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 5);
			expect(() => Money.greaterThan(usd, eur)).toThrow();
		});

		test("throws descriptive error for currency mismatch", () => {
			const cad = Money.fromNumber(Currency.CAD, 10);
			const aud = Money.fromNumber(Currency.AUD, 5);
			expect(() => Money.greaterThan(cad, aud)).toThrow(
				/CAD.*AUD|currency|mismatch/i,
			);
		});

		test("accepts equivalent currency objects (value equality)", () => {
			const eurClone = { code: "EUR", decimalPlaces: 2 } as const;
			const a = Money.fromNumber(Currency.EUR, 10);
			const b = Money.fromNumber(eurClone, 5);
			expect(Money.greaterThan(a, b)).toBe(true);
		});

		test("handles sub-cent differences in USDH", () => {
			const a = Money.fromNumber(Currency.USDH, 10.002);
			const b = Money.fromNumber(Currency.USDH, 10.001);
			expect(Money.greaterThan(a, b)).toBe(true);
		});

		test("handles satoshi differences in BTC", () => {
			const a = Money.fromMinor(Currency.BTC, 2);
			const b = Money.fromMinor(Currency.BTC, 1);
			expect(Money.greaterThan(a, b)).toBe(true);
		});
	});

	describe("instance comparison methods", () => {
		test("a.equals(b) delegates to Money.equals(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(a.equals(b)).toBe(Money.equals(a, b));
		});

		test("a.compare(b) delegates to Money.compare(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(a.compare(b)).toBe(Money.compare(a, b));
		});

		test("a.lessThan(b) delegates to Money.lessThan(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(a.lessThan(b)).toBe(Money.lessThan(a, b));
		});

		test("a.greaterThan(b) delegates to Money.greaterThan(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(a.greaterThan(b)).toBe(Money.greaterThan(a, b));
		});

		test("instance equals throws on currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => usd.equals(eur)).toThrow();
		});

		test("instance compare throws on currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => usd.compare(eur)).toThrow();
		});

		test("instance lessThan throws on currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => usd.lessThan(eur)).toThrow();
		});

		test("instance greaterThan throws on currency mismatch", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => usd.greaterThan(eur)).toThrow();
		});

		test("chained comparisons work correctly", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			const c = Money.fromNumber(Currency.USD, 15);

			expect(a.lessThan(b) && b.lessThan(c)).toBe(true);
			expect(c.greaterThan(b) && b.greaterThan(a)).toBe(true);
		});
	});

	describe("Money.lessThanOrEqual (static)", () => {
		test("returns true when first is less", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.lessThanOrEqual(a, b)).toBe(true);
		});

		test("returns true when equal", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.lessThanOrEqual(a, b)).toBe(true);
		});

		test("returns false when first is greater", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(Money.lessThanOrEqual(a, b)).toBe(false);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 5);
			const eur = Money.fromNumber(Currency.EUR, 10);
			expect(() => Money.lessThanOrEqual(usd, eur)).toThrow();
		});
	});

	describe("Money.greaterThanOrEqual (static)", () => {
		test("returns true when first is greater", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 5);
			expect(Money.greaterThanOrEqual(a, b)).toBe(true);
		});

		test("returns true when equal", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.greaterThanOrEqual(a, b)).toBe(true);
		});

		test("returns false when first is less", () => {
			const a = Money.fromNumber(Currency.USD, 5);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(Money.greaterThanOrEqual(a, b)).toBe(false);
		});

		test("throws when comparing different currencies", () => {
			const usd = Money.fromNumber(Currency.USD, 10);
			const eur = Money.fromNumber(Currency.EUR, 5);
			expect(() => Money.greaterThanOrEqual(usd, eur)).toThrow();
		});
	});

	describe("instance lessThanOrEqual/greaterThanOrEqual", () => {
		test("a.lessThanOrEqual(b) delegates to Money.lessThanOrEqual(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(a.lessThanOrEqual(b)).toBe(Money.lessThanOrEqual(a, b));
		});

		test("a.greaterThanOrEqual(b) delegates to Money.greaterThanOrEqual(a, b)", () => {
			const a = Money.fromNumber(Currency.USD, 10);
			const b = Money.fromNumber(Currency.USD, 10);
			expect(a.greaterThanOrEqual(b)).toBe(Money.greaterThanOrEqual(a, b));
		});
	});
});
