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

import { waitFor, WaitForCondition, } from "../functions";

describe("waitFor() function", () => {
  it("should be execut an action after a condition matches a criteria", async () => {
    const arg1Value = 23979;
    const resultSummand = 5979;
    const stateValue = 1234;
    const maxCounterValue = 10;

    let counter = 0;
    const condition: WaitForCondition = (context) => {
      return new Promise((resolve) => {
        if (++counter === maxCounterValue) {
          context.state = stateValue;

          resolve(true);
        } else {
          resolve(false);
        }
      });
    };

    const result = await waitFor(async ({ state, }, arg1: number) => {
      // 'state' should be 1234 (s. above)
      return resultSummand + arg1 + state;
    }, condition, arg1Value);

    expect(result).toBe(arg1Value + resultSummand + stateValue);
    expect(counter).toBe(maxCounterValue);
  });
});
