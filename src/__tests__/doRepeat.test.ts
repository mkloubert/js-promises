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

import { doRepeat, PartlyFailedError, } from "..";

class MyError extends Error {
}

const rangeOfNumbers = (count: number): number[] => {
  const numbers: number[] = [];

  for (let i = 0; i < count; i++) {
    numbers.push(i);
  }

  return numbers;
};

describe("doRepeat() function", () => {
  it.each(rangeOfNumbers(100))("should repeat an action", async (repeatCount) => {
    const results = await doRepeat(repeatCount, async (context) => {
      if (context.index === 0) {
        context.state = 0;
      } else {
        ++context.state;
      }

      return context.state * 2;
    });

    expect(results.length).toBe(repeatCount);

    results.forEach((result, index) => {
      expect(result).toBe(index * 2);
    });
  });

  it.each(rangeOfNumbers(100))("should throw an ", async (index) => {
    const repeatCount = index + 1;
    const expectedSucceededCount = repeatCount - 1;

    let exception: any;
    try {
      await doRepeat(repeatCount, async (context) => {
        if (context.index === repeatCount - 1) {
          throw new MyError;
        }

        return context.index * 2;
      });
    } catch (ex) {
      exception = ex;
    }

    expect(exception instanceof PartlyFailedError).toBe(true);
    expect(exception.innerError instanceof MyError).toBe(true);
    expect(Array.isArray(exception.succeeded)).toBe(true);
    expect(exception.succeeded.length).toBe(expectedSucceededCount);
  });
});
