import { describe, expect, test } from "bun:test";
import { Currency, Money } from "../src";

describe("Money", () => {
	describe("Money.convert (static)", () => {
		describe("USD to foreign currency conversions", () => {
			test("converts $100 USD to EUR at rate 1.3892503971337602", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.EUR, 1.3892503971337602);
				// $100 * 1.3892503971337602 = 138.92503971337602 EUR
				expect(result.toMinor()).toBe(13893);
				expect(result.currency).toBe(Currency.EUR);
			});

			test("converts $100 USD to JPY at rate 157.91804259474478", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.JPY, 157.91804259474478);
				// $100 * 157.91804259474478 = 15791.804259474478 JPY
				expect(result.toMinor()).toBe(15792);
				expect(result.currency).toBe(Currency.JPY);
			});

			test("converts $1000 USD to BTC at rate 0.00001080599586018141", () => {
				const usd = Money.fromNumber(Currency.USD, 1000);
				const result = Money.convert(usd, Currency.BTC, 0.00001080599586018141);
				// $1000 * 0.00001080599586018141 = 0.01080599586018141 BTC
				expect(result.toMinor()).toBe(1080600);
				expect(result.currency).toBe(Currency.BTC);
			});

			test("converts $0.01 USD (1 cent) to JPY", () => {
				const usd = Money.fromNumber(Currency.USD, 0.01);
				const result = Money.convert(usd, Currency.JPY, 157.91804259474478);
				// $0.01 * 157.91804259474478 = 1.5791804259474478 JPY ≈ 2
				expect(result.toNumber()).toBe(2);
			});

			test("converts $0.01 USD to BTC", () => {
				const usd = Money.fromNumber(Currency.USD, 0.01);
				const result = Money.convert(usd, Currency.BTC, 0.00001080599586018141);
				// $0.01 * 0.00001080599586018141 = 0.0000001080599586018141 BTC
				// = 10.80599586018141 satoshis ≈ 11 satoshis
				expect(result.toMinor()).toBe(11);
			});
		});

		describe("foreign currency to USD conversions", () => {
			test("converts €100 EUR to USD at rate 1.3892503971337602", () => {
				const eur = Money.fromNumber(Currency.EUR, 100);
				const result = Money.convert(eur, Currency.USD, 1 / 1.3892503971337602);
				// €100 / 1.3892503971337602 = $71.98 USD
				expect(result.toMinor()).toBe(7198);
				expect(result.currency).toBe(Currency.USD);
			});

			test("converts ¥10000 JPY to USD at rate 157.91804259474478", () => {
				const jpy = Money.fromNumber(Currency.JPY, 10000);
				const result = Money.convert(jpy, Currency.USD, 1 / 157.91804259474478);
				// ¥10000 / 157.91804259474478 = $63.32 USD
				expect(result.toMinor()).toBe(6332);
				expect(result.currency).toBe(Currency.USD);
			});

			test("converts 0.01 BTC to USD at rate 0.00001080599586018141", () => {
				const btc = Money.fromNumber(Currency.BTC, 0.01);
				const result = Money.convert(btc, Currency.USD, 1 / 0.00001080599586018141);
				// 0.01 * (1 / 0.00001080599586018141) ≈ $925.41 USD (floating point)
				expect(result.toNumber()).toBe(925.41);
				expect(result.currency).toBe(Currency.USD);
			});

			test("converts 1 satoshi to USD", () => {
				const btc = Money.fromMinor(Currency.BTC, 1);
				const result = Money.convert(btc, Currency.USD, 1 / 0.00001080599586018141);
				// 0.00000001 / 0.00001080599586018141 = $0.000925 USD ≈ $0.00
				expect(result.toMinor()).toBe(0);
			});

			test("converts 100 satoshis to USD", () => {
				const btc = Money.fromMinor(Currency.BTC, 100);
				const result = Money.convert(btc, Currency.USD, 1 / 0.00001080599586018141);
				// 0.000001 / 0.00001080599586018141 = $0.0925 USD ≈ $0.09
				expect(result.toNumber()).toBe(0.09);
			});
		});

		describe("rate of 1 (identity conversion)", () => {
			test("converts USD to USD at rate 1", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.USD, 1);
				expect(result.toNumber()).toBe(100);
				expect(result.currency).toBe(Currency.USD);
			});

			test("zero amount at rate 1 remains zero", () => {
				const usd = Money.fromMinor(Currency.USD, 0);
				const result = Money.convert(usd, Currency.EUR, 1);
				expect(result.toNumber()).toBe(0);
			});
		});

		describe("rounding modes", () => {
			test("floor/trunc do not drop exact integer results due to float wobble", () => {
				const usd = Money.fromMinor(Currency.USD, 57);
				const floorResult = Money.convert(usd, Currency.USD, 1, {
					rounding: "floor",
				});
				const truncResult = Money.convert(usd, Currency.USD, 1, {
					rounding: "trunc",
				});

				expect(floorResult.toMinor()).toBe(57);
				expect(truncResult.toMinor()).toBe(57);
			});

			test("uses default rounding (round) for midpoint values", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				// 1 * 1.005 = 1.005 EUR -> 100.5 cents
				const result = Money.convert(usd, Currency.EUR, 1.005);
				expect(result.toMinor()).toBe(101);
			});

			test("respects floor rounding mode at midpoint", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "floor" });
				expect(result.toMinor()).toBe(100);
			});

			test("respects ceil rounding mode at midpoint", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "ceil" });
				expect(result.toMinor()).toBe(101);
			});

			test("respects trunc rounding mode at midpoint", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "trunc" });
				expect(result.toMinor()).toBe(100);
			});

			test("rounds negative midpoint with floor", () => {
				const usd = Money.fromNumber(Currency.USD, -1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "floor" });
				expect(result.toMinor()).toBe(-101);
			});

			test("rounds negative midpoint with ceil", () => {
				const usd = Money.fromNumber(Currency.USD, -1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "ceil" });
				expect(result.toMinor()).toBe(-100);
			});

			test("rounds negative midpoint with trunc", () => {
				const usd = Money.fromNumber(Currency.USD, -1);
				const result = Money.convert(usd, Currency.EUR, 1.005, { rounding: "trunc" });
				expect(result.toMinor()).toBe(-100);
			});

			test("rounds negative midpoint with default rounding", () => {
				const usd = Money.fromNumber(Currency.USD, -1);
				const result = Money.convert(usd, Currency.EUR, 1.005);
				expect(result.toMinor()).toBe(-100);
			});

			test("rounding affects JPY (0 decimal places) correctly", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				// 1 * 157.5 = 157.5 JPY
				const resultFloor = Money.convert(usd, Currency.JPY, 157.5, { rounding: "floor" });
				const resultCeil = Money.convert(usd, Currency.JPY, 157.5, { rounding: "ceil" });
				const resultRound = Money.convert(usd, Currency.JPY, 157.5);
				expect(resultFloor.toMinor()).toBe(157);
				expect(resultCeil.toMinor()).toBe(158);
				expect(resultRound.toMinor()).toBe(158);
			});

			test("rounding affects BTC (8 decimal places) correctly", () => {
				const usd = Money.fromNumber(Currency.USD, 1);
				// 1 * 0.000000005 = 0.5 satoshi
				const resultFloor = Money.convert(usd, Currency.BTC, 0.000000005, { rounding: "floor" });
				const resultCeil = Money.convert(usd, Currency.BTC, 0.000000005, { rounding: "ceil" });
				expect(resultFloor.toMinor()).toBe(0);
				expect(resultCeil.toMinor()).toBe(1);
			});
		});

		describe("different decimal place currencies", () => {
			test("converts USD (2 decimals) to JPY (0 decimals)", () => {
				const usd = Money.fromNumber(Currency.USD, 50.75);
				const result = Money.convert(usd, Currency.JPY, 157.91804259474478);
				// 50.75 * 157.91804259474478 = 8014.34 JPY
				expect(result.toNumber()).toBe(8014);
			});

			test("converts JPY (0 decimals) to USD (2 decimals)", () => {
				const jpy = Money.fromNumber(Currency.JPY, 8014);
				const result = Money.convert(jpy, Currency.USD, 1 / 157.91804259474478);
				expect(result.toNumber()).toBe(50.75);
			});

			test("converts USD (2 decimals) to BTC (8 decimals)", () => {
				const usd = Money.fromNumber(Currency.USD, 92549);
				const result = Money.convert(usd, Currency.BTC, 0.00001080599586018141);
				// 92549 * 0.00001080599586018141 ≈ 1 BTC
				expect(result.toNumber()).toBeCloseTo(1, 2);
			});

			test("converts BTC (8 decimals) to JPY (0 decimals)", () => {
				const btc = Money.fromNumber(Currency.BTC, 0.001);
				// BTC to USD: 1/0.00001080599586018141 ≈ 92549
				// USD to JPY: 92549 * 157.91804259474478 ≈ 14,617,839
				// Combined rate: 92549 * 157.91804259474478 / 1000 = 14617.839
				const combinedRate = (1 / 0.00001080599586018141) * 157.91804259474478;
				const result = Money.convert(btc, Currency.JPY, combinedRate);
				expect(result.toNumber()).toBeGreaterThan(14000);
			});

			test("converts USDH (3 decimals) to USD (2 decimals)", () => {
				const usdh = Money.fromNumber(Currency.USDH, 100.125);
				const result = Money.convert(usdh, Currency.USD, 1);
				// Should round to 2 decimal places
				expect(result.toNumber()).toBe(100.13);
			});

			test("converts USD (2 decimals) to USDH (3 decimals)", () => {
				const usd = Money.fromNumber(Currency.USD, 100.12);
				const result = Money.convert(usd, Currency.USDH, 1);
				expect(result.toNumber()).toBe(100.12);
			});
		});

		describe("edge cases and boundary conditions", () => {
			test("converts zero amount", () => {
				const usd = Money.fromMinor(Currency.USD, 0);
				const result = Money.convert(usd, Currency.EUR, 1.389);
				expect(result.toNumber()).toBe(0);
				expect(result.currency).toBe(Currency.EUR);
			});

			test("converts negative amount", () => {
				const usd = Money.fromNumber(Currency.USD, -100);
				const result = Money.convert(usd, Currency.EUR, 1.389);
				expect(result.toNumber()).toBe(-138.9);
			});

			test("converts minimum representable USD value (1 cent)", () => {
				const usd = Money.fromMinor(Currency.USD, 1);
				const result = Money.convert(usd, Currency.JPY, 157.91804259474478);
				// 0.01 * 157.91804259474478 = 1.579 JPY ≈ 2
				expect(result.toNumber()).toBe(2);
			});

			test("converts minimum representable BTC value (1 satoshi)", () => {
				const btc = Money.fromMinor(Currency.BTC, 1);
				const usdRate = 1 / 0.00001080599586018141;
				const result = Money.convert(btc, Currency.USD, usdRate);
				// Very small BTC amount may round to 0 USD cents
				expect(result.toMinor()).toBeGreaterThanOrEqual(0);
			});

			test("handles very small rate", () => {
				const usd = Money.fromNumber(Currency.USD, 1000000);
				const result = Money.convert(usd, Currency.BTC, 0.00000001);
				// 1000000 * 0.00000001 = 0.01 BTC = 1000000 satoshis
				expect(result.toNumber()).toBe(0.01);
				expect(result.toMinor()).toBe(1000000);
			});

			test("handles very large rate", () => {
				const btc = Money.fromNumber(Currency.BTC, 0.00001);
				const result = Money.convert(btc, Currency.USD, 100000);
				// 0.00001 * 100000 = 1 USD
				expect(result.toNumber()).toBe(1);
			});

			test("handles rate with many decimal places", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.EUR, 1.123456789012345);
				expect(result.toNumber()).toBe(112.35);
			});

			test("preserves precision with large amounts", () => {
				const usd = Money.fromNumber(Currency.USD, 1000000);
				const result = Money.convert(usd, Currency.JPY, 157.91804259474478);
				expect(result.toNumber()).toBe(157918043);
			});

			test("handles conversion that results in sub-minor-unit value", () => {
				const usd = Money.fromMinor(Currency.USD, 1); // 1 cent
				const result = Money.convert(usd, Currency.BTC, 0.00000001);
				// 0.01 * 0.00000001 = 0.0000000001 BTC ≈ 0 satoshis
				expect(result.toMinor()).toBe(0);
			});
		});

		describe("rate validation", () => {
			test("throws for rate of 0", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				expect(() => Money.convert(usd, Currency.EUR, 0)).toThrow();
			});

			test("throws for negative rate", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				expect(() => Money.convert(usd, Currency.EUR, -1.389)).toThrow();
			});

			test("throws for NaN rate", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				expect(() => Money.convert(usd, Currency.EUR, NaN)).toThrow();
			});

			test("throws for Infinity rate", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				expect(() => Money.convert(usd, Currency.EUR, Infinity)).toThrow();
			});

			test("throws for -Infinity rate", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				expect(() => Money.convert(usd, Currency.EUR, -Infinity)).toThrow();
			});
		});

		describe("immutability", () => {
			test("returns new Money instance", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.EUR, 1.389);
				expect(result).not.toBe(usd);
			});

			test("original Money is unchanged after conversion", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				Money.convert(usd, Currency.EUR, 1.389);
				expect(usd.toNumber()).toBe(100);
				expect(usd.currency).toBe(Currency.USD);
			});
		});

		describe("currency preservation", () => {
			test("result has target currency", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.GBP, 0.79);
				expect(result.currency).toBe(Currency.GBP);
			});

			test("result has correct currency code", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.AUD, 1.54);
				expect(result.currency.code).toBe("AUD");
			});

			test("result has correct decimal places from target currency", () => {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, Currency.JPY, 157);
				expect(result.currency.decimalPlaces).toBe(0);
			});
		});
	});

	describe("money.convert (instance method)", () => {
		test("delegates to Money.convert", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			const staticResult = Money.convert(usd, Currency.EUR, 1.389);
			const instanceResult = usd.convert(Currency.EUR, 1.389);
			expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
		});

		test("instance method supports rounding options", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			const result = usd.convert(Currency.EUR, 1.3899, { rounding: "floor" });
			// 100 * 1.3899 = 138.99 exactly (deterministic integer arithmetic)
			expect(result.toNumber()).toBe(138.99);
		});

		test("instance method chains with other operations", () => {
			const result = Money.fromNumber(Currency.USD, 100)
				.convert(Currency.EUR, 1.389)
				.incrementByPercent(20);
			// 100 * 1.389 = 138.90 EUR, then +20% = 166.68
			expect(result.toNumber()).toBe(166.68);
		});
	});

	describe("real-world conversion scenarios", () => {
		const EUR_RATE = 1.3892503971337602;
		const JPY_RATE = 157.91804259474478;
		const BTC_RATE = 0.00001080599586018141;
		const GBP_RATE = 0.79;
		const CAD_RATE = 1.36;
		const AUD_RATE = 1.54;

		test("e-commerce: convert USD product price to EUR", () => {
			const usdPrice = Money.fromNumber(Currency.USD, 29.99);
			const eurPrice = Money.convert(usdPrice, Currency.EUR, EUR_RATE);
			expect(eurPrice.toNumber()).toBe(41.66);
		});

		test("travel: convert USD spending budget to JPY", () => {
			const budget = Money.fromNumber(Currency.USD, 500);
			const jpyBudget = Money.convert(budget, Currency.JPY, JPY_RATE);
			expect(jpyBudget.toNumber()).toBe(78959);
		});

		test("crypto: convert USD investment to BTC", () => {
			const investment = Money.fromNumber(Currency.USD, 10000);
			const btcAmount = Money.convert(investment, Currency.BTC, BTC_RATE);
			expect(btcAmount.toNumber()).toBe(0.10805996);
		});

		test("invoicing: convert EUR invoice to USD for US client", () => {
			const eurInvoice = Money.fromNumber(Currency.EUR, 5000);
			const usdInvoice = Money.convert(eurInvoice, Currency.USD, 1 / EUR_RATE);
			// 5000 * (1 / 1.3892503971337602) ≈ $3599.06 USD (floating point)
			expect(usdInvoice.toNumber()).toBe(3599.06);
		});

		test("payroll: convert USD salary to GBP for UK employee", () => {
			const usdSalary = Money.fromNumber(Currency.USD, 8333.33);
			const gbpSalary = Money.convert(usdSalary, Currency.GBP, GBP_RATE);
			expect(gbpSalary.toNumber()).toBe(6583.33);
		});

		test("remittance: small amount conversion with precision", () => {
			const usdRemittance = Money.fromNumber(Currency.USD, 50);
			const jpyResult = Money.convert(usdRemittance, Currency.JPY, JPY_RATE);
			expect(jpyResult.toNumber()).toBe(7896);
		});

		test("marketplace: convert seller earnings from local currency to USD", () => {
			const cadEarnings = Money.fromNumber(Currency.CAD, 250);
			const usdEarnings = Money.convert(cadEarnings, Currency.USD, 1 / CAD_RATE);
			expect(usdEarnings.toNumber()).toBe(183.82);
		});

		test("forex: round-trip conversion should be close to original", () => {
			const usdOriginal = Money.fromNumber(Currency.USD, 1000);
			const eur = Money.convert(usdOriginal, Currency.EUR, EUR_RATE);
			const usdBack = Money.convert(eur, Currency.USD, 1 / EUR_RATE);
			// Due to rounding, may not be exactly 1000
			expect(usdBack.toNumber()).toBeCloseTo(1000, 0);
		});

		test("arbitrage check: multi-hop conversion", () => {
			const usd = Money.fromNumber(Currency.USD, 10000);
			// USD -> EUR -> GBP -> USD
			const eur = Money.convert(usd, Currency.EUR, EUR_RATE);
			const gbp = Money.convert(eur, Currency.GBP, GBP_RATE / EUR_RATE);
			const usdFinal = Money.convert(gbp, Currency.USD, 1 / GBP_RATE);
			// Should be approximately the same as original
			expect(Math.abs(usdFinal.toNumber() - 10000)).toBeLessThan(10);
		});

		test("micro-payment: very small USD to BTC conversion", () => {
			const microPayment = Money.fromNumber(Currency.USD, 0.10);
			const btcResult = Money.convert(microPayment, Currency.BTC, BTC_RATE);
			// 0.10 * 0.00001080599586018141 = 0.000001080599586 BTC ≈ 108 satoshis
			expect(btcResult.toMinor()).toBeGreaterThan(0);
		});

		test("large transaction: whale-sized BTC to USD", () => {
			const btcAmount = Money.fromNumber(Currency.BTC, 100);
			const usdResult = Money.convert(btcAmount, Currency.USD, 1 / BTC_RATE);
			// 100 / 0.00001080599586018141 ≈ $9,254,899
			expect(usdResult.toNumber()).toBeGreaterThan(9000000);
		});

		test("subscription: convert monthly USD fee to multiple currencies", () => {
			const monthlyFee = Money.fromNumber(Currency.USD, 9.99);

			const eurFee = Money.convert(monthlyFee, Currency.EUR, EUR_RATE);
			const gbpFee = Money.convert(monthlyFee, Currency.GBP, GBP_RATE);
			const jpyFee = Money.convert(monthlyFee, Currency.JPY, JPY_RATE);
			const audFee = Money.convert(monthlyFee, Currency.AUD, AUD_RATE);

			expect(eurFee.currency.code).toBe("EUR");
			expect(gbpFee.currency.code).toBe("GBP");
			expect(jpyFee.currency.code).toBe("JPY");
			expect(audFee.currency.code).toBe("AUD");
		});
	});

	describe("conversion overflow safety", () => {
		test("throws when conversion result exceeds safe integer range", () => {
			const large = Money.fromMinor(Currency.USD, Number.MAX_SAFE_INTEGER);
			expect(() => Money.convert(large, Currency.JPY, 157)).toThrow(/safe|range|too large/i);
		});

		test("handles large value with small rate safely", () => {
			const large = Money.fromNumber(Currency.USD, 1000000000);
			const result = Money.convert(large, Currency.BTC, 0.00001);
			expect(result.toNumber()).toBe(10000);
		});

		test("handles maximum safe BTC amount", () => {
			// Max safe integer in satoshis = 90,071,992.54740992 BTC
			const btc = Money.fromMinor(Currency.BTC, Number.MAX_SAFE_INTEGER);
			// With a small enough rate, conversion should work
			const result = Money.convert(btc, Currency.USD, 0.000001);
			expect(result.toMinor()).toBeGreaterThan(0);
		});
	});

	describe("conversion precision edge cases", () => {
		test("maintains precision through chained conversions", () => {
			let money = Money.fromNumber(Currency.USD, 100);
			// Chain multiple conversions
			money = Money.convert(money, Currency.EUR, 1.1);
			money = Money.convert(money, Currency.GBP, 0.85);
			money = Money.convert(money, Currency.USD, 1 / (1.1 * 0.85));
			// Should be approximately 100
			expect(money.toNumber()).toBeCloseTo(100, 0);
		});

		test("handles irrational-like exchange rates", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			// Use PI as a rate
			const result = Money.convert(usd, Currency.EUR, Math.PI);
			expect(result.toNumber()).toBe(314.16);
		});

		test("handles rate with repeating decimals", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			// 1/3 = 0.333...
			const result = Money.convert(usd, Currency.EUR, 1 / 3);
			expect(result.toNumber()).toBe(33.33);
		});

		test("handles rate close to 1", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			const result = Money.convert(usd, Currency.CAD, 1.0001);
			expect(result.toNumber()).toBe(100.01);
		});

		test("handles rate very close to 0", () => {
			const usd = Money.fromNumber(Currency.USD, 1000000);
			const result = Money.convert(usd, Currency.BTC, 0.000000001);
			// 1000000 * 0.000000001 = 0.001 BTC = 100000 satoshis
			expect(result.toMinor()).toBe(100000);
		});

		test("conversion with exact representation maintains accuracy", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			// Rate 1.5 has exact binary representation
			const result = Money.convert(usd, Currency.EUR, 1.5);
			expect(result.toNumber()).toBe(150);
		});

		test("conversion with inexact rate rounds appropriately", () => {
			const usd = Money.fromNumber(Currency.USD, 100);
			// 0.1 has no exact binary representation
			const result = Money.convert(usd, Currency.EUR, 0.1);
			expect(result.toNumber()).toBe(10);
		});
	});

	describe("conversion with different source currencies", () => {
		test("converts from each defined currency to USD", () => {
			const currencies = [
				Currency.EUR,
				Currency.GBP,
				Currency.JPY,
				Currency.CAD,
				Currency.AUD,
				Currency.ZAR,
				Currency.AED,
				Currency.BTC,
			];

			for (const sourceCurrency of currencies) {
				const amount = Money.fromNumber(sourceCurrency, 100);
				const result = Money.convert(amount, Currency.USD, 0.5);
				expect(result.currency).toBe(Currency.USD);
			}
		});

		test("converts from USD to each defined currency", () => {
			const currencies = [
				Currency.EUR,
				Currency.GBP,
				Currency.JPY,
				Currency.CAD,
				Currency.AUD,
				Currency.ZAR,
				Currency.AED,
				Currency.BTC,
			];

			for (const targetCurrency of currencies) {
				const usd = Money.fromNumber(Currency.USD, 100);
				const result = Money.convert(usd, targetCurrency, 1.5);
				expect(result.currency).toBe(targetCurrency);
			}
		});

		test("cross-currency conversion (non-USD pair)", () => {
			const eur = Money.fromNumber(Currency.EUR, 100);
			// EUR to GBP rate (example: 0.86)
			const gbp = Money.convert(eur, Currency.GBP, 0.86);
			expect(gbp.currency).toBe(Currency.GBP);
			expect(gbp.toNumber()).toBe(86);
		});
	});
});
