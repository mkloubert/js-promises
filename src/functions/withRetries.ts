/**
  The MIT License (MIT)

  Copyright (c) 2022-present Marcel Joachim Kloubert (https://marcel.coffee/)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
**/

import { MaximumTriesReachedError, MaximumTriesReachedErrorItem, } from "../errors";
import { asAsync, isNullOrUndefined, } from "../utils";

type RetryAction = (error: any) => void;

/**
 * A possible value for action parameter of 'withRetries()' function.
 */
export type WithRetriesAction<T = any> =
  ((...args: any[]) => T) |
  ((...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
 * Options for 'withRetries()' function.
 */
export interface WithRetriesOptions {
  /**
   * The maximum number of retires.
   */
  maxRetries: number;
  /**
   * The optional time in milliseconds to wait until the next try.
   */
  waitBeforeRetry?: number | null;
}

/**
 * Invokes an action or promise and throws an error if a maximum number of tries has been reached.
 *
 * @example
 * ```
 * import { MaximumTriesReachedError, withRetries } from "@marcelkloubert/promises"
 *
 * const myLongAction = async () => {
 *   // do something here
 * }
 *
 * try {
 *   // try this action
 *   await withTimeout(myLongAction, {
 *     maxRetries: 9, // try invoke the myLongAction
 *                    // with a maximum of 10 times
 *                    // (first invocation + maxRetries)
 *     waitBeforeRetry: 10000, // wait 10 seconds, before retry
 *   })
 * } catch (error) {
 *   // error should be a MaximumTriesReachedError instance
 *   console.error("Invokation of myLongAction failed", error)
 * }
 * ```
 *
 * @param {WithTimeoutAction<T = any>} action The action to invoke.
 * @param {WithRetriesOptions} options Custom options.
 * @param {number} maxRetries The maximum number of retries.
 * @param {any[]} [args] Additional arguments for the action, if no promise.
 *
 * @returns {Promise<T>} The result of the action.
 *
 * @throws MaximumTriesReachedError Action has run into a timeout.
 */
export function withRetries<T = any>(action: WithRetriesAction<T>, options: WithRetriesOptions, ...args: any[]): Promise<T>;
export function withRetries<T = any>(action: WithRetriesAction<T>, maxRetries: number, ...args: any[]): Promise<T>;
export function withRetries<T = any>(action: WithRetriesAction<T>, optionsOrMaxRetries: WithRetriesOptions | number, ...args: any[]): Promise<T> {
  const asyncFunc = asAsync<T>(action);

  let options: WithRetriesOptions;
  if (typeof optionsOrMaxRetries === "number") {
    options = {
      "maxRetries": optionsOrMaxRetries,
    };
  } else {
    options = optionsOrMaxRetries;
  }

  if (typeof options !== "object") {
    throw new TypeError("optionsOrMaxRetries must be of type number or object");
  }

  if (typeof options.maxRetries !== "number") {
    throw new TypeError("optionsOrMaxRetries.number must be of type number");
  }

  if (!isNullOrUndefined(options.waitBeforeRetry)) {
    if (typeof options.waitBeforeRetry !== "number") {
      throw new TypeError("optionsOrMaxRetries.waitBeforeRetry must be of type number");
    }
  }

  let counter = options.maxRetries;
  const waitBeforeRetry = options.waitBeforeRetry;

  return new Promise<T>((resolve, reject) => {
    const allErrors: MaximumTriesReachedErrorItem[] = [];
    let start!: Date;

    const retry = typeof waitBeforeRetry !== "number" ?
      () => invokeAction() :
      () => setTimeout(invokeAction, waitBeforeRetry);

    const tryAgainIfPossible: RetryAction = (error) => {
      const end = new Date();

      allErrors.push({
        "elapsed": end.valueOf() - start.valueOf(),
        error,
      });

      if (counter-- > 0) {
        retry();
      } else {
        reject(new MaximumTriesReachedError(allErrors));
      }
    };

    const invokeAction = () => {
      start = new Date();

      asyncFunc(...args).then((result) => {
        resolve(result);
      }).catch((error) => {
        tryAgainIfPossible(error);
      });
    };

    invokeAction();  // first try
  });
}
