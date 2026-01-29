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

## Development

```bash
bun install     # install dependencies
bun test        # run tests
bun run build   # build for distribution
bun run check   # format and lint
```

## Releasing

```bash
./scripts/release.sh           # bump prerelease (0.0.1-alpha.4 → 0.0.1-alpha.5)
./scripts/release.sh patch     # bump patch (0.0.1 → 0.0.2)
./scripts/release.sh minor     # bump minor (0.0.1 → 0.1.0)
./scripts/release.sh major     # bump major (0.0.1 → 1.0.0)
```

## License

MIT
