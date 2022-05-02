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

import { CancellationError, ConditionFailedError, } from "../errors";
import { asAsync, } from "../utils";

/**
 * A possible value for action parameter of 'waitFor()' function.
 */
export type WaitForAction<T = any, S = any> =
  ((context: WaitForActionContext<S>, ...args: any[]) => T) |
  ((context: WaitForActionContext<S>, ...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
* A context for a 'WaitForAction'.
*/
export interface WaitForActionContext<S = any> {
  /**
   * The state, defined in 'WaitForConditionContext.state' prop of
   * previous 'WaitForCondition'.
   */
  state: S;
}

/**
 * A condition for a 'waitFor()' function.
 *
 * @param {WaitForConditionContext} context The context.
 * @param {any[]} [args] Additional arguments for the action.
 */
export type WaitForCondition<S = any> = (context: WaitForConditionContext<S>, ...args: any[]) => any;

/**
 * A context for a 'WaitForCondition' function call.
 */
export interface WaitForConditionContext<S = any> {
  /**
   * Throws a 'CancellationError', which is directly rethrown.
   */
  cancel(): void;
  /**
   * Gets or sets the value for 'WaitForActionContext.state' prop.
   */
  state?: S;
}

/**
 * Invokes an action or promise, but waits for a condition.
 *
 * @example
 * ```
 * import { waitFor, WaitForActionContext, WaitForCondition } from "@marcelkloubert/promises"
 * import fs from "fs"
 *
 * const waitForFile: WaitForCondition = async (context) => {
 *   // use context.cancel() function
 *   // to cancel the operation
 *   // maybe for a timeout
 *
 *   // setup 'state' value for upcoming
 *   // action
 *   context.state = "Foo Bar BUZZ" // (s. below in action)
 *
 *   // return a truthy value to keep waiting
 *   // otherwise falsy to start execution of action
 *   return !fs.existsSync("/path/to/my/file.xlsx")
 * }
 *
 * const result = await waitFor(async ({ state }: WaitForActionContext) => {
 *   // state === "Foo Bar BUZZ" (s. above)
 * }, waitForFile)
 * ```
 *
 * @param {WaitForAction<T>} action The action to invoke.
 * @param {WaitForCondition<S>} condition The condition.
 * @param {any[]} [args] Additional arguments for the action, if no promise.
 *
 * @returns {Promise<T>} The promise with the result of the action.
 */
export async function waitFor<T = any, S = any>(action: WaitForAction<T>, condition: WaitForCondition<S>, ...args: any[]): Promise<T> {
  const asyncAction = asAsync(action);
  const asyncCondition = asAsync(condition);

  const conditionContext: WaitForConditionContext = {
    "cancel": () => {
      throw new CancellationError();
    },
  };

  do {
    try {
      if (await asyncCondition(conditionContext, ...args)) {
        break;
      }
    } catch (ex) {
      if (ex instanceof CancellationError) {
        throw ex;
      }

      throw new ConditionFailedError(ex);
    }
  } while (true);

  const actionContext: WaitForActionContext = {
    "state": conditionContext.state,
  };

  return asyncAction(actionContext, ...args);
}
