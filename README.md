# sp-money

Safe, consistent, deterministic money operations.

- BigInt-backed internal arithmetic
- Explicit currency metadata (`code`, `decimalPlaces`)
- Deterministic rounding/conversion behavior
- No floating-point drift in stored values

## Install

```bash
# npm
npm install @storepass/money

# pnpm
pnpm add @storepass/money

# yarn
yarn add @storepass/money

# bun
bun add @storepass/money
```

## Quick Start

```ts
import { Currency, Money } from "@storepass/money";

const price = Money.fromMinor(Currency.USD, 1234); // $12.34
const fee = Money.fromNumber(Currency.USD, 1.25);
const total = price.add(fee);

console.log(total.toMinor()); // 1359
console.log(total.toNumber()); // 13.59
console.log(total.currency.code); // "USD"
```

## API Overview

### Money creation

```ts
import { Currency, Money } from "@storepass/money";

Money.fromMinor(Currency.USD, 1234); // $12.34
Money.fromNumber(Currency.USD, 12.345, { rounding: "round" }); // $12.35
Money.fromNumber(Currency.USD, 12.34, { strict: true }); // exact only
```

### Arithmetic and comparison

```ts
const a = Money.fromNumber(Currency.USD, 10);
const b = Money.fromNumber(Currency.USD, 2.5);

const sum = a.add(b); // 12.5
const diff = a.subtract(b); // 7.5

Money.compare(a, b); // 1
Money.greaterThan(a, b); // true
```

### Allocation

```ts
const m = Money.fromNumber(Currency.USD, 10);
const parts = m.allocate(3);

parts.map((p) => p.toNumber()); // [3.34, 3.33, 3.33]
Money.sum(parts).toNumber(); // 10
```

### Conversion and rounding

```ts
const usd = Money.fromNumber(Currency.USD, 10);
const eur = usd.convert(Currency.EUR, 0.92); // exchange rate required

const rounded = Money.fromNumber(Currency.USD, 12.37).round(0.05);
rounded.toNumber(); // 12.35
```

### Percent operations

```ts
const subtotal = Money.fromNumber(Currency.USD, 100);

subtotal.percentOf(8.25).toNumber(); // 8.25
subtotal.incrementByPercent(8.25).toNumber(); // 108.25
subtotal.decrementByPercent(10).toNumber(); // 90
```

### Custom currencies

```ts
import { defineCurrency, Money } from "@storepass/money";

const XAU = defineCurrency("XAU", 4);
const gold = Money.fromNumber(XAU, 1.2345);
```

### Serialization

```ts
const m = Money.fromNumber(Currency.USD, 12.34);
const json = m.toJSON();
// { amount: 1234, currency: "USD" }
```

`amount` is always in minor units.

## Notes and Guarantees

- Currency mismatch operations throw (for example, adding USD to EUR).
- Results that exceed JavaScript safe integer range throw.
- Rounding modes supported: `"floor" | "ceil" | "round" | "trunc"`.
- `Money` instances are immutable; operations return new instances.

## Development

```bash
bun install       # install dependencies
bun test          # run tests
bun run build     # build ESM + CJS + d.ts into dist/
bun run check     # biome check + auto-fix/write
bun run lint      # lint only
bun run format    # format only
```

## Releasing

```bash
./scripts/release.sh         # bump prerelease (default)
./scripts/release.sh patch   # bump patch
./scripts/release.sh minor   # bump minor
./scripts/release.sh major   # bump major
```

The release script bumps version, commits, tags, and pushes commit + tags.

## License

MIT
