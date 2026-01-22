import { describe, expect, test } from "bun:test";
import { Currency, Money } from "../src";

describe("Money", () => {
	describe("Money.percentOf (static)", () => {
		test("calculates 10% of $100", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 10);
			expect(result.toNumber()).toBe(10);
			expect(result.toMinor()).toBe(1000);
		});

		test("calculates 50% of $100", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 50);
			expect(result.toNumber()).toBe(50);
		});

		test("calculates 100% of a value (returns equivalent)", () => {
			const money = Money.fromNumber(Currency.USD, 42.5);
			const result = Money.percentOf(money, 100);
			expect(result.toNumber()).toBe(42.5);
		});

		test("calculates 0% of a value (returns zero)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 0);
			expect(result.toNumber()).toBe(0);
			expect(result.toMinor()).toBe(0);
		});

		test("calculates percentage greater than 100%", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 200);
			expect(result.toNumber()).toBe(200);
		});

		test("calculates negative percentage", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, -10);
			expect(result.toNumber()).toBe(-10);
		});

		test("handles precise percentages (3 decimal places)", () => {
			const money = Money.fromNumber(Currency.USD, 1000);
			const result = Money.percentOf(money, 12.345);
			expect(result.toNumber()).toBe(123.45);
		});

		test("handles very precise percentages (6+ decimal places)", () => {
			const money = Money.fromNumber(Currency.USD, 10000);
			const result = Money.percentOf(money, 3.141592);
			// 10000 * 3.141592 / 100 = 314.1592, rounds to 314.16
			expect(result.toNumber()).toBe(314.16);
		});

		test("handles pi percent precisely", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 3.14159265358979);
			// 100 * 3.14159265358979 / 100 = 3.14159265358979, rounds to 3.14
			expect(result.toNumber()).toBe(3.14);
		});

		test("rounds using default rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 10);
			// 10 * 33.333 / 100 = 3.3333, should round to 3.33
			const result = Money.percentOf(money, 33.333);
			expect(result.toNumber()).toBe(3.33);
		});

		test("respects floor rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 10);
			// 10 * 33.339 / 100 = 3.3339
			const result = Money.percentOf(money, 33.339, { rounding: "floor" });
			expect(result.toNumber()).toBe(3.33);
		});

		test("respects ceil rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 10);
			// 10 * 33.331 / 100 = 3.3331
			const result = Money.percentOf(money, 33.331, { rounding: "ceil" });
			expect(result.toNumber()).toBe(3.34);
		});

		test("respects trunc rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 10);
			// 10 * 33.339 / 100 = 3.3339
			const result = Money.percentOf(money, 33.339, { rounding: "trunc" });
			expect(result.toNumber()).toBe(3.33);
		});

		test("preserves currency on result", () => {
			const money = Money.fromNumber(Currency.EUR, 100);
			const result = Money.percentOf(money, 15);
			expect(result.currency).toBe(Currency.EUR);
		});

		test("returns new Money instance (immutability)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.percentOf(money, 50);
			expect(result).not.toBe(money);
			expect(money.toNumber()).toBe(100);
		});

		test("handles JPY (0 decimal places)", () => {
			const money = Money.fromNumber(Currency.JPY, 1000);
			const result = Money.percentOf(money, 15);
			expect(result.toNumber()).toBe(150);
			expect(result.toMinor()).toBe(150);
		});

		test("handles JPY with rounding", () => {
			const money = Money.fromNumber(Currency.JPY, 100);
			// 100 * 33.33 / 100 = 33.33, rounds to 33
			const result = Money.percentOf(money, 33.33);
			expect(result.toNumber()).toBe(33);
		});

		test("handles BTC (8 decimal places)", () => {
			const money = Money.fromNumber(Currency.BTC, 1);
			const result = Money.percentOf(money, 0.00000001);
			// 1 * 0.00000001 / 100 = 0.0000000001
			// This is smaller than 1 satoshi (0.00000001)
			expect(result.toMinor()).toBe(0);
		});

		test("handles BTC with meaningful percentage", () => {
			const money = Money.fromNumber(Currency.BTC, 1);
			const result = Money.percentOf(money, 50);
			expect(result.toNumber()).toBe(0.5);
			expect(result.toMinor()).toBe(50000000);
		});

		test("handles USDH (3 decimal places)", () => {
			const money = Money.fromNumber(Currency.USDH, 100);
			// 100 * 33.333 / 100 = 33.333
			const result = Money.percentOf(money, 33.333);
			expect(result.toNumber()).toBe(33.333);
		});

		test("percentage of zero is zero", () => {
			const money = Money.fromMinor(Currency.USD, 0);
			const result = Money.percentOf(money, 50);
			expect(result.toNumber()).toBe(0);
		});

		test("percentage of negative value", () => {
			const money = Money.fromNumber(Currency.USD, -100);
			const result = Money.percentOf(money, 10);
			expect(result.toNumber()).toBe(-10);
		});
	});

	describe("Money.incrementByPercent (static)", () => {
		test("increments $100 by 10%", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 10);
			expect(result.toNumber()).toBe(110);
		});

		test("increments $100 by 50%", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 50);
			expect(result.toNumber()).toBe(150);
		});

		test("increments by 0% (returns equivalent)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 0);
			expect(result.toNumber()).toBe(100);
		});

		test("increments by 100% (doubles the value)", () => {
			const money = Money.fromNumber(Currency.USD, 50);
			const result = Money.incrementByPercent(money, 100);
			expect(result.toNumber()).toBe(100);
		});

		test("increments by negative percent (effectively decrements)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, -10);
			expect(result.toNumber()).toBe(90);
		});

		test("handles precise percentages (sales tax example: 8.875%)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 8.875);
			expect(result.toNumber()).toBe(108.88);
		});

		test("handles very precise percentage (6+ decimal places)", () => {
			const money = Money.fromNumber(Currency.USD, 1000);
			const result = Money.incrementByPercent(money, 5.123456);
			// 1000 + (1000 * 5.123456 / 100) = 1000 + 51.23456 = 1051.23456 ≈ 1051.23
			expect(result.toNumber()).toBe(1051.23);
		});

		test("handles pi percent", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 3.14159265358979);
			expect(result.toNumber()).toBe(103.14);
		});

		test("respects floor rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 33.337, {
				rounding: "floor",
			});
			// 100 + (100 * 33.337 / 100) = 100 + 33.337 = 133.337, floor to 133.33
			expect(result.toNumber()).toBe(133.33);
		});

		test("respects ceil rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 33.331, {
				rounding: "ceil",
			});
			// 100 + (100 * 33.331 / 100) = 100 + 33.331 = 133.331, ceil to 133.34
			expect(result.toNumber()).toBe(133.34);
		});

		test("preserves currency on result", () => {
			const money = Money.fromNumber(Currency.GBP, 100);
			const result = Money.incrementByPercent(money, 20);
			expect(result.currency).toBe(Currency.GBP);
		});

		test("returns new Money instance (immutability)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 10);
			expect(result).not.toBe(money);
			expect(money.toNumber()).toBe(100);
		});

		test("handles JPY (0 decimal places)", () => {
			const money = Money.fromNumber(Currency.JPY, 1000);
			const result = Money.incrementByPercent(money, 8);
			expect(result.toNumber()).toBe(1080);
		});

		test("handles JPY with rounding", () => {
			const money = Money.fromNumber(Currency.JPY, 100);
			const result = Money.incrementByPercent(money, 8.5);
			// 100 + 8.5 = 108.5, rounds to 109
			expect(result.toNumber()).toBe(109);
		});

		test("handles BTC (8 decimal places)", () => {
			const money = Money.fromNumber(Currency.BTC, 1);
			const result = Money.incrementByPercent(money, 10);
			expect(result.toNumber()).toBe(1.1);
		});

		test("handles USDH (3 decimal places)", () => {
			const money = Money.fromNumber(Currency.USDH, 100);
			const result = Money.incrementByPercent(money, 5.555);
			// 100 + 5.555 = 105.555
			expect(result.toNumber()).toBe(105.555);
		});

		test("increment of zero amount stays zero", () => {
			const money = Money.fromMinor(Currency.USD, 0);
			const result = Money.incrementByPercent(money, 50);
			expect(result.toNumber()).toBe(0);
		});

		test("increment of negative amount", () => {
			const money = Money.fromNumber(Currency.USD, -100);
			const result = Money.incrementByPercent(money, 10);
			// -100 + (-100 * 10 / 100) = -100 + -10 = -110
			expect(result.toNumber()).toBe(-110);
		});
	});

	describe("Money.decrementByPercent (static)", () => {
		test("decrements $100 by 10%", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 10);
			expect(result.toNumber()).toBe(90);
		});

		test("decrements $100 by 50%", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 50);
			expect(result.toNumber()).toBe(50);
		});

		test("decrements by 0% (returns equivalent)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 0);
			expect(result.toNumber()).toBe(100);
		});

		test("decrements by 100% (returns zero)", () => {
			const money = Money.fromNumber(Currency.USD, 50);
			const result = Money.decrementByPercent(money, 100);
			expect(result.toNumber()).toBe(0);
		});

		test("decrements by more than 100% (goes negative)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 150);
			expect(result.toNumber()).toBe(-50);
		});

		test("decrements by negative percent (effectively increments)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, -10);
			expect(result.toNumber()).toBe(110);
		});

		test("handles precise percentages (discount example: 15.5%)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 15.5);
			expect(result.toNumber()).toBe(84.5);
		});

		test("handles very precise percentage (6+ decimal places)", () => {
			const money = Money.fromNumber(Currency.USD, 1000);
			const result = Money.decrementByPercent(money, 7.654321);
			// 1000 - (1000 * 7.654321 / 100) = 1000 - 76.54321 = 923.45679 ≈ 923.46
			expect(result.toNumber()).toBe(923.46);
		});

		test("handles pi percent", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 3.14159265358979);
			expect(result.toNumber()).toBe(96.86);
		});

		test("respects floor rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 33.337, {
				rounding: "floor",
			});
			// 100 - 33.337 = 66.663, floor to 66.66
			expect(result.toNumber()).toBe(66.66);
		});

		test("respects ceil rounding mode", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 33.331, {
				rounding: "ceil",
			});
			// 100 - 33.331 = 66.669, ceil to 66.67
			expect(result.toNumber()).toBe(66.67);
		});

		test("preserves currency on result", () => {
			const money = Money.fromNumber(Currency.CAD, 100);
			const result = Money.decrementByPercent(money, 25);
			expect(result.currency).toBe(Currency.CAD);
		});

		test("returns new Money instance (immutability)", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.decrementByPercent(money, 10);
			expect(result).not.toBe(money);
			expect(money.toNumber()).toBe(100);
		});

		test("handles JPY (0 decimal places)", () => {
			const money = Money.fromNumber(Currency.JPY, 1000);
			const result = Money.decrementByPercent(money, 12);
			expect(result.toNumber()).toBe(880);
		});

		test("handles JPY with rounding", () => {
			const money = Money.fromNumber(Currency.JPY, 100);
			const result = Money.decrementByPercent(money, 8.5);
			// 100 - 8.5 = 91.5, rounds to 92
			expect(result.toNumber()).toBe(92);
		});

		test("handles BTC (8 decimal places)", () => {
			const money = Money.fromNumber(Currency.BTC, 1);
			const result = Money.decrementByPercent(money, 25);
			expect(result.toNumber()).toBe(0.75);
		});

		test("handles USDH (3 decimal places)", () => {
			const money = Money.fromNumber(Currency.USDH, 100);
			const result = Money.decrementByPercent(money, 5.555);
			// 100 - 5.555 = 94.445
			expect(result.toNumber()).toBe(94.445);
		});

		test("decrement of zero amount stays zero", () => {
			const money = Money.fromMinor(Currency.USD, 0);
			const result = Money.decrementByPercent(money, 50);
			expect(result.toNumber()).toBe(0);
		});

		test("decrement of negative amount", () => {
			const money = Money.fromNumber(Currency.USD, -100);
			const result = Money.decrementByPercent(money, 10);
			// -100 - (-100 * 10 / 100) = -100 - -10 = -90
			expect(result.toNumber()).toBe(-90);
		});
	});

	describe("instance method wrappers (percent)", () => {
		test("money.percentOf(percent) delegates to Money.percentOf", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const staticResult = Money.percentOf(money, 25);
			const instanceResult = money.percentOf(25);
			expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
		});

		test("money.incrementByPercent(percent) delegates to Money.incrementByPercent", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const staticResult = Money.incrementByPercent(money, 15);
			const instanceResult = money.incrementByPercent(15);
			expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
		});

		test("money.decrementByPercent(percent) delegates to Money.decrementByPercent", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const staticResult = Money.decrementByPercent(money, 15);
			const instanceResult = money.decrementByPercent(15);
			expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
		});

		test("instance methods support rounding options", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = money.incrementByPercent(33.337, { rounding: "floor" });
			expect(result.toNumber()).toBe(133.33);
		});
	});

	describe("percent edge cases and precision", () => {
		test("extremely small percentage on large amount", () => {
			const money = Money.fromNumber(Currency.USD, 1000000);
			const result = Money.percentOf(money, 0.0001);
			// 1000000 * 0.0001 / 100 = 1.00
			expect(result.toNumber()).toBe(1);
		});

		test("extremely large percentage", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			const result = Money.incrementByPercent(money, 10000);
			// 100 + (100 * 10000 / 100) = 100 + 10000 = 10100
			expect(result.toNumber()).toBe(10100);
		});

		test("repeated percentage operations maintain precision", () => {
			let money = Money.fromNumber(Currency.USD, 100);
			// Apply 10% increment 3 times
			money = Money.incrementByPercent(money, 10);
			money = Money.incrementByPercent(money, 10);
			money = Money.incrementByPercent(money, 10);
			// 100 * 1.1 * 1.1 * 1.1 = 133.1
			expect(money.toNumber()).toBe(133.1);
		});

		test("percentage with many decimal places doesn't overflow", () => {
			const money = Money.fromNumber(Currency.USD, 100);
			// Very precise percentage
			const result = Money.percentOf(money, 12.3456789012345);
			expect(result.toNumber()).toBe(12.35);
		});

		test("inverse operations return to original (approximately)", () => {
			const original = Money.fromNumber(Currency.USD, 100);
			const increased = Money.incrementByPercent(original, 25);
			// To reverse a 25% increase, decrease by 20% (since 125 * 0.8 = 100)
			const reversed = Money.decrementByPercent(increased, 20);
			expect(reversed.toNumber()).toBe(100);
		});

		test("chained method calls work correctly", () => {
			const result = Money.fromNumber(Currency.USD, 100)
				.incrementByPercent(10) // 110
				.decrementByPercent(5) // 104.50
				.incrementByPercent(20); // 125.40
			expect(result.toNumber()).toBe(125.4);
		});

		test("handles fractional cents with precision", () => {
			const money = Money.fromNumber(Currency.USD, 0.01);
			const result = Money.incrementByPercent(money, 50);
			// 0.01 + 0.005 = 0.015, rounds to 0.02
			expect(result.toNumber()).toBe(0.02);
		});

		test("percentage of minimum representable value", () => {
			const money = Money.fromMinor(Currency.USD, 1); // $0.01
			const result = Money.percentOf(money, 50);
			// 0.01 * 50 / 100 = 0.005, rounds to 0.01
			expect(result.toNumber()).toBe(0.01);
		});

		test("BTC satoshi-level percentage precision", () => {
			const money = Money.fromMinor(Currency.BTC, 100); // 100 satoshis
			const result = Money.percentOf(money, 1);
			// 100 satoshis * 1 / 100 = 1 satoshi
			expect(result.toMinor()).toBe(1);
		});

		test("percentage resulting in sub-minor-unit rounds correctly", () => {
			const money = Money.fromMinor(Currency.USD, 1); // $0.01
			// 0.01 * 1 / 100 = 0.0001, rounds to 0
			const result = Money.percentOf(money, 1);
			expect(result.toMinor()).toBe(0);
		});
	});

	describe("percent overflow safety", () => {
		test("throws when percentage result exceeds safe integer range", () => {
			const money = Money.fromMinor(Currency.USD, Number.MAX_SAFE_INTEGER);
			expect(() => Money.incrementByPercent(money, 1)).toThrow(
				/safe|range|too large/i,
			);
		});

		test("handles large value with small percentage safely", () => {
			const money = Money.fromMinor(
				Currency.USD,
				Number.MAX_SAFE_INTEGER - 1000,
			);
			// 0.0001% of MAX_SAFE should be safe
			const result = Money.percentOf(money, 0.0001);
			expect(result.toMinor()).toBeGreaterThan(0);
		});
	});

	describe("real-world percentage scenarios", () => {
		test("sales tax calculation (8.875%)", () => {
			const subtotal = Money.fromNumber(Currency.USD, 99.99);
			const withTax = Money.incrementByPercent(subtotal, 8.875);
			// 99.99 * 1.08875 = 108.8641125 ≈ 108.86
			expect(withTax.toNumber()).toBe(108.86);
		});

		test("discount calculation (15% off)", () => {
			const original = Money.fromNumber(Currency.USD, 49.99);
			const discounted = Money.decrementByPercent(original, 15);
			// 49.99 * 0.85 = 42.4915 ≈ 42.49
			expect(discounted.toNumber()).toBe(42.49);
		});

		test("tip calculation (18.5%)", () => {
			const bill = Money.fromNumber(Currency.USD, 87.5);
			const tip = Money.percentOf(bill, 18.5);
			// 87.50 * 0.185 = 16.1875 ≈ 16.19
			expect(tip.toNumber()).toBe(16.19);
		});

		test("commission calculation (2.9% + fixed fee pattern)", () => {
			const transaction = Money.fromNumber(Currency.USD, 100);
			const percentageFee = Money.percentOf(transaction, 2.9);
			expect(percentageFee.toNumber()).toBe(2.9);
		});

		test("compound interest scenario", () => {
			let principal = Money.fromNumber(Currency.USD, 1000);
			const rate = 5; // 5% per period
			// 3 periods of compound interest
			for (let i = 0; i < 3; i++) {
				principal = Money.incrementByPercent(principal, rate);
			}
			// 1000 * (1.05)^3 = 1157.625 ≈ 1157.63
			expect(principal.toNumber()).toBe(1157.63);
		});

		test("VAT calculation (20%)", () => {
			const netPrice = Money.fromNumber(Currency.GBP, 83.33);
			const grossPrice = Money.incrementByPercent(netPrice, 20);
			// 83.33 * 1.20 = 99.996 ≈ 100.00
			expect(grossPrice.toNumber()).toBe(100);
		});

		test("Japanese consumption tax (10%)", () => {
			const price = Money.fromNumber(Currency.JPY, 1000);
			const withTax = Money.incrementByPercent(price, 10);
			expect(withTax.toNumber()).toBe(1100);
		});

		test("crypto trading fee (0.1%)", () => {
			const trade = Money.fromNumber(Currency.BTC, 0.5);
			const fee = Money.percentOf(trade, 0.1);
			// 0.5 * 0.001 = 0.0005 BTC = 50000 satoshis
			expect(fee.toNumber()).toBe(0.0005);
			expect(fee.toMinor()).toBe(50000);
		});

		test("merchant processing fee (2.6% + 10¢ pattern)", () => {
			const charge = Money.fromNumber(Currency.USD, 50);
			const percentPart = Money.percentOf(charge, 2.6);
			const fixedPart = Money.fromNumber(Currency.USD, 0.1);
			const totalFee = Money.add(percentPart, fixedPart);
			// 50 * 0.026 + 0.10 = 1.30 + 0.10 = 1.40
			expect(totalFee.toNumber()).toBe(1.4);
		});
	});
});
