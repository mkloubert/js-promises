/* eslint-disable no-constant-condition */

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

import { PartlyFailedError, } from "../errors";
import { asAsync, } from "../utils";

/**
 * A possible value for action parameter of 'doRepeat()' function.
 */
export type DoRepeatAction<T = any, S = any> =
  ((context: DoRepeatActionContext<S>, ...args: any[]) => T) |
  ((context: DoRepeatActionContext<S>, ...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
* A context for a 'DoRepeatAction'.
*/
export interface DoRepeatActionContext<S = any> {
  /**
   * The current zero-based index.
   */
  index: number;
  /**
   * A value, which can be shared beween the execution chain.
   */
  state?: S | undefined;
}

/**
 * Repeats an action or promise.
 *
 * @example
 * ```
 * import assert from "assert"
 * import { doRepeat, DoRepeatActionContext } from "@marcelkloubert/promises"
 *
 * const repeatCount = 5979
 * const counter = 0
 *
 * const results = await doRepeat(repeatCount, async (context: DoRepeatActionContext) => {
 *   console.log("context.state", String(context.state))
 *   context.state = context.index * 2
 *
 *   ++counter
 *
 *   // do some work here
 * })
 *
 * assert.strictEqual(results.length, repeatCount)
 * assert.strictEqual(counter, results.length)
 * ```
 *
 * @param {number} count The number of repeations.
 *
 * @returns {Promise<T[]>} The promise with the list of all results.
 *
 * @throws PartlyFailedErrorAt least one execution failed.
 * ```
 */
export async function doRepeat<T = any, S = any>(count: number, action: DoRepeatAction<T, S>, ...args: any[]): Promise<T[]> {
  if (typeof count !== "number") {
    throw new TypeError("count must br of type number");
  }

  if (count < 0) {
    throw new RangeError("count must be at least 0");
  }

  const asyncAction = asAsync(action);

  const results: T[] = [];
  let state: S | undefined;

  for (let index = 0; index < count; index++) {
    const actionContext: DoRepeatActionContext<S> = {
      index,
    };

    Object.defineProperties(actionContext, {
      "state": {
        "enumerable": true,
        "configurable": false,
        "get": () => {
          return state;
        },
        "set": (newValue: S) => {
          state = newValue;
        },
      },
    });

    try {
      results.push(
        await asyncAction(actionContext, ...args)
      );
    } catch (ex) {
      throw new PartlyFailedError(results, ex);
    }
  }

  return results;
}
