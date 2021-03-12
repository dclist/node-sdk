# DCList.net NodeJS SDK

---

This package is official nodejs sdk for dclist.net.

It's open-source and always open to prs and contributions.

## Installation

You can install package via [npm](https://www.npmjs.com/) or [yarn](https://classic.yarnpkg.com/) with following commands :

```
npm install @dclist/sdk
```

or

```
yarn add @dclist/sdk
```

## Gettings Started

We support typescript natively. You don't need to install any other packages.

For typescript :
```ts
import { GatewayClient } from '@dclist/sdk'

const gClient = new GatewayClient({
    token: 'YOUR_TOKEN_HERE'
})
```

For Javascript :
```js
const { GatewayClient } = require('@dclist/sdk')

const gClient = new GatewayClient({
    token: 'YOUR_TOKEN_HERE'
})
```

## More

You can find out more about sdk at dclist's documantation.

[Link to SDK's full Documentation](https://docs.dclist.net/sdk/node)
