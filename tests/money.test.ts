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
      const money = Money.fromNumber(Currency.USD, 12.345, { rounding: "floor" });
      expect(money.toMinor()).toBe(1234);
    });

    test("rounds up with ceil", () => {
      const money = Money.fromNumber(Currency.USD, 12.341, { rounding: "ceil" });
      expect(money.toMinor()).toBe(1235);
    });

    test("rounds to nearest with round", () => {
      const money1 = Money.fromNumber(Currency.USD, 12.344, { rounding: "round" });
      expect(money1.toMinor()).toBe(1234);

      const money2 = Money.fromNumber(Currency.USD, 12.345, { rounding: "round" });
      expect(money2.toMinor()).toBe(1235);
    });

    test("truncates with trunc", () => {
      const money = Money.fromNumber(Currency.USD, 12.349, { rounding: "trunc" });
      expect(money.toMinor()).toBe(1234);
    });

    test("floor rounds negative towards negative infinity", () => {
      const money = Money.fromNumber(Currency.USD, -12.341, { rounding: "floor" });
      expect(money.toMinor()).toBe(-1235);
    });

    test("ceil rounds negative towards positive infinity", () => {
      const money = Money.fromNumber(Currency.USD, -12.349, { rounding: "ceil" });
      expect(money.toMinor()).toBe(-1234);
    });

    test("trunc rounds negative towards zero", () => {
      const money = Money.fromNumber(Currency.USD, -12.349, { rounding: "trunc" });
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
      const value = 90071992547409.93;
      expect(() => Money.fromNumber(Currency.USD, value)).toThrow(
        "Value too large"
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

  describe("Money.add (static)", () => {
    test("adds two Money values of the same currency", () => {
      const a = Money.fromNumber(Currency.USD, 10.50);
      const b = Money.fromNumber(Currency.USD, 5.25);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(15.75);
      expect(result.toMinor()).toBe(1575);
    });

    test("adding zero returns equivalent value", () => {
      const a = Money.fromNumber(Currency.USD, 100);
      const zero = Money.fromMinor(Currency.USD, 0);
      const result = Money.add(a, zero);
      expect(result.toNumber()).toBe(100);
    });

    test("adding negative value works like subtraction", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, -3);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(7);
    });

    test("returns new Money instance (immutability)", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, 5);
      const result = Money.add(a, b);
      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
      expect(a.toNumber()).toBe(10);
      expect(b.toNumber()).toBe(5);
    });

    test("preserves currency on result", () => {
      const a = Money.fromNumber(Currency.EUR, 10);
      const b = Money.fromNumber(Currency.EUR, 5);
      const result = Money.add(a, b);
      expect(result.currency).toBe(Currency.EUR);
    });

    test("throws when adding different currencies", () => {
      const usd = Money.fromNumber(Currency.USD, 10);
      const eur = Money.fromNumber(Currency.EUR, 5);
      expect(() => Money.add(usd, eur)).toThrow();
    });

    test("throws descriptive error for currency mismatch", () => {
      const usd = Money.fromNumber(Currency.USD, 10);
      const gbp = Money.fromNumber(Currency.GBP, 5);
      expect(() => Money.add(usd, gbp)).toThrow(/USD.*GBP|currency|mismatch/i);
    });

    test("accepts equivalent currency objects (value equality)", () => {
      const usdClone = { code: "USD", decimalPlaces: 2 } as const;
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(usdClone, 5);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(15);
      expect(result.currency.code).toBe("USD");
    });

    test("handles JPY (0 decimal places) correctly", () => {
      const a = Money.fromNumber(Currency.JPY, 1000);
      const b = Money.fromNumber(Currency.JPY, 500);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(1500);
      expect(result.toMinor()).toBe(1500);
    });

    test("handles BTC (8 decimal places) correctly", () => {
      const a = Money.fromNumber(Currency.BTC, 0.00000001);
      const b = Money.fromNumber(Currency.BTC, 0.00000001);
      const result = Money.add(a, b);
      expect(result.toMinor()).toBe(2);
      expect(result.toNumber()).toBe(0.00000002);
    });

    test("handles USDH (3 decimal places) correctly", () => {
      const a = Money.fromNumber(Currency.USDH, 10.001);
      const b = Money.fromNumber(Currency.USDH, 0.002);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(10.003);
    });
  });

  describe("Money.subtract (static)", () => {
    test("subtracts two Money values of the same currency", () => {
      const a = Money.fromNumber(Currency.USD, 10.50);
      const b = Money.fromNumber(Currency.USD, 5.25);
      const result = Money.subtract(a, b);
      expect(result.toNumber()).toBe(5.25);
      expect(result.toMinor()).toBe(525);
    });

    test("subtracting zero returns equivalent value", () => {
      const a = Money.fromNumber(Currency.USD, 100);
      const zero = Money.fromMinor(Currency.USD, 0);
      const result = Money.subtract(a, zero);
      expect(result.toNumber()).toBe(100);
    });

    test("subtracting negative value works like addition", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, -3);
      const result = Money.subtract(a, b);
      expect(result.toNumber()).toBe(13);
    });

    test("allows negative results", () => {
      const a = Money.fromNumber(Currency.USD, 5);
      const b = Money.fromNumber(Currency.USD, 10);
      const result = Money.subtract(a, b);
      expect(result.toNumber()).toBe(-5);
      expect(result.toMinor()).toBe(-500);
    });

    test("returns new Money instance (immutability)", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, 5);
      const result = Money.subtract(a, b);
      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
      expect(a.toNumber()).toBe(10);
      expect(b.toNumber()).toBe(5);
    });

    test("preserves currency on result", () => {
      const a = Money.fromNumber(Currency.EUR, 10);
      const b = Money.fromNumber(Currency.EUR, 5);
      const result = Money.subtract(a, b);
      expect(result.currency).toBe(Currency.EUR);
    });

    test("throws when subtracting different currencies", () => {
      const usd = Money.fromNumber(Currency.USD, 10);
      const eur = Money.fromNumber(Currency.EUR, 5);
      expect(() => Money.subtract(usd, eur)).toThrow();
    });

    test("throws descriptive error for currency mismatch", () => {
      const cad = Money.fromNumber(Currency.CAD, 10);
      const aud = Money.fromNumber(Currency.AUD, 5);
      expect(() => Money.subtract(cad, aud)).toThrow(/CAD.*AUD|currency|mismatch/i);
    });

    test("accepts equivalent currency objects (value equality)", () => {
      const eurClone = { code: "EUR", decimalPlaces: 2 } as const;
      const a = Money.fromNumber(Currency.EUR, 10);
      const b = Money.fromNumber(eurClone, 3);
      const result = Money.subtract(a, b);
      expect(result.toNumber()).toBe(7);
      expect(result.currency.code).toBe("EUR");
    });

    test("handles JPY (0 decimal places) correctly", () => {
      const a = Money.fromNumber(Currency.JPY, 1000);
      const b = Money.fromNumber(Currency.JPY, 300);
      const result = Money.subtract(a, b);
      expect(result.toNumber()).toBe(700);
      expect(result.toMinor()).toBe(700);
    });

    test("handles BTC (8 decimal places) correctly", () => {
      const a = Money.fromMinor(Currency.BTC, 3);
      const b = Money.fromMinor(Currency.BTC, 1);
      const result = Money.subtract(a, b);
      expect(result.toMinor()).toBe(2);
      expect(result.toNumber()).toBe(0.00000002);
    });
  });

  describe("Money.sum (static)", () => {
    test("sums an array of Money values", () => {
      const items = [
        Money.fromNumber(Currency.USD, 10),
        Money.fromNumber(Currency.USD, 20),
        Money.fromNumber(Currency.USD, 30),
      ];
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(60);
    });

    test("works with single item array", () => {
      const items = [Money.fromNumber(Currency.USD, 42.50)];
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(42.50);
    });

    test("throws on empty array", () => {
      expect(() => Money.sum([])).toThrow();
    });

    test("throws descriptive error for empty array", () => {
      expect(() => Money.sum([])).toThrow(/empty|at least one/i);
    });

    test("throws when currencies don't match", () => {
      const items = [
        Money.fromNumber(Currency.USD, 10),
        Money.fromNumber(Currency.EUR, 20),
      ];
      expect(() => Money.sum(items)).toThrow();
    });

    test("throws descriptive error for mixed currencies", () => {
      const items = [
        Money.fromNumber(Currency.USD, 10),
        Money.fromNumber(Currency.GBP, 20),
        Money.fromNumber(Currency.EUR, 30),
      ];
      expect(() => Money.sum(items)).toThrow(/USD.*GBP|currency|mismatch/i);
    });

    test("accepts equivalent currency objects (value equality)", () => {
      const usdClone = { code: "USD", decimalPlaces: 2 } as const;
      const items = [
        Money.fromNumber(Currency.USD, 10),
        Money.fromNumber(usdClone, 20),
        Money.fromNumber(Currency.USD, 30),
      ];
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(60);
      expect(result.currency.code).toBe("USD");
    });

    test("preserves currency on result", () => {
      const items = [
        Money.fromNumber(Currency.CAD, 10),
        Money.fromNumber(Currency.CAD, 20),
      ];
      const result = Money.sum(items);
      expect(result.currency).toBe(Currency.CAD);
    });

    test("handles many items without precision loss", () => {
      const items = Array.from({ length: 100 }, () =>
        Money.fromNumber(Currency.USD, 0.01)
      );
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(1);
      expect(result.toMinor()).toBe(100);
    });

    test("handles mixed positive and negative values", () => {
      const items = [
        Money.fromNumber(Currency.USD, 100),
        Money.fromNumber(Currency.USD, -30),
        Money.fromNumber(Currency.USD, -20),
      ];
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(50);
    });

    test("handles BTC with many decimal places", () => {
      const items = [
        Money.fromMinor(Currency.BTC, 1),
        Money.fromMinor(Currency.BTC, 2),
        Money.fromMinor(Currency.BTC, 3),
      ];
      const result = Money.sum(items);
      expect(result.toMinor()).toBe(6);
    });
  });

  describe("instance method wrappers", () => {
    test("a.add(b) delegates to Money.add(a, b)", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, 5);
      const staticResult = Money.add(a, b);
      const instanceResult = a.add(b);
      expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
    });

    test("a.subtract(b) delegates to Money.subtract(a, b)", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, 5);
      const staticResult = Money.subtract(a, b);
      const instanceResult = a.subtract(b);
      expect(instanceResult.toMinor()).toBe(staticResult.toMinor());
    });

    test("instance add throws on currency mismatch", () => {
      const usd = Money.fromNumber(Currency.USD, 10);
      const eur = Money.fromNumber(Currency.EUR, 5);
      expect(() => usd.add(eur)).toThrow();
    });

    test("instance subtract throws on currency mismatch", () => {
      const usd = Money.fromNumber(Currency.USD, 10);
      const eur = Money.fromNumber(Currency.EUR, 5);
      expect(() => usd.subtract(eur)).toThrow();
    });
  });

  describe("arithmetic edge cases (weird results isolation)", () => {
    test("0.1 + 0.2 equals 0.3 (floating point classic)", () => {
      const a = Money.fromNumber(Currency.USD, 0.1);
      const b = Money.fromNumber(Currency.USD, 0.2);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(0.3);
      expect(result.toMinor()).toBe(30);
    });

    test("adding many small values doesn't accumulate errors", () => {
      const items = Array.from({ length: 100 }, () =>
        Money.fromNumber(Currency.USD, 0.01)
      );
      const result = Money.sum(items);
      expect(result.toNumber()).toBe(1);
      expect(result.toMinor()).toBe(100);
    });

    test("subtracting many small values doesn't accumulate errors", () => {
      let amount = Money.fromNumber(Currency.USD, 1);
      for (let i = 0; i < 100; i++) {
        amount = Money.subtract(amount, Money.fromNumber(Currency.USD, 0.01));
      }
      expect(amount.toNumber()).toBe(0);
      expect(amount.toMinor()).toBe(0);
    });

    test("large number addition doesn't lose precision", () => {
      const a = Money.fromMinor(Currency.USD, 9007199254740990);
      const b = Money.fromMinor(Currency.USD, 1);
      const result = Money.add(a, b);
      expect(result.toMinor()).toBe(9007199254740991);
    });

    test("large number subtraction doesn't lose precision", () => {
      const a = Money.fromMinor(Currency.USD, 9007199254740991);
      const b = Money.fromMinor(Currency.USD, 1);
      const result = Money.subtract(a, b);
      expect(result.toMinor()).toBe(9007199254740990);
    });

    test("chained instance methods maintain precision", () => {
      const start = Money.fromNumber(Currency.USD, 100);
      const result = start
        .add(Money.fromNumber(Currency.USD, 0.01))
        .subtract(Money.fromNumber(Currency.USD, 0.02))
        .add(Money.fromNumber(Currency.USD, 0.01));
      expect(result.toNumber()).toBe(100);
    });

    test("adding opposite values results in zero", () => {
      const positive = Money.fromNumber(Currency.USD, 99.99);
      const negative = Money.fromNumber(Currency.USD, -99.99);
      const result = Money.add(positive, negative);
      expect(result.toMinor()).toBe(0);
      expect(result.toNumber()).toBe(0);
    });

    test("self-subtraction results in zero", () => {
      const amount = Money.fromNumber(Currency.USD, 123.45);
      const result = Money.subtract(amount, Money.fromNumber(Currency.USD, 123.45));
      expect(result.toMinor()).toBe(0);
      expect(result.toNumber()).toBe(0);
    });

    test("handles very small BTC amounts without precision loss", () => {
      const a = Money.fromMinor(Currency.BTC, 1);
      const b = Money.fromMinor(Currency.BTC, 1);
      const result = Money.add(a, b);
      expect(result.toMinor()).toBe(2);
    });

    test("USDH sub-cent arithmetic is precise", () => {
      const a = Money.fromNumber(Currency.USDH, 0.005);
      const b = Money.fromNumber(Currency.USDH, 0.005);
      const result = Money.add(a, b);
      expect(result.toNumber()).toBe(0.01);
      expect(result.toMinor()).toBe(10);
    });
  });

  describe("arithmetic overflow safety", () => {
    test("Money.add throws when result exceeds safe integer range", () => {
      const a = Money.fromMinor(Currency.USD, Number.MAX_SAFE_INTEGER);
      const b = Money.fromMinor(Currency.USD, 1);
      expect(() => Money.add(a, b)).toThrow(/safe|range|too large/i);
    });

    test("Money.sum throws when total exceeds safe integer range", () => {
      const items = [
        Money.fromMinor(Currency.USD, Number.MAX_SAFE_INTEGER),
        Money.fromMinor(Currency.USD, 1),
      ];
      expect(() => Money.sum(items)).toThrow(/safe|range|too large/i);
    });
  });

  describe("Money.equals (static)", () => {
    test("returns true for equal values", () => {
      const a = Money.fromNumber(Currency.USD, 10.50);
      const b = Money.fromNumber(Currency.USD, 10.50);
      expect(Money.equals(a, b)).toBe(true);
    });

    test("returns false for different values", () => {
      const a = Money.fromNumber(Currency.USD, 10.50);
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
      expect(() => Money.equals(usd, gbp)).toThrow(/USD.*GBP|currency|mismatch/i);
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
      const a = Money.fromNumber(Currency.USD, 10.50);
      const b = Money.fromNumber(Currency.USD, 10.50);
      expect(Money.compare(a, b)).toBe(0);
    });

    test("returns positive when first is greater", () => {
      const a = Money.fromNumber(Currency.USD, 10.51);
      const b = Money.fromNumber(Currency.USD, 10.50);
      expect(Money.compare(a, b)).toBeGreaterThan(0);
    });

    test("returns negative when first is less", () => {
      const a = Money.fromNumber(Currency.USD, 10.49);
      const b = Money.fromNumber(Currency.USD, 10.50);
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
      expect(() => Money.compare(cad, aud)).toThrow(/CAD.*AUD|currency|mismatch/i);
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
      const b = Money.fromNumber(Currency.USDH, 10.000);
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
      expect(() => Money.lessThan(usd, gbp)).toThrow(/USD.*GBP|currency|mismatch/i);
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
      expect(() => Money.greaterThan(cad, aud)).toThrow(/CAD.*AUD|currency|mismatch/i);
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
