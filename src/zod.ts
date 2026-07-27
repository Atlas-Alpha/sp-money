import {
	Currency,
	type CurrencyCode,
	type CurrencyDefinition,
	defineCurrency,
	Money,
	type SerializedMoney,
} from "@storepass/money";
import { z } from "zod";

const builtInCurrencyCodes = Object.keys(Currency) as [
	CurrencyCode,
	...CurrencyCode[],
];

/** Schema for the currency codes included with @storepass/money. */
export const currencyCodeSchema = z.enum(builtInCurrencyCodes);

/** Schema for built-in and custom currency definitions. */
export const currencyDefinitionSchema = z
	.object({
		code: z.string().min(1),
		decimalPlaces: z.number().int().nonnegative(),
		numericCode: z.number().int().min(0).max(999).optional(),
		iso4217: z.boolean().optional(),
		displayCode: z
			.string()
			.regex(/^[A-Z]{3}$/)
			.optional(),
	})
	.superRefine((currency, context) => {
		try {
			defineCurrency(currency.code, currency.decimalPlaces, {
				numericCode: currency.numericCode,
				iso4217: currency.iso4217,
				displayCode: currency.displayCode,
			});
		} catch (error) {
			context.addIssue({
				code: "custom",
				message:
					error instanceof Error
						? error.message
						: "Invalid currency definition",
			});
		}
	}) satisfies z.ZodType<CurrencyDefinition>;

/**
 * Schema for Money's JSON-safe wire representation.
 *
 * `amount` is a safe integer in minor units. Custom currency codes are allowed.
 */
export const serializedMoneySchema = z.object({
	amount: z.number().int(),
	currency: z.string().min(1),
}) satisfies z.ZodType<SerializedMoney>;

/** Short alias for serializedMoneySchema. */
export const moneySchema = serializedMoneySchema;

/** Serialized Money restricted to the package's built-in currencies. */
export const builtInSerializedMoneySchema = serializedMoneySchema.extend({
	currency: currencyCodeSchema,
});

/** Schema for an already-hydrated Money instance. */
export const moneyInstanceSchema = z.custom<Money>(
	(value) => value instanceof Money,
	{ error: "Expected Money instance" },
);

export type BuiltInSerializedMoney = z.infer<
	typeof builtInSerializedMoneySchema
>;

export type CurrencyRegistry = Readonly<Record<string, CurrencyDefinition>>;

function assertCurrencyRegistry(currencies: CurrencyRegistry): void {
	for (const [code, currency] of Object.entries(currencies)) {
		if (currency.code !== code) {
			throw new Error(
				`Currency registry key "${code}" does not match definition code "${currency.code}"`,
			);
		}
		currencyDefinitionSchema.parse(currency);
	}
}

/**
 * Creates a bidirectional Zod codec for a currency registry.
 *
 * Decoding turns serialized minor units into Money. Encoding calls toJSON and
 * rejects Money values whose currency is not represented by the registry with
 * the same precision.
 */
export function createMoneyCodec<
	const TCurrencyRegistry extends CurrencyRegistry,
>(currencies: TCurrencyRegistry) {
	type RegisteredCurrencyCode = Extract<keyof TCurrencyRegistry, string>;

	assertCurrencyRegistry(currencies);
	const registeredCurrencyCodes = new Set(Object.keys(currencies));

	const registeredCurrencyCodeSchema = z.custom<RegisteredCurrencyCode>(
		(value) => typeof value === "string" && registeredCurrencyCodes.has(value),
		{ error: "Unknown currency code" },
	);
	const registeredSerializedMoneySchema = serializedMoneySchema.extend({
		currency: registeredCurrencyCodeSchema,
	});

	return z.codec(registeredSerializedMoneySchema, moneyInstanceSchema, {
		decode: ({ amount, currency }) => {
			const registeredCurrency = currencies[currency];
			if (registeredCurrency === undefined) {
				throw new Error(`Unknown currency code: ${currency}`);
			}
			return Money.fromMinor(registeredCurrency, amount);
		},
		encode: (money) => {
			const serialized = money.toJSON();
			const currency = serialized.currency as RegisteredCurrencyCode;
			const registeredCurrency = currencies[currency];
			if (
				registeredCurrency === undefined ||
				registeredCurrency.decimalPlaces !== money.currency.decimalPlaces
			) {
				throw new Error(
					`Money currency ${serialized.currency} is not registered with matching precision`,
				);
			}

			return { amount: serialized.amount, currency };
		},
	});
}

/** Codec for the currencies included with @storepass/money. */
export const moneyCodec = createMoneyCodec(Currency);
