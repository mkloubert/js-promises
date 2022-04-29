/* eslint-disable @typescript-eslint/no-empty-function */

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

import { isPromiseLike, } from "..";
import Bluebird from "bluebird";

describe("isPromiseLike() function", () => {
  it("should all be PromiseLikes", async () => {
    const promiseLikes = [
      Promise.resolve("Foo"),
      Bluebird.resolve("Foo"),
      {
        "then": () => { },
      },
    ];

    for (const item of promiseLikes) {
      expect(isPromiseLike(item)).toBe(true);
    }
  });

  it("should all be no PromiseLikes", async () => {
    const noPromiseLikes = [
      null,
      {},
      {
        "catch": () => { },
      },
      {
        "then": 4242,
      },
      5979,
      undefined,
      "Foo",
      () => { },
    ];

    for (const item of noPromiseLikes) {
      expect(isPromiseLike(item)).toBe(false);
    }
  });
});
