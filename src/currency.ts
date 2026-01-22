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
	ZAR: { code: "ZAR", decimalPlaces: 2 },
	AED: { code: "AED", decimalPlaces: 2 },
	BTC: { code: "BTC", decimalPlaces: 8 },
} as const satisfies Record<string, CurrencyDefinition>;

export type CurrencyCode = keyof typeof Currency;
export type CurrencyType = (typeof Currency)[CurrencyCode];
