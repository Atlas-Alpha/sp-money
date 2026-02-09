import type { CurrencyDefinition } from "./currency";

export type RoundingMode = "floor" | "ceil" | "round" | "trunc";

export interface FromNumberOptions {
	rounding?: RoundingMode;
	strict?: boolean;
}

// Internal precision for scaled integer arithmetic
// 20 decimal places to handle rates like 0.00001080599586018141
const INTERNAL_PRECISION = 20;
const INTERNAL_SCALE = 10n ** BigInt(INTERNAL_PRECISION);

/**
 * Converts a number to a decimal string representation.
 * Uses toString() which often gives cleaner results (e.g., 1.005 stays "1.005"),
 * but falls back to toPrecision for edge cases with very small/large numbers.
 */
function numberToDecimalString(n: number): string {
	// Handle special cases
	if (!Number.isFinite(n)) {
		throw new Error(`Cannot convert ${n} to decimal string`);
	}
	if (n === 0) return "0";

	// toString() often gives the cleanest representation
	const str = n.toString();

	// If it's in scientific notation, use toPrecision for more digits
	if (str.includes("e") || str.includes("E")) {
		return n.toPrecision(17);
	}

	return str;
}

function parseDecimalStringToScaled(str: string): bigint {
	// Handle sign
	const negative = str.startsWith("-");
	if (negative) str = str.slice(1);

	// Handle scientific notation
	const eIndex = str.toLowerCase().indexOf("e");
	if (eIndex !== -1) {
		const mantissa = str.slice(0, eIndex);
		const exponent = parseInt(str.slice(eIndex + 1), 10);
		const scaledMantissa = parseDecimalStringToScaled(mantissa);
		const sign = negative ? -1n : 1n;
		if (exponent >= 0) {
			return sign * scaledMantissa * 10n ** BigInt(exponent);
		} else {
			return (sign * scaledMantissa) / 10n ** BigInt(-exponent);
		}
	}

	// Split into integer and decimal parts
	const dotIndex = str.indexOf(".");
	let intPart: string;
	let decPart: string;
	if (dotIndex === -1) {
		intPart = str || "0";
		decPart = "";
	} else {
		intPart = str.slice(0, dotIndex) || "0";
		decPart = str.slice(dotIndex + 1);
	}

	// Pad or truncate decimal part to internal precision
	decPart = decPart
		.padEnd(INTERNAL_PRECISION, "0")
		.slice(0, INTERNAL_PRECISION);

	const scaledInt = BigInt(intPart) * INTERNAL_SCALE;
	const scaledDec = BigInt(decPart);
	const result = scaledInt + scaledDec;

	return negative ? -result : result;
}

function roundScaledToMinor(
	scaled: bigint,
	targetDecimalPlaces: number,
	mode: RoundingMode,
): bigint {
	const targetScale = 10n ** BigInt(targetDecimalPlaces);
	const divisor = INTERNAL_SCALE / targetScale;

	const quotient = scaled / divisor;
	const remainder = scaled % divisor;

	if (remainder === 0n) return quotient;

	const isNegative = scaled < 0n;
	const absRemainder = isNegative ? -remainder : remainder;
	const halfDivisor = divisor / 2n;

	switch (mode) {
		case "floor":
			return isNegative ? quotient - 1n : quotient;
		case "ceil":
			return isNegative ? quotient : quotient + 1n;
		case "trunc":
			return quotient;
		default:
			// Round half away from zero
			if (
				absRemainder > halfDivisor ||
				(absRemainder === halfDivisor && !isNegative)
			) {
				return isNegative ? quotient - 1n : quotient + 1n;
			}
			return quotient;
	}
}

function assertCurrenciesMatch(
	a: CurrencyDefinition,
	b: CurrencyDefinition,
	operation: string,
): void {
	if (a.code !== b.code || a.decimalPlaces !== b.decimalPlaces) {
		throw new Error(
			`Cannot ${operation} ${a.code} and ${b.code}: currency mismatch`,
		);
	}
}

function assertSafeResult(value: bigint): void {
	if (
		value > BigInt(Number.MAX_SAFE_INTEGER) ||
		value < BigInt(-Number.MAX_SAFE_INTEGER)
	) {
		throw new Error("Result too large: exceeds safe integer range");
	}
}

