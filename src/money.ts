import type { CurrencyType } from "./currency";

export type RoundingMode = "floor" | "ceil" | "round" | "trunc";

export interface FromNumberOptions {
  rounding?: RoundingMode;
  strict?: boolean;
}

function assertCurrenciesMatch(a: CurrencyType, b: CurrencyType, operation: string): void {
  if (a.code !== b.code || a.decimalPlaces !== b.decimalPlaces) {
    throw new Error(`Cannot ${operation} ${a.code} and ${b.code}: currency mismatch`);
  }
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
    assertCurrenciesMatch(a.#currency, b.#currency, "add");
    const result = a.#minor + b.#minor;
    assertSafeResult(result);
    return new Money(result, a.#currency);
  }

  static subtract(a: Money, b: Money): Money {
    assertCurrenciesMatch(a.#currency, b.#currency, "subtract");
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
      assertCurrenciesMatch(item.#currency, currency, "sum");
      total += item.#minor;
    }
    assertSafeResult(total);
    return new Money(total, currency);
  }

  // Static comparison methods

  static equals(a: Money, b: Money): boolean {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
    return a.#minor === b.#minor;
  }

  static compare(a: Money, b: Money): number {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
    if (a.#minor < b.#minor) return -1;
    if (a.#minor > b.#minor) return 1;
    return 0;
  }

  static lessThan(a: Money, b: Money): boolean {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
    return a.#minor < b.#minor;
  }

  static greaterThan(a: Money, b: Money): boolean {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
    return a.#minor > b.#minor;
  }

  static lessThanOrEqual(a: Money, b: Money): boolean {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
    return a.#minor <= b.#minor;
  }

  static greaterThanOrEqual(a: Money, b: Money): boolean {
    assertCurrenciesMatch(a.#currency, b.#currency, "compare");
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

  // Predicates

  isZero(): boolean {
    return this.#minor === 0n;
  }

  isPositive(): boolean {
    return this.#minor > 0n;
  }

  isNegative(): boolean {
    return this.#minor < 0n;
  }

  // Allocation

  static allocate(money: Money, parts: number): Money[] {
    if (!Number.isInteger(parts) || parts < 1) {
      throw new Error("Allocation count must be a positive integer");
    }
    if (!Number.isSafeInteger(parts)) {
      throw new Error("Allocation count must be a safe integer");
    }

    const partsBigInt = BigInt(parts);
    const base = money.#minor / partsBigInt;
    const remainder = money.#minor % partsBigInt;
    const absRemainder = remainder < 0n ? -remainder : remainder;
    const sign = remainder < 0n ? -1n : 1n;

    const result: Money[] = [];
    for (let i = 0n; i < partsBigInt; i++) {
      const extra = i < absRemainder ? sign : 0n;
      result.push(new Money(base + extra, money.#currency));
    }

    return result;
  }

  allocate(parts: number): Money[] {
    return Money.allocate(this, parts);
  }
}
