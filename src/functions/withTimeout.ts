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

import { TimeoutError, } from "../errors";
import { asAsync, } from "../utils";

/**
 * A possible value for action parameter of 'withTimeout()' function.
 */
export type WithTimeoutAction<T = any> =
  ((...args: any[]) => T) |
  ((...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
 * Invokes an action or promise and throws an error on a timeout.
 *
 * @example
 * ```
 * import { TimeoutError, withTimeout } from "@marcelkloubert/promises"
 *
 * const action = () => {
 *   return new Promise<string>((resolve) => {
 *     setTimeout(() => result("FOO"), 1000)
 *   })
 * }
 *
 * // submit action as function
 * // should NOT throw a TimeoutError
 * const fooResult1 = await withTimeout(action, 10000)
 *
 * // submit action as Promise
 * // this should throw a TimeoutError
 * const fooResult2 = await withTimeout(action(), 10000)
 * ```
 *
 * @param {WithTimeoutAction<T = any>} action The action to invoke.
 * @param {number} timeout The maximum time in milliseconds.
 * @param {any[]} [args] Additional arguments for the action, if no promise.
 *
 * @returns {Promise<T>} The result of the action.
 *
 * @throws TimeoutError Action has run into a timeout.
 */
export function withTimeout<T = any>(action: WithTimeoutAction<T>, timeout: number, ...args: any[]): Promise<T> {
  const asyncFunc = asAsync<T>(action);

  if (typeof timeout !== "number") {
    throw new TypeError("timeout must be of type number");
  }

  if (timeout < 0) {
    throw new RangeError("timeout must be at least 0");
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError());
    }, timeout);

    const clearTimer = () => {
      clearTimeout(timer);
    };

    asyncFunc(...args).then((result) => {
      clearTimer();

      resolve(result);
    }).catch((error) => {
      clearTimer();

      reject(error);
    });
  });
}
