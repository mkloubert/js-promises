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

import { PromiseQueue, } from "..";

interface PromiseCounter {
  counter: number;
  index: number;
  promise: Promise<any>;
}

const rangeOfNumbers = (count: number): number[] => {
  const numbers: number[] = [];

  for (let i = 0; i < count; i++) {
    numbers.push(i);
  }

  return numbers;
};

describe("PromiseQueue class", () => {
  it.each(rangeOfNumbers(10))("should execute all actions in a queue with a specific concurrency", async (testIndex) => {
    for (let actionCount = 1; actionCount <= 10; actionCount++) {
      let counter = 0;

      const promiseCounters: PromiseCounter[] = [];

      const checkCounters = () => {
        expect(promiseCounters.length).toBe(actionCount);
        expect(promiseCounters.every(({ counter, }) => counter === 1)).toBe(true);
        expect(counter).toBe(actionCount);
      };

      const queue = new PromiseQueue({
        "concurrency": testIndex + 1,
      });

      expect(typeof queue.isActive).toBe("boolean");
      expect(queue.isActive).toBe(true);
      expect(counter).toBe(0);

      rangeOfNumbers(actionCount).forEach((index) => {
        const newCounter: PromiseCounter = {
          "counter": 0,
          index,
          "promise": queue.enqueue(() => {
            return new Promise<any>((resolve) => {
              ++newCounter.counter;

              setTimeout(() => {
                ++counter;

                resolve(undefined);
              }, 100);
            });
          }),
        };

        promiseCounters.push(newCounter);
      });

      await Promise.all(
        promiseCounters.map(({ promise, }) => promise)
      );

      checkCounters();

      queue.stop();

      expect(typeof queue.isActive).toBe("boolean");
      expect(queue.isActive).toBe(false);

      checkCounters();
    }
  });
});