export class Money {
	readonly #minor: bigint;
	readonly #currency: CurrencyDefinition;

	private constructor(minor: bigint, currency: CurrencyDefinition) {
		this.#minor = minor;
		this.#currency = currency;
	}

	get currency(): CurrencyDefinition {
		return this.#currency;
	}

	static fromNumber(
		currency: CurrencyDefinition,
		value: number,
		options: FromNumberOptions = {},
	): Money {
		const { rounding = "round", strict } = options;

		// Check if the value, when converted to minor units, would exceed safe integer range
		const multiplier = 10 ** currency.decimalPlaces;
		const estimatedMinor = Math.abs(value) * multiplier;
		if (estimatedMinor > Number.MAX_SAFE_INTEGER) {
			throw new Error(
				`Value too large: ${value} exceeds safe integer range when converted to minor units`,
			);
		}

		// Convert to string to preserve decimal representation
		const valueStr = numberToDecimalString(value);
		const scaledValue = parseDecimalStringToScaled(valueStr);

		// For strict mode, check if value can be exactly represented
		if (strict) {
			const targetScale = 10n ** BigInt(currency.decimalPlaces);
			const divisor = INTERNAL_SCALE / targetScale;
			if (scaledValue % divisor !== 0n) {
				throw new Error(
					`Precision loss: ${value} cannot be exactly represented with ${currency.decimalPlaces} decimal places`,
				);
			}
		}

		const minor = roundScaledToMinor(
			scaledValue,
			currency.decimalPlaces,
			rounding,
		);
		assertSafeResult(minor);
		return new Money(minor, currency);
	}

