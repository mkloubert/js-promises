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

import { isPromise, } from "..";
import Bluebird from "bluebird";

describe("isPromise() function", () => {
  it("should all be Promises", async () => {
    const promises = [
      Promise.resolve("Foo"),
      Bluebird.resolve("Foo"),
      {
        "then": () => { },
        "catch": () => { },
      },
    ];

    for (const item of promises) {
      expect(isPromise(item)).toBe(true);
    }
  });

  it("should all be no Promises", async () => {
    const noPromies = [
      null,
      {},
      {
        "then": () => { },
      },
      {
        "catch": () => { },
      },
      {
        "then": 4242,
        "catch": () => { },
      },
      {
        "then": () => { },
        "catch": 23979,
      },
      5979,
      undefined,
      "Foo",
      () => { },
    ];

    for (const item of noPromies) {
      expect(isPromise(item)).toBe(false);
    }
  });
});
