[![npm](https://img.shields.io/npm/v/@marcelkloubert/promises.svg)](https://www.npmjs.com/package/@marcelkloubert/promises)
[![last build](https://img.shields.io/github/workflow/status/mkloubert/js-promises/Publish)](https://github.com/mkloubert/js-promises/actions?query=workflow%3APublish)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/mkloubert/js-promises/pulls)

# @marcelkloubert/promises

> Helpers for promises, which work in Node and the browser.

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm i @marcelkloubert/promises
```

## Usage

### withCancellation(action: WithCancellationAction, ...args: any[])

```typescript
import { CancellationError, withCancellation, WithCancellationActionContext } from "@marcelkloubert/promises"

const promise = withCancellation(async (context: WithCancellationActionContext) => {
  let hasBeenFinished = false
  while (!context.cancellationRequested && !hasBeenFinished) {
    // do some long work here
  }
})

setTimeout(() => {
  promise.cancel("Promise action takes too long")
}, 10000)

try {
  await promise
} catch (ex) {
  if (ex instanceof CancellationError) {
    // has been cancelled
  } else {
    // other error
  }
}
```

### withRetries(action: WithRetriesAction, optionsOrMaxRetries: WithRetriesOptions | number, ...args: any[])

```typescript
import { MaximumTriesReachedError, withRetries } from "@marcelkloubert/promises"

const myAsyncAction = async () => {
  // do something here
}

try {
  // try this action
  await withTimeout(myAsyncAction, {
    maxRetries: 9, // try invoke the myLongAction
                   // with a maximum of 10 times
                   // (first invocation + maxRetries)
    waitBeforeRetry: 10000, // wait 10 seconds, before retry
  })
} catch (error) {
  // error should be a MaximumTriesReachedError instance
  console.error("Invokation of myLongAction failed", error)
}
```

### withTimeout(action: WithTimeoutAction, timeout: number, ...args: any[])

```typescript
import { TimeoutError, withTimeout } from "@marcelkloubert/promises"

const action = () => {
  return new Promise<string>((resolve) => {
    setTimeout(() => result("FOO"), 1000)
  })
}

// submit action as function
// should NOT throw a TimeoutError
const fooResult1 = await withTimeout(action, 10000)

// submit action as Promise
// this should throw a TimeoutError
const fooResult2 = await withTimeout(action(), 10000)
```

### withWorker(workerFileOrUrl: string | URL, options?: WithWorkerOptions)

```typescript
import { withWorker } from "@marcelkloubert/promises"

const { exitCode, lastMessage } = await withWorker("/path/to/worker_script.js")
```

## Documentation

The API documentation can be found [here](https://mkloubert.github.io/js-promises/).

## License

MIT © [Marcel Joachim Kloubert](https://github.com/mkloubert)

## Support

<span class="badge-paypal"><a href="https://paypal.me/MarcelKloubert" title="Donate to this project using PayPal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-patreon"><a href="https://patreon.com/mkloubert" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-buymeacoffee"><a href="https://buymeacoffee.com/mkloubert" title="Donate to this project using Buy Me A Coffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg" alt="Buy Me A Coffee donate button" /></a></span>

Or visit https://marcel.coffee/