	static fromMinor(currency: CurrencyDefinition, minor: number): Money {
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
		const first = items[0];
		if (first === undefined) {
			throw new Error(
				"Cannot sum empty array: at least one Money value required",
			);
		}
		const currency = first.#currency;
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

	// Conversion

	static convert(
		money: Money,
		targetCurrency: CurrencyDefinition,
		rate: number,
		options: { rounding?: RoundingMode } = {},
	): Money {
		if (!Number.isFinite(rate) || rate <= 0) {
			throw new Error("Exchange rate must be a finite positive number");
		}

		const { rounding = "round" } = options;

		// Parse rate to scaled bigint
		const scaledRate = parseDecimalStringToScaled(numberToDecimalString(rate));

		// Scale source to internal precision
		const sourceScale = 10n ** BigInt(money.#currency.decimalPlaces);
		const scaledSource = money.#minor * (INTERNAL_SCALE / sourceScale);

		// Multiply and scale back down
		const rawProduct = (scaledSource * scaledRate) / INTERNAL_SCALE;

		const resultMinor = roundScaledToMinor(
			rawProduct,
			targetCurrency.decimalPlaces,
			rounding,
		);
		assertSafeResult(resultMinor);
		return new Money(resultMinor, targetCurrency);
	}

	convert(
		targetCurrency: CurrencyDefinition,
		rate: number,
		options?: { rounding?: RoundingMode },
	): Money {
		return Money.convert(this, targetCurrency, rate, options);
	}

	// Rounding

	static roundTo(
		money: Money,
		increment: number,
		mode: RoundingMode = "round",
	): Money {
		if (!Number.isFinite(increment) || increment <= 0) {
			throw new Error("Rounding increment must be a finite positive number");
		}

		// Parse increment to scaled bigint
		const scaledIncrement = parseDecimalStringToScaled(
			numberToDecimalString(increment),
		);

		// Convert to minor units and verify exact representation
		const targetScale = 10n ** BigInt(money.#currency.decimalPlaces);
		const divisor = INTERNAL_SCALE / targetScale;

		if (scaledIncrement % divisor !== 0n) {
			throw new Error(
				`Rounding increment ${increment} cannot be exactly represented with ${money.#currency.decimalPlaces} decimal places`,
			);
		}

		const incrementMinor = scaledIncrement / divisor;
		if (incrementMinor === 0n) {
			throw new Error(
				"Rounding increment is too small for this currency's precision",
			);
		}

		const minor = money.#minor;
		const remainder = minor % incrementMinor;

		if (remainder === 0n) {
			return new Money(minor, money.#currency);
		}

		const base = minor - remainder;
		let rounded: bigint;

		switch (mode) {
			case "trunc":
				rounded = base;
				break;
			case "floor":
				rounded = minor < 0n ? base - incrementMinor : base;
				break;
			case "ceil":
				rounded = minor < 0n ? base : base + incrementMinor;
				break;
			default: {
				const absRemainder = remainder < 0n ? -remainder : remainder;
				const cmp = absRemainder * 2n - incrementMinor;
				if (cmp < 0n) {
					rounded = base;
				} else if (cmp > 0n) {
					rounded = minor < 0n ? base - incrementMinor : base + incrementMinor;
				} else {
					rounded = minor < 0n ? base : base + incrementMinor;
				}
				break;
			}
		}

		assertSafeResult(rounded);
		return new Money(rounded, money.#currency);
	}

	round(increment: number, mode?: RoundingMode): Money {
		return Money.roundTo(this, increment, mode);
	}

	// Percent operations

	static percentOf(
		money: Money,
		percent: number,
		options: { rounding?: RoundingMode } = {},
	): Money {
		const { rounding = "round" } = options;

		const scaledPercent = parseDecimalStringToScaled(
			numberToDecimalString(percent),
		);
		const scaledHundred = 100n * INTERNAL_SCALE;

		// Scale money to internal precision
		const currencyScale = 10n ** BigInt(money.#currency.decimalPlaces);
		const scaledMoney = money.#minor * (INTERNAL_SCALE / currencyScale);

		// Calculate: scaledMoney * scaledPercent / scaledHundred
		const rawResult = (scaledMoney * scaledPercent) / scaledHundred;

		const resultMinor = roundScaledToMinor(
			rawResult,
			money.#currency.decimalPlaces,
			rounding,
		);
		assertSafeResult(resultMinor);
		return new Money(resultMinor, money.#currency);
	}

	static incrementByPercent(
		money: Money,
		percent: number,
		options: { rounding?: RoundingMode } = {},
	): Money {
		const { rounding = "round" } = options;

		const scaledPercent = parseDecimalStringToScaled(
			numberToDecimalString(percent),
		);
		const scaledHundred = 100n * INTERNAL_SCALE;

		// Scale money to internal precision
		const currencyScale = 10n ** BigInt(money.#currency.decimalPlaces);
		const scaledMoney = money.#minor * (INTERNAL_SCALE / currencyScale);

		// Calculate: scaledMoney * (100 + percent) / 100
		const rawResult =
			(scaledMoney * (scaledHundred + scaledPercent)) / scaledHundred;

		const resultMinor = roundScaledToMinor(
			rawResult,
			money.#currency.decimalPlaces,
			rounding,
		);
		assertSafeResult(resultMinor);
		return new Money(resultMinor, money.#currency);
	}

	static decrementByPercent(
		money: Money,
		percent: number,
		options: { rounding?: RoundingMode } = {},
	): Money {
		const { rounding = "round" } = options;

		const scaledPercent = parseDecimalStringToScaled(
			numberToDecimalString(percent),
		);
		const scaledHundred = 100n * INTERNAL_SCALE;

		// Scale money to internal precision
		const currencyScale = 10n ** BigInt(money.#currency.decimalPlaces);
		const scaledMoney = money.#minor * (INTERNAL_SCALE / currencyScale);

		// Calculate: scaledMoney * (100 - percent) / 100
		const rawResult =
			(scaledMoney * (scaledHundred - scaledPercent)) / scaledHundred;

		const resultMinor = roundScaledToMinor(
			rawResult,
			money.#currency.decimalPlaces,
			rounding,
		);
		assertSafeResult(resultMinor);
		return new Money(resultMinor, money.#currency);
	}

	percentOf(percent: number, options?: { rounding?: RoundingMode }): Money {
		return Money.percentOf(this, percent, options);
	}

	incrementByPercent(
		percent: number,
		options?: { rounding?: RoundingMode },
	): Money {
		return Money.incrementByPercent(this, percent, options);
	}

	decrementByPercent(
		percent: number,
		options?: { rounding?: RoundingMode },
	): Money {
		return Money.decrementByPercent(this, percent, options);
	}

	// Serialization

	toJSON(): { amount: number; currency: string } {
		return {
			amount: this.toMinor(),
			currency: this.#currency.code,
		};
	}
}
