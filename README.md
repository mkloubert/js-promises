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

### doRepeat(action: DoRepeatAction, countOrCondition: number | DoRepeatCondition, ...args: any[]): Promise

> Repeats an action or promise.

```typescript
import assert from "assert";
import { doRepeat, DoRepeatActionContext } from "@marcelkloubert/promises";

const repeatCount = 5979;
const counter = 0;

const results = await doRepeat(async (context: DoRepeatActionContext) => {
  console.log("context.state", String(context.state));
  context.state = context.index * 2;

  ++counter;

  // do some work here
}, repeatCount);

assert.strictEqual(results.length, repeatCount);
assert.strictEqual(counter, results.length);
```

### isPromise(value: any): boolean

> Checks if a value is a Promise.

```typescript
import { isPromise } from "@marcelkloubert/promises";
import Bluebird from "bluebird";

// all are (true)
isPromise(Promise.resolve("Foo"));
isPromise(Bluebird.resolve("Foo"));
isPromise({
  then: (onfulfilled?: Function, onrejected?: Function): any => {},
  catch: (onrejected?: Function) => {},
});

// all are (false)
isPromise("Foo");
isPromise({
  then: (onfulfilled?: Function, onrejected?: Function): any => {},
});
isPromise(null);
```

### isPromiseLike(value: any): boolean

> Checks if a value is a PromiseLike.

```typescript
import { isPromiseLike } from "@marcelkloubert/promises";
import Bluebird from "bluebird";

// all are (true)
isPromiseLike(Promise.resolve("Foo"));
isPromiseLike(Bluebird.resolve("Foo"));
isPromiseLike({
  then: (onfulfilled?: Function, onrejected?: Function): any => {},
});

// all are (false)
isPromiseLike("Foo");
isPromiseLike({});
isPromiseLike(null);
```

### PromiseQueue

> A promise queue.

```typescript
import assert from "assert";
import { PromiseQueue } from "@marcelkloubert/promises";

// create and start the queue
const queue = new PromiseQueue({
  autoStart: true,
  concurrency: 10, // maximum 10 actions at the same time
});

const promises: Promise<any>[] = [];
let counter = 0;

// lets create 100 actions and
// add them to queue
const actionCount = 100;
for (let i = 0; i < actionCount; i++) {
  promises.push(
    queue.enqueue(async () => {
      // do some (long) work here ...

      ++counter;
    })
  );
}

// wait until all actions have been executed
await Promise.all(promises);

// stop the queue
queue.stop();

// counter should now be the number of
// enqueued actions
assert.strictEqual(counter, promises.length);
```

### waitFor(action: WaitForAction, condition: WaitForCondition, ...args: any[]): Promise

> Invokes an action or promise, but waits for a condition.

```typescript
import {
  waitFor,
  WaitForActionContext,
  WaitForCondition,
} from "@marcelkloubert/promises";

const waitForFile: WaitForCondition = async (context) => {
  // use context.cancel() function
  // to cancel the operation
  // maybe for a timeout

  // setup 'state' value for upcoming
  // action
  context.state = "Foo Bar BUZZ"(s.below);
};

const result = await waitFor(async ({ state }: WaitForActionContext) => {
  // state === "Foo Bar BUZZ" (s. above)
}, waitForFile);
```

### withCancellation(action: WithCancellationAction, ...args: any[]): Promise

> Invokes an action or promise, which can be cancelled.

```typescript
import {
  CancellationError,
  withCancellation,
  WithCancellationActionContext,
} from "@marcelkloubert/promises";

const promise = withCancellation(
  async (context: WithCancellationActionContext) => {
    let hasBeenFinished = false;
    while (!context.cancellationRequested && !hasBeenFinished) {
      // do some long work here
    }
  }
);

setTimeout(() => {
  promise.cancel("Promise action takes too long");
}, 10000);

try {
  await promise;
} catch (ex) {
  if (ex instanceof CancellationError) {
    // has been cancelled
  } else {
    // other error
  }
}
```

### withRetries(action: WithRetriesAction, optionsOrMaxRetries: WithRetriesOptions | number, ...args: any[]): Promise

> Invokes an action or promise and throws an error if a maximum number of tries has been reached.

```typescript
import {
  MaximumTriesReachedError,
  withRetries,
} from "@marcelkloubert/promises";

const myAsyncAction = async () => {
  // do something here
};

try {
  // try this action
  await withTimeout(myAsyncAction, {
    maxRetries: 9, // try invoke the myLongAction
    // with a maximum of 10 times
    // (first invocation + maxRetries)
    waitBeforeRetry: 10000, // wait 10 seconds, before retry
  });
} catch (error) {
  // error should be a MaximumTriesReachedError instance
  console.error("Invokation of myLongAction failed", error);
}
```

### withTimeout(action: WithTimeoutAction, timeout: number, ...args: any[]): Promise

> Invokes an action or promise and throws an error on a timeout.

```typescript
import { TimeoutError, withTimeout } from "@marcelkloubert/promises";

const action = () => {
  return new Promise<string>((resolve) => {
    setTimeout(() => result("FOO"), 1000);
  });
};

// submit action as function
// should NOT throw a TimeoutError
const fooResult1 = await withTimeout(action, 10000);

// submit action as Promise
// this should throw a TimeoutError
const fooResult2 = await withTimeout(action(), 100);
```

### withWorker(workerFileOrUrl: string | URL, options?: WithWorkerOptions): Promise

> Wraps the execution of a worker into a Promise.

```typescript
import { withWorker } from "@marcelkloubert/promises";

// this is code for Node.js
// in a browser 'exitCode' will not exist
const { exitCode, lastMessage } = await withWorker("/path/to/worker_script.js");
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
