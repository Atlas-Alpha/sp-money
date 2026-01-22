import { describe, expect, test } from "bun:test";
import { Money, Currency } from "../src";

describe("Money", () => {
  describe("isZero", () => {
    test("returns true for zero value", () => {
      const money = Money.fromMinor(Currency.USD, 0);
      expect(money.isZero()).toBe(true);
    });

    test("returns true for zero created from number", () => {
      const money = Money.fromNumber(Currency.USD, 0);
      expect(money.isZero()).toBe(true);
    });

    test("returns false for positive value", () => {
      const money = Money.fromNumber(Currency.USD, 10);
      expect(money.isZero()).toBe(false);
    });

    test("returns false for negative value", () => {
      const money = Money.fromNumber(Currency.USD, -10);
      expect(money.isZero()).toBe(false);
    });

    test("returns false for smallest positive unit", () => {
      const money = Money.fromMinor(Currency.USD, 1);
      expect(money.isZero()).toBe(false);
    });

    test("returns false for smallest negative unit", () => {
      const money = Money.fromMinor(Currency.USD, -1);
      expect(money.isZero()).toBe(false);
    });

    test("works with JPY (0 decimal places)", () => {
      const zero = Money.fromMinor(Currency.JPY, 0);
      const nonZero = Money.fromMinor(Currency.JPY, 1);
      expect(zero.isZero()).toBe(true);
      expect(nonZero.isZero()).toBe(false);
    });

    test("works with BTC (8 decimal places)", () => {
      const zero = Money.fromMinor(Currency.BTC, 0);
      const oneSatoshi = Money.fromMinor(Currency.BTC, 1);
      expect(zero.isZero()).toBe(true);
      expect(oneSatoshi.isZero()).toBe(false);
    });
  });

  describe("isPositive", () => {
    test("returns true for positive value", () => {
      const money = Money.fromNumber(Currency.USD, 10);
      expect(money.isPositive()).toBe(true);
    });

    test("returns true for smallest positive unit", () => {
      const money = Money.fromMinor(Currency.USD, 1);
      expect(money.isPositive()).toBe(true);
    });

    test("returns false for zero", () => {
      const money = Money.fromMinor(Currency.USD, 0);
      expect(money.isPositive()).toBe(false);
    });

    test("returns false for negative value", () => {
      const money = Money.fromNumber(Currency.USD, -10);
      expect(money.isPositive()).toBe(false);
    });

    test("returns false for smallest negative unit", () => {
      const money = Money.fromMinor(Currency.USD, -1);
      expect(money.isPositive()).toBe(false);
    });

    test("works with JPY (0 decimal places)", () => {
      const positive = Money.fromNumber(Currency.JPY, 1);
      const zero = Money.fromMinor(Currency.JPY, 0);
      expect(positive.isPositive()).toBe(true);
      expect(zero.isPositive()).toBe(false);
    });

    test("works with BTC (8 decimal places)", () => {
      const oneSatoshi = Money.fromMinor(Currency.BTC, 1);
      expect(oneSatoshi.isPositive()).toBe(true);
    });

    test("works with USDH (3 decimal places)", () => {
      const positive = Money.fromNumber(Currency.USDH, 0.001);
      expect(positive.isPositive()).toBe(true);
    });
  });

  describe("isNegative", () => {
    test("returns true for negative value", () => {
      const money = Money.fromNumber(Currency.USD, -10);
      expect(money.isNegative()).toBe(true);
    });

    test("returns true for smallest negative unit", () => {
      const money = Money.fromMinor(Currency.USD, -1);
      expect(money.isNegative()).toBe(true);
    });

    test("returns false for zero", () => {
      const money = Money.fromMinor(Currency.USD, 0);
      expect(money.isNegative()).toBe(false);
    });

    test("returns false for positive value", () => {
      const money = Money.fromNumber(Currency.USD, 10);
      expect(money.isNegative()).toBe(false);
    });

    test("returns false for smallest positive unit", () => {
      const money = Money.fromMinor(Currency.USD, 1);
      expect(money.isNegative()).toBe(false);
    });

    test("works with JPY (0 decimal places)", () => {
      const negative = Money.fromNumber(Currency.JPY, -1);
      const zero = Money.fromMinor(Currency.JPY, 0);
      expect(negative.isNegative()).toBe(true);
      expect(zero.isNegative()).toBe(false);
    });

    test("works with BTC (8 decimal places)", () => {
      const negativeSatoshi = Money.fromMinor(Currency.BTC, -1);
      expect(negativeSatoshi.isNegative()).toBe(true);
    });

    test("works with USDH (3 decimal places)", () => {
      const negative = Money.fromNumber(Currency.USDH, -0.001);
      expect(negative.isNegative()).toBe(true);
    });
  });

  describe("predicate combinations", () => {
    test("zero is neither positive nor negative", () => {
      const zero = Money.fromMinor(Currency.USD, 0);
      expect(zero.isZero()).toBe(true);
      expect(zero.isPositive()).toBe(false);
      expect(zero.isNegative()).toBe(false);
    });

    test("positive is not zero and not negative", () => {
      const positive = Money.fromNumber(Currency.USD, 100);
      expect(positive.isZero()).toBe(false);
      expect(positive.isPositive()).toBe(true);
      expect(positive.isNegative()).toBe(false);
    });

    test("negative is not zero and not positive", () => {
      const negative = Money.fromNumber(Currency.USD, -100);
      expect(negative.isZero()).toBe(false);
      expect(negative.isPositive()).toBe(false);
      expect(negative.isNegative()).toBe(true);
    });

    test("result of subtraction can be checked with predicates", () => {
      const a = Money.fromNumber(Currency.USD, 10);
      const b = Money.fromNumber(Currency.USD, 10);
      const result = a.subtract(b);
      expect(result.isZero()).toBe(true);
    });

    test("predicates work after arithmetic operations", () => {
      const start = Money.fromNumber(Currency.USD, 5);
      const added = start.add(Money.fromNumber(Currency.USD, 10));
      const subtracted = start.subtract(Money.fromNumber(Currency.USD, 10));

      expect(added.isPositive()).toBe(true);
      expect(subtracted.isNegative()).toBe(true);
    });
  });
});
