import { describe, expect, test } from "bun:test";
import { decode, encode } from "zod";
import { Currency, defineCurrency, Money } from "../src";
import {
	builtInSerializedMoneySchema,
	createMoneyCodec,
	currencyCodeSchema,
	currencyDefinitionSchema,
	moneyCodec,
	moneyInstanceSchema,
	moneySchema,
	serializedMoneySchema,
} from "../src/zod";

describe("Zod schemas", () => {
	test("validates built-in currency codes", () => {
		expect(currencyCodeSchema.parse("USD")).toBe("USD");
		expect(currencyCodeSchema.safeParse("XAU").success).toBe(false);
	});

	test("validates built-in and custom currency definitions", () => {
		expect(currencyDefinitionSchema.parse(Currency.USD)).toEqual(Currency.USD);
		expect(
			currencyDefinitionSchema.parse({ code: "XAU", decimalPlaces: 4 }),
		).toEqual({ code: "XAU", decimalPlaces: 4 });
	});

	test("enforces ISO 4217 definition requirements", () => {
		expect(
			currencyDefinitionSchema.safeParse({
				code: "usd",
				decimalPlaces: 2,
				iso4217: true,
			}).success,
		).toBe(false);
		expect(
			currencyDefinitionSchema.safeParse({
				code: "USD",
				decimalPlaces: 2,
				iso4217: true,
			}).success,
		).toBe(false);
	});

	test("validates serialized Money in minor units", () => {
		const serialized = { amount: 1234, currency: "XAU" };
		expect(serializedMoneySchema.parse(serialized)).toEqual(serialized);
		expect(moneySchema.parse(serialized)).toEqual(serialized);
		expect(
			serializedMoneySchema.safeParse({ amount: 12.34, currency: "USD" })
				.success,
		).toBe(false);
		expect(
			serializedMoneySchema.safeParse({
				amount: Number.MAX_SAFE_INTEGER + 1,
				currency: "USD",
			}).success,
		).toBe(false);
	});

	test("can restrict serialized Money to built-in currencies", () => {
		expect(
			builtInSerializedMoneySchema.parse({ amount: 100, currency: "USD" }),
		).toEqual({ amount: 100, currency: "USD" });
		expect(
			builtInSerializedMoneySchema.safeParse({ amount: 100, currency: "XAU" })
				.success,
		).toBe(false);
	});

	test("validates hydrated Money instances", () => {
		const money = Money.fromMinor(Currency.USD, 1234);
		expect(moneyInstanceSchema.parse(money)).toBe(money);
		expect(moneyInstanceSchema.safeParse(money.toJSON()).success).toBe(false);
	});
});

describe("Money codec", () => {
	test("decodes serialized values and encodes Money instances", () => {
		const money = decode(moneyCodec, { amount: 1234, currency: "USD" });
		expect(money).toBeInstanceOf(Money);
		expect(money.toNumber()).toBe(12.34);
		expect(encode(moneyCodec, money)).toEqual({
			amount: 1234,
			currency: "USD",
		});
	});

	test("rejects unregistered currencies", () => {
		expect(() => moneyCodec.parse({ amount: 100, currency: "XAU" })).toThrow(
			"Unknown currency code",
		);
	});

	test("supports custom currency registries", () => {
		const XAU = defineCurrency("XAU", 4);
		const customCodec = createMoneyCodec({ XAU });
		const money = decode(customCodec, { amount: 12345, currency: "XAU" });

		expect(money.toNumber()).toBe(1.2345);
		expect(encode(customCodec, money)).toEqual({
			amount: 12345,
			currency: "XAU",
		});
	});

	test("rejects registry keys that do not match currency codes", () => {
		expect(() => createMoneyCodec({ GOLD: defineCurrency("XAU", 4) })).toThrow(
			"does not match definition code",
		);
	});

	test("does not encode a currency with mismatched precision", () => {
		const incompatibleUsd = defineCurrency("USD", 3);
		expect(() =>
			encode(moneyCodec, Money.fromMinor(incompatibleUsd, 1234)),
		).toThrow("not registered with matching precision");
	});
});
