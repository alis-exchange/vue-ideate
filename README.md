# Vue Ideate

This package provides utility composables and Vue 3 components to help users of Alis Ideate better link and integrate their products.

## Installation

```bash
pnpm add vue-ideate
```

## Usage

```typescript
import { useIdeateFeedback } from 'vue-ideate';

// The token as part of the URL provided when generating a public collection link in ideate
// Format: `{payload}.{signature}`
const token = 'YOUR_TOKEN';

const { generateUrl } = useIdeateFeedback(token);
const url = generateUrl();
```
