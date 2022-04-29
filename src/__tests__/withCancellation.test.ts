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

import { withCancellation, } from "..";
import { CancellationError, } from "../errors";
import { WithCancellationActionContext, } from "../functions";

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe("withCancellation() function", () => {
  it("should throw CancellationError", async () => {
    const action = async (context: WithCancellationActionContext) => {
      await sleep(500);

      hasBeenCancelled = context.cancellationRequested;
    };

    let hasBeenCancelled = false;
    const p = withCancellation(action);

    await sleep(100);
    p.cancel();

    let exception: any;
    try {
      await p;
    } catch (ex) {
      exception = ex;
    }

    await sleep(500);  // keep sure anthing has been finished

    expect(p.isCanceled).toBe(true);
    expect(hasBeenCancelled).toBe(true);
    expect(exception instanceof CancellationError).toBe(true);
  });

  it("should not throw CancellationError", async () => {
    const action = async (context: WithCancellationActionContext) => {
      await sleep(100);

      hasBeenCancelled = context.cancellationRequested;
    };

    let hasBeenCancelled = false;
    const p = withCancellation(action);

    setTimeout(() => {
      p.cancel();
    }, 500);

    let exception: any;
    try {
      await p;
    } catch (ex) {
      exception = ex;
    }

    await sleep(500);  // keep sure anthing has been finished

    expect(p.isCanceled).toBe(true);
    expect(hasBeenCancelled).toBe(false);
    expect(exception instanceof CancellationError).toBe(false);
  });
});
