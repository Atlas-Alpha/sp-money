export interface CurrencyDefinition {
	code: string;
	decimalPlaces: number;
}

export const Currency = {
	USD: { code: "USD", decimalPlaces: 2 },
	USDH: { code: "USDH", decimalPlaces: 3 },
	EUR: { code: "EUR", decimalPlaces: 2 },
	GBP: { code: "GBP", decimalPlaces: 2 },
	JPY: { code: "JPY", decimalPlaces: 0 },
	CAD: { code: "CAD", decimalPlaces: 2 },
	AUD: { code: "AUD", decimalPlaces: 2 },
	NZD: { code: "NZD", decimalPlaces: 2 },
	CHF: { code: "CHF", decimalPlaces: 2 },
	SEK: { code: "SEK", decimalPlaces: 2 },
	NOK: { code: "NOK", decimalPlaces: 2 },
	DKK: { code: "DKK", decimalPlaces: 2 },
	PLN: { code: "PLN", decimalPlaces: 2 },
	CZK: { code: "CZK", decimalPlaces: 2 },
	HUF: { code: "HUF", decimalPlaces: 2 },
	BRL: { code: "BRL", decimalPlaces: 2 },
	MXN: { code: "MXN", decimalPlaces: 2 },
	ARS: { code: "ARS", decimalPlaces: 2 },
	CLP: { code: "CLP", decimalPlaces: 0 },
	INR: { code: "INR", decimalPlaces: 2 },
	SGD: { code: "SGD", decimalPlaces: 2 },
	HKD: { code: "HKD", decimalPlaces: 2 },
	KRW: { code: "KRW", decimalPlaces: 0 },
	CNY: { code: "CNY", decimalPlaces: 2 },
	ZAR: { code: "ZAR", decimalPlaces: 2 },
	AED: { code: "AED", decimalPlaces: 2 },
	SAR: { code: "SAR", decimalPlaces: 2 },
	BTC: { code: "BTC", decimalPlaces: 8 },
} as const satisfies Record<string, CurrencyDefinition>;

export type CurrencyCode = keyof typeof Currency;
export type CurrencyType = (typeof Currency)[CurrencyCode];

export function defineCurrency(
	code: string,
	decimalPlaces: number,
): CurrencyDefinition {
	if (!code || typeof code !== "string") {
		throw new Error("Currency code must be a non-empty string");
	}
	if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
		throw new Error("Decimal places must be a non-negative integer");
	}
	return Object.freeze({ code, decimalPlaces });
}
