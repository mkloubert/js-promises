/* eslint-disable @typescript-eslint/no-non-null-assertion */

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

import { CancelablePromise, PromiseCancelAction, } from "../classes";
import { CancellationError, } from "../errors";
import { asAsync, } from "../utils";

/**
 * A possible value for action parameter of 'withCancellation()' function.
 */
export type WithCancellationAction<T = any> =
  ((context: WithCancellationActionContext, ...args: any[]) => T) |
  ((context: WithCancellationActionContext, ...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
 * A context as first argument for a 'WithCancellationAction' instance.
 */
export interface WithCancellationActionContext {
  /**
   * Gives the action the information, that a cancellation has been requested.
   */
  readonly cancellationRequested: boolean;
}

/**
 * Invokes an action or promise, which can be cancelled.
 *
 * @example
 * ```
 * import { CancellationError, withCancellation, WithCancellationActionContext } from "@marcelkloubert/promises"
 *
 * const promise = withCancellation(async (context: WithCancellationActionContext) => {
 *   let hasBeenFinished = false
 *   while (!context.cancellationRequested && !hasBeenFinished) {
 *     // do some long work here
 *   }
 * })
 *
 * setTimeout(() => {
 *   promise.cancel("Promise action takes too long")
 * }, 10000)
 *
 * try {
 *   await promise
 * } catch (ex) {
 *   if (ex instanceof CancellationError) {
 *     // has been cancelled
 *   } else {
 *     // other error
 *   }
 * }
 * ```
 *
 * @param {WithCancellationAction} action The action to invoke.
 * @param {any[]} [args] Additional arguments for the action, if no promise.
 *
 * @returns {CancelablePromise<T>} The new promise.
 */
export function withCancellation<T>(action: WithCancellationAction, ...args: any[]): CancelablePromise<T> {
  const asyncFunc = asAsync<T>(action);

  let hasBeenCancelled = false;
  let cancel: PromiseCancelAction = () => {
    hasBeenCancelled = true;
  };

  return new CancelablePromise(
    new Promise<T>((resolve, reject) => {
      let finished = false;

      const baseCancel = cancel;
      cancel = (reason) => {
        baseCancel();

        if (!finished) {
          reject(new CancellationError(reason));
        }
      };

      const onResolve = (result: T) => {
        if (!hasBeenCancelled) {
          finished = true;

          resolve(result);
        }
      };

      const onReject = (error: any) => {
        if (!hasBeenCancelled) {
          finished = true;

          reject(error);
        }
      };

      const context: WithCancellationActionContext = {
        "cancellationRequested": undefined!,
      };

      Object.defineProperties(context, {
        "cancellationRequested": {
          "enumerable": true,
          "configurable": false,
          "get": () => hasBeenCancelled,
        },
      });

      asyncFunc(context, ...args)
        .then(onResolve)
        .catch(onReject);
    }),
    (reason?) => {
      cancel?.(reason);
    },
    () => hasBeenCancelled
  );
}
