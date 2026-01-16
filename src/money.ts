import type { CurrencyType } from "./currency";

export type RoundingMode = "floor" | "ceil" | "round" | "trunc";

export interface FromNumberOptions {
  rounding?: RoundingMode;
  strict?: boolean;
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
}
