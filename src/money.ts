import type { CurrencyType } from "./currency";

export type RoundingMode = "floor" | "ceil" | "round" | "trunc";

export interface FromNumberOptions {
  rounding?: RoundingMode;
  strict?: boolean;
}

function currenciesMatch(a: CurrencyType, b: CurrencyType): boolean {
  return a.code === b.code && a.decimalPlaces === b.decimalPlaces;
}

function assertSafeResult(value: bigint): void {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(-Number.MAX_SAFE_INTEGER)) {
    throw new Error("Result too large: exceeds safe integer range");
  }
}

export class Money {
  readonly #minor: bigint;
  readonly #currency: CurrencyType;

  private constructor(minor: bigint, currency: CurrencyType) {
    this.#minor = minor;
    this.#currency = currency;
  }

  get currency(): CurrencyType {
    return this.#currency;
  }

  static fromNumber(
    currency: CurrencyType,
    value: number,
    options: FromNumberOptions = {}
  ): Money {
    const { rounding, strict } = options;
    const multiplier = 10 ** currency.decimalPlaces;
    const rawMinor = value * multiplier;

    if (Math.abs(rawMinor) > Number.MAX_SAFE_INTEGER) {
      throw new Error(
        `Value too large: ${value} exceeds safe integer range when converted to minor units`
      );
    }

    if (strict) {
      if (!Number.isInteger(rawMinor)) {
        throw new Error(
          `Precision loss: ${value} cannot be exactly represented with ${currency.decimalPlaces} decimal places`
        );
      }
      return new Money(BigInt(rawMinor), currency);
    }

    let minor: number;
    switch (rounding) {
      case "floor":
        minor = Math.floor(rawMinor);
        break;
      case "ceil":
        minor = Math.ceil(rawMinor);
        break;
      case "round":
        minor = Math.round(rawMinor);
        break;
      case "trunc":
        minor = Math.trunc(rawMinor);
        break;
      default:
        minor = Math.trunc(rawMinor);
    }

    return new Money(BigInt(minor), currency);
  }

  static fromMinor(currency: CurrencyType, minor: number): Money {
    return new Money(BigInt(minor), currency);
  }

  toNumber(): number {
    const divisor = 10 ** this.#currency.decimalPlaces;
    return Number(this.#minor) / divisor;
  }

  toMinor(): number {
    return Number(this.#minor);
  }

  // Static arithmetic methods

  static add(a: Money, b: Money): Money {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot add ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    const result = a.#minor + b.#minor;
    assertSafeResult(result);
    return new Money(result, a.#currency);
  }

  static subtract(a: Money, b: Money): Money {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot subtract ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    const result = a.#minor - b.#minor;
    assertSafeResult(result);
    return new Money(result, a.#currency);
  }

  static sum(items: Money[]): Money {
    if (items.length === 0) {
      throw new Error("Cannot sum empty array: at least one Money value required");
    }
    const currency = items[0].#currency;
    let total = 0n;
    for (const item of items) {
      if (!currenciesMatch(item.#currency, currency)) {
        throw new Error(
          `Cannot sum ${currency.code} and ${item.#currency.code}: currency mismatch`
        );
      }
      total += item.#minor;
    }
    assertSafeResult(total);
    return new Money(total, currency);
  }

  // Static comparison methods

  static equals(a: Money, b: Money): boolean {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    return a.#minor === b.#minor;
  }

  static compare(a: Money, b: Money): number {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    if (a.#minor < b.#minor) return -1;
    if (a.#minor > b.#minor) return 1;
    return 0;
  }

  static lessThan(a: Money, b: Money): boolean {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    return a.#minor < b.#minor;
  }

  static greaterThan(a: Money, b: Money): boolean {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    return a.#minor > b.#minor;
  }

  static lessThanOrEqual(a: Money, b: Money): boolean {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    return a.#minor <= b.#minor;
  }

  static greaterThanOrEqual(a: Money, b: Money): boolean {
    if (!currenciesMatch(a.#currency, b.#currency)) {
      throw new Error(
        `Cannot compare ${a.#currency.code} and ${b.#currency.code}: currency mismatch`
      );
    }
    return a.#minor >= b.#minor;
  }

  // Instance method wrappers

  add(other: Money): Money {
    return Money.add(this, other);
  }

  subtract(other: Money): Money {
    return Money.subtract(this, other);
  }

  equals(other: Money): boolean {
    return Money.equals(this, other);
  }

  compare(other: Money): number {
    return Money.compare(this, other);
  }

  lessThan(other: Money): boolean {
    return Money.lessThan(this, other);
  }

  greaterThan(other: Money): boolean {
    return Money.greaterThan(this, other);
  }

  lessThanOrEqual(other: Money): boolean {
    return Money.lessThanOrEqual(this, other);
  }

  greaterThanOrEqual(other: Money): boolean {
    return Money.greaterThanOrEqual(this, other);
  }
}
