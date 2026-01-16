# sp-money

Safe, consistent, deterministic money operations. BigInt precision internally, no floating-point errors.

## Install

```bash
bun add @atlas-alpha/sp-money
```

## Usage

```typescript
import { Money, Currency } from "@atlas-alpha/sp-money";

// From minor units (cents, satoshis, etc.)
const price = Money.fromMinor(Currency.USD, 1234); // $12.34

// From decimal
const total = Money.fromNumber(Currency.USD, 12.34);

// Convert back
price.toMinor();  // 1234
price.toNumber(); // 12.34
price.currency;   // Currency.USD
```

## Rounding

```typescript
Money.fromNumber(Currency.USD, 12.345, { rounding: "floor" }); // 1234
Money.fromNumber(Currency.USD, 12.345, { rounding: "ceil" });  // 1235
Money.fromNumber(Currency.USD, 12.345, { rounding: "round" }); // 1235
Money.fromNumber(Currency.USD, 12.345, { rounding: "trunc" }); // 1234 (default)
```

## Strict Mode

Throws if value can't be exactly represented:

```typescript
Money.fromNumber(Currency.USD, 12.34, { strict: true });  // OK
Money.fromNumber(Currency.USD, 12.345, { strict: true }); // throws
```

## Currencies

`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `ZAR`, `AED`, `JPY` (0 decimals), `BTC` (8 decimals)

## License

MIT
