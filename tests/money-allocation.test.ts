import { describe, expect, test } from "bun:test";
import { Currency, Money } from "../src";

describe("Money", () => {
	describe("allocate", () => {
		describe("even splits", () => {
			test("splits $10.00 evenly across 2 people", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const result = money.allocate(2);

				expect(result).toHaveLength(2);
				expect(result[0].toNumber()).toBe(5);
				expect(result[1].toNumber()).toBe(5);
			});

			test("splits $10.00 evenly across 5 people", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const result = money.allocate(5);

				expect(result).toHaveLength(5);
				result.forEach((share) => {
					expect(share.toNumber()).toBe(2);
				});
			});

			test("splits 100 JPY evenly across 4 people", () => {
				const money = Money.fromNumber(Currency.JPY, 100);
				const result = money.allocate(4);

				expect(result).toHaveLength(4);
				result.forEach((share) => {
					expect(share.toNumber()).toBe(25);
				});
			});
		});

		describe("uneven splits with remainder distribution", () => {
			test("splits $10.00 across 3 people: [$3.34, $3.33, $3.33]", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				expect(result[0].toNumber()).toBe(3.34);
				expect(result[1].toNumber()).toBe(3.33);
				expect(result[2].toNumber()).toBe(3.33);
			});

			test("splits $1.00 across 3 people: [$0.34, $0.33, $0.33]", () => {
				const money = Money.fromNumber(Currency.USD, 1);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				expect(result[0].toNumber()).toBe(0.34);
				expect(result[1].toNumber()).toBe(0.33);
				expect(result[2].toNumber()).toBe(0.33);
			});

			test("splits $0.01 across 3 people: [$0.01, $0.00, $0.00]", () => {
				const money = Money.fromNumber(Currency.USD, 0.01);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				expect(result[0].toNumber()).toBe(0.01);
				expect(result[1].toNumber()).toBe(0);
				expect(result[2].toNumber()).toBe(0);
			});

			test("splits 10 JPY across 3 people: [4, 3, 3]", () => {
				const money = Money.fromNumber(Currency.JPY, 10);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				expect(result[0].toNumber()).toBe(4);
				expect(result[1].toNumber()).toBe(3);
				expect(result[2].toNumber()).toBe(3);
			});

			test("splits 1 BTC across 3 people with 8 decimal precision", () => {
				const money = Money.fromNumber(Currency.BTC, 1);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				// 1 BTC = 100_000_000 satoshis
				// 100_000_000 / 3 = 33_333_333 remainder 1
				expect(result[0].toMinor()).toBe(33_333_334);
				expect(result[1].toMinor()).toBe(33_333_333);
				expect(result[2].toMinor()).toBe(33_333_333);
			});
		});

		describe("sum of allocations equals original", () => {
			test("sum of $10.00 split 3 ways equals $10.00", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const result = money.allocate(3);
				const sum = Money.sum(result);

				expect(sum.equals(money)).toBe(true);
			});

			test("sum of $0.07 split 3 ways equals $0.07", () => {
				const money = Money.fromNumber(Currency.USD, 0.07);
				const result = money.allocate(3);
				const sum = Money.sum(result);

				expect(sum.equals(money)).toBe(true);
			});

			test("sum of 1 BTC split 7 ways equals 1 BTC", () => {
				const money = Money.fromNumber(Currency.BTC, 1);
				const result = money.allocate(7);
				const sum = Money.sum(result);

				expect(sum.equals(money)).toBe(true);
			});

			test("sum of $999.99 split 13 ways equals $999.99", () => {
				const money = Money.fromNumber(Currency.USD, 999.99);
				const result = money.allocate(13);
				const sum = Money.sum(result);

				expect(sum.equals(money)).toBe(true);
			});
		});

		describe("allocation preserves currency", () => {
			test("allocations have the same currency as the original", () => {
				const money = Money.fromNumber(Currency.EUR, 100);
				const result = money.allocate(4);

				result.forEach((share) => {
					expect(share.currency).toBe(Currency.EUR);
				});
			});
		});

		describe("edge cases", () => {
			test("allocate to 1 person returns the full amount", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const result = money.allocate(1);

				expect(result).toHaveLength(1);
				expect(result[0].equals(money)).toBe(true);
			});

			test("allocate $0.00 across 3 people returns three $0.00", () => {
				const money = Money.fromNumber(Currency.USD, 0);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				result.forEach((share) => {
					expect(share.isZero()).toBe(true);
				});
			});

			test("allocate negative amount distributes negative values", () => {
				const money = Money.fromNumber(Currency.USD, -10);
				const result = money.allocate(3);

				expect(result).toHaveLength(3);
				// -1000 cents / 3 = -333 remainder -1
				// Each gets -333, first gets extra -1 (so -334)
				expect(result[0].toNumber()).toBe(-3.34);
				expect(result[1].toNumber()).toBe(-3.33);
				expect(result[2].toNumber()).toBe(-3.33);
			});

			test("sum of negative allocation equals original", () => {
				const money = Money.fromNumber(Currency.USD, -10);
				const result = money.allocate(3);
				const sum = Money.sum(result);

				expect(sum.equals(money)).toBe(true);
			});
		});

		describe("error cases", () => {
			test("throws when allocating to 0 people", () => {
				const money = Money.fromNumber(Currency.USD, 10);

				expect(() => money.allocate(0)).toThrow(/must be a positive integer/i);
			});

			test("throws when allocating to negative number of people", () => {
				const money = Money.fromNumber(Currency.USD, 10);

				expect(() => money.allocate(-1)).toThrow(/must be a positive integer/i);
			});

			test("throws when allocating to non-integer", () => {
				const money = Money.fromNumber(Currency.USD, 10);

				expect(() => money.allocate(2.5)).toThrow(
					/must be a positive integer/i,
				);
			});

			test("throws when allocating to unsafe integer", () => {
				const money = Money.fromNumber(Currency.USD, 10);

				expect(() => money.allocate(Number.MAX_SAFE_INTEGER + 1)).toThrow(
					/safe integer/i,
				);
			}, 5000);
		});

		describe("static method", () => {
			test("Money.allocate works the same as instance method", () => {
				const money = Money.fromNumber(Currency.USD, 10);
				const instanceResult = money.allocate(3);
				const staticResult = Money.allocate(money, 3);

				expect(staticResult).toHaveLength(instanceResult.length);
				for (let i = 0; i < instanceResult.length; i++) {
					expect(staticResult[i].equals(instanceResult[i])).toBe(true);
				}
			});
		});
	});
});
