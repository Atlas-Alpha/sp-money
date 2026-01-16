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

## License

MIT
