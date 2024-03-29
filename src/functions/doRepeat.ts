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

import { CancellationError, PartlyFailedError, } from "../errors";
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
 * A condition for a 'doRepeat()' function.
 *
 * @param {DoRepeatConditionContext} context The context.
 * @param {any[]} [args] Additional arguments for the action.
 */
export type DoRepeatCondition<S = any> = (context: DoRepeatConditionContext<S>, ...args: any[]) => any;

/**
 * A context for a 'DoRepeatCondition' function call.
 */
export interface DoRepeatConditionContext<S = any> {
  /**
   * Throws a 'CancellationError', which is directly rethrown.
   */
  cancel(): void;
  /**
   * Gets or sets the value for 'DoRepeatActionContext.state' prop.
   */
  state?: S;
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
 * const results = await doRepeat(async (context: DoRepeatActionContext) => {
 *   console.log("context.state", String(context.state))
 *   context.state = context.index * 2
 *
 *   ++counter
 *
 *   // do some work here
 * }, repeatCount)
 *
 * assert.strictEqual(results.length, repeatCount)
 * assert.strictEqual(counter, results.length)
 * ```
 *
 * @param {DoRepeatAction<T,S>} action The action to invoke.
 * @param {number|DoRepeatCondition} countOrCondition The number of repeations or the condition.
 * @param {any[]} [args] Additional arguments for the action.
 *
 * @returns {Promise<T[]>} The promise with the list of all results.
 *
 * @throws PartlyFailedErrorAt least one execution failed.
 * ```
 */
export async function doRepeat<T = any, S = any>(action: DoRepeatAction<T, S>, countOrCondition: number | DoRepeatCondition, ...args: any[]): Promise<T[]> {
  let condition: DoRepeatCondition;
  if (typeof countOrCondition === "number") {
    if (countOrCondition < 0) {
      throw new RangeError("countOrCondition must be at least 0");
    }

    let counter = countOrCondition;
    condition = async () => {
      return counter-- >= 1;
    };
  } else {
    condition = asAsync(countOrCondition);
  }

  if (typeof condition !== "function") {
    throw new TypeError("countOrCondition must br of type number or function");
  }

  const asyncAction = asAsync(action);

  const results: T[] = [];
  let state: S | undefined;

  const setupStatePropFor = (obj: any) => {
    Object.defineProperty(obj, "state", {
      "enumerable": true,
      "configurable": false,
      "get": () => {
        return state;
      },
      "set": (newValue: S) => {
        state = newValue;
      },
    });
  };

  try {
    const conditionContext: DoRepeatConditionContext<S> = {
      "cancel": () => {
        throw new CancellationError();
      },
    };

    setupStatePropFor(conditionContext);

    let index = -1;
    while (await condition(conditionContext, ...args)) {
      const actionContext: DoRepeatActionContext<S> = {
        "index": ++index,
      };

      setupStatePropFor(actionContext);

      results.push(
        await asyncAction(actionContext, ...args)
      );
    }
  } catch (ex) {
    throw new PartlyFailedError(results, ex);
  }

  return results;
}
