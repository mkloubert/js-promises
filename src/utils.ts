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

import type { AsyncAction, } from "./types";

type AsAsyncResult<T = any> = (...args: any[]) => Promise<T>;

export function asAsync<T = any>(action: AsyncAction<T>): AsAsyncResult<T> {
  if (action instanceof Promise) {
    return () => {
      return new Promise((resolve, reject) => {
        action
          .then(resolve)
          .catch(reject);
      });
    };
  } else {
    if (typeof action !== "function") {
      throw new TypeError("action must be of type Promise or function");
    }

    if (action.constructor.name === "AsyncFunction") {
      return action as AsAsyncResult<T>;
    } else {
      return (async function (...argList: any[]) {
        return action(...argList);
      }) as AsAsyncResult<T>;
    }
  }
}

export function isNullOrUndefined(value: unknown): value is (null | typeof undefined) {
  return typeof value === "undefined" ||
    value === null;
}

export function throwIfNoFunctionOrPromise(value: unknown) {
  if (typeof value !== "function" && !(value instanceof Promise)) {
    throw new TypeError("value must be of type function or Promise");
  }
}
