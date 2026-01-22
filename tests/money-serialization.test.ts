import { describe, expect, test } from "bun:test";
import { Currency, Money } from "../src";

describe("Money", () => {
	describe("toJSON", () => {
		test("returns amount in minor units and currency code", () => {
			const money = Money.fromNumber(Currency.USD, 12.34);
			expect(money.toJSON()).toEqual({ amount: 1234, currency: "USD" });
		});

		test("handles zero", () => {
			const money = Money.fromMinor(Currency.EUR, 0);
			expect(money.toJSON()).toEqual({ amount: 0, currency: "EUR" });
		});

		test("handles negative values", () => {
			const money = Money.fromNumber(Currency.GBP, -5.5);
			expect(money.toJSON()).toEqual({ amount: -550, currency: "GBP" });
		});

		test("respects currency decimal places (JPY has 0)", () => {
			const money = Money.fromNumber(Currency.JPY, 1000);
			expect(money.toJSON()).toEqual({ amount: 1000, currency: "JPY" });
		});

		test("respects currency decimal places (BTC has 8)", () => {
			const money = Money.fromNumber(Currency.BTC, 1.5);
			expect(money.toJSON()).toEqual({ amount: 150000000, currency: "BTC" });
		});

		test("respects currency decimal places (USDH has 3)", () => {
			const money = Money.fromNumber(Currency.USDH, 12.345);
			expect(money.toJSON()).toEqual({ amount: 12345, currency: "USDH" });
		});

		test("works with JSON.stringify", () => {
			const money = Money.fromNumber(Currency.USD, 99.99);
			const json = JSON.stringify(money);
			expect(json).toBe('{"amount":9999,"currency":"USD"}');
		});

		test("works with JSON.stringify in objects", () => {
			const data = {
				total: Money.fromNumber(Currency.USD, 100),
				tax: Money.fromNumber(Currency.USD, 8.25),
			};
			const json = JSON.stringify(data);
			expect(JSON.parse(json)).toEqual({
				total: { amount: 10000, currency: "USD" },
				tax: { amount: 825, currency: "USD" },
			});
		});

		test("works with JSON.stringify in arrays", () => {
			const items = [
				Money.fromNumber(Currency.EUR, 10),
				Money.fromNumber(Currency.EUR, 20),
			];
			const json = JSON.stringify(items);
			expect(JSON.parse(json)).toEqual([
				{ amount: 1000, currency: "EUR" },
				{ amount: 2000, currency: "EUR" },
			]);
		});
	});
});
