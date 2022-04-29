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

import { withTimeout, } from "..";
import { TimeoutError, } from "../errors";

describe("withTimeout() function", () => {
  it("should throw TimeoutError", async () => {
    const action = () => {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    };

    const actionsGetters = [
      () => action,
      () => action(),
    ];

    for (const getAction of actionsGetters) {
      let thrownException: any;
      let result: any = false;
      try {
        result = await withTimeout(getAction(), 100);
      } catch (ex) {
        thrownException = ex;
      }

      expect(thrownException instanceof TimeoutError).toBe(true);
      expect(result).toBe(false);
    }
  });

  it("should not throw TimeoutError", async () => {
    const action = () => {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 100);
      });
    };

    const actionsGetters = [
      () => action,
      () => action(),
    ];

    for (const getAction of actionsGetters) {
      let thrownException: any;
      let result: any = false;
      try {
        result = await withTimeout(getAction(), 500);
      } catch (ex) {
        thrownException = ex;
      }

      expect(thrownException instanceof TimeoutError).toBe(false);
      expect(result).toBe(true);
    }
  });
});
