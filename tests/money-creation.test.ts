import { describe, expect, test } from "bun:test";
import { Money, Currency } from "../src";

describe("Money", () => {
	describe("fromMinor", () => {
		test("creates Money from minor units (cents)", () => {
			const money = Money.fromMinor(Currency.USD, 1234);
			expect(money.toMinor()).toBe(1234);
			expect(money.toNumber()).toBe(12.34);
		});

		test("handles zero", () => {
			const money = Money.fromMinor(Currency.USD, 0);
			expect(money.toMinor()).toBe(0);
			expect(money.toNumber()).toBe(0);
		});

		test("handles negative values", () => {
			const money = Money.fromMinor(Currency.USD, -500);
			expect(money.toMinor()).toBe(-500);
			expect(money.toNumber()).toBe(-5);
		});

		test("respects currency decimal places (JPY has 0)", () => {
			const money = Money.fromMinor(Currency.JPY, 1000);
			expect(money.toMinor()).toBe(1000);
			expect(money.toNumber()).toBe(1000);
		});

		test("respects currency decimal places (BTC has 8)", () => {
			const money = Money.fromMinor(Currency.BTC, 100000000);
			expect(money.toMinor()).toBe(100000000);
			expect(money.toNumber()).toBe(1);
		});

		test("exposes currency", () => {
			const money = Money.fromMinor(Currency.EUR, 100);
			expect(money.currency).toBe(Currency.EUR);
		});
	});

	describe("fromNumber", () => {
		test("creates Money from decimal value", () => {
			const money = Money.fromNumber(Currency.USD, 12.34);
			expect(money.toNumber()).toBe(12.34);
			expect(money.toMinor()).toBe(1234);
		});

		test("handles whole numbers", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			expect(money.toNumber()).toBe(100);
			expect(money.toMinor()).toBe(10000);
		});

		test("handles negative values", () => {
			const money = Money.fromNumber(Currency.USD, -5.5);
			expect(money.toNumber()).toBe(-5.5);
			expect(money.toMinor()).toBe(-550);
		});

		test("respects currency decimal places (JPY)", () => {
			const money = Money.fromNumber(Currency.JPY, 1000);
			expect(money.toMinor()).toBe(1000);
			expect(money.toNumber()).toBe(1000);
		});

		test("respects currency decimal places (BTC)", () => {
			const money = Money.fromNumber(Currency.BTC, 1.5);
			expect(money.toMinor()).toBe(150000000);
			expect(money.toNumber()).toBe(1.5);
		});
	});

	describe("fromNumber with rounding", () => {
		test("rounds down with floor", () => {
			const money = Money.fromNumber(Currency.USD, 12.345, {
				rounding: "floor",
			});
			expect(money.toMinor()).toBe(1234);
		});

		test("rounds up with ceil", () => {
			const money = Money.fromNumber(Currency.USD, 12.341, {
				rounding: "ceil",
			});
			expect(money.toMinor()).toBe(1235);
		});

		test("rounds to nearest with round", () => {
			const money1 = Money.fromNumber(Currency.USD, 12.344, {
				rounding: "round",
			});
			expect(money1.toMinor()).toBe(1234);

			const money2 = Money.fromNumber(Currency.USD, 12.345, {
				rounding: "round",
			});
			expect(money2.toMinor()).toBe(1235);
		});

		test("truncates with trunc", () => {
			const money = Money.fromNumber(Currency.USD, 12.349, {
				rounding: "trunc",
			});
			expect(money.toMinor()).toBe(1234);
		});

		test("floor rounds negative towards negative infinity", () => {
			const money = Money.fromNumber(Currency.USD, -12.341, {
				rounding: "floor",
			});
			expect(money.toMinor()).toBe(-1235);
		});

		test("ceil rounds negative towards positive infinity", () => {
			const money = Money.fromNumber(Currency.USD, -12.349, {
				rounding: "ceil",
			});
			expect(money.toMinor()).toBe(-1234);
		});

		test("trunc rounds negative towards zero", () => {
			const money = Money.fromNumber(Currency.USD, -12.349, {
				rounding: "trunc",
			});
			expect(money.toMinor()).toBe(-1234);
		});
	});

	describe("fromNumber with strict mode", () => {
		test("throws when precision loss would occur in strict mode", () => {
			expect(() => {
				Money.fromNumber(Currency.USD, 12.345, { strict: true });
			}).toThrow();
		});

		test("allows exact values in strict mode", () => {
			const money = Money.fromNumber(Currency.USD, 12.34, { strict: true });
			expect(money.toMinor()).toBe(1234);
		});

		test("allows whole numbers in strict mode", () => {
			const money = Money.fromNumber(Currency.USD, 100, { strict: true });
			expect(money.toMinor()).toBe(10000);
		});

		test("strict mode respects currency decimal places", () => {
			expect(() => {
				Money.fromNumber(Currency.JPY, 100.5, { strict: true });
			}).toThrow();

			const money = Money.fromNumber(Currency.JPY, 100, { strict: true });
			expect(money.toMinor()).toBe(100);
		});
	});

	describe("precision loss with large numbers", () => {
		test("fromNumber throws when value exceeds safe integer range", () => {
			// 90071992547409.93 * 100 = 9007199254740993, which exceeds MAX_SAFE_INTEGER
			const value = Number("90071992547409.93");
			expect(() => Money.fromNumber(Currency.USD, value)).toThrow(
				"Value too large",
			);
		});
	});

	describe("USDH sub-cent precision", () => {
		test("USDH has 3 decimal places (mills/tenths of a cent)", () => {
			const money = Money.fromMinor(Currency.USDH, 12345);
			expect(money.toMinor()).toBe(12345);
			expect(money.toNumber()).toBe(12.345);
		});

		test("USDH allows sub-cent calculations", () => {
			// $12.345 in USDH (12 dollars, 34.5 cents)
			const money = Money.fromNumber(Currency.USDH, 12.345);
			expect(money.toMinor()).toBe(12345);
		});

		test("USDH strict mode allows 3 decimal places", () => {
			const money = Money.fromNumber(Currency.USDH, 12.345, { strict: true });
			expect(money.toMinor()).toBe(12345);
		});

		test("USDH strict mode rejects 4 decimal places", () => {
			expect(() => {
				Money.fromNumber(Currency.USDH, 12.3456, { strict: true });
			}).toThrow();
		});
	});

	describe("round-trip serialization", () => {
		test("toMinor -> fromMinor is lossless", () => {
			const original = Money.fromNumber(Currency.USD, 123.45);
			const minor = original.toMinor();
			const restored = Money.fromMinor(Currency.USD, minor);
			expect(restored.toMinor()).toBe(original.toMinor());
			expect(restored.toNumber()).toBe(original.toNumber());
		});

		test("toNumber -> fromNumber is lossless for exact values", () => {
			const original = Money.fromMinor(Currency.USD, 12345);
			const num = original.toNumber();
			const restored = Money.fromNumber(Currency.USD, num);
			expect(restored.toMinor()).toBe(original.toMinor());
		});

		test("deterministic: same input always produces same output", () => {
			const a = Money.fromNumber(Currency.USD, 99.99);
			const b = Money.fromNumber(Currency.USD, 99.99);
			expect(a.toMinor()).toBe(b.toMinor());
			expect(a.toNumber()).toBe(b.toNumber());
		});
	});
});
