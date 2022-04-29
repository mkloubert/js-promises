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

import path from "path";
import { withWorker, } from "../functions";

const workerScript1 = path.join(__dirname, "workers/withWorker1.js");
const workerScript2 = path.join(__dirname, "workers/withWorker2.js");
const workerScript3 = path.join(__dirname, "workers/withWorker3.js");

describe("withWorker() function", () => {
  it("should execute the worker script 1", async () => {
    const { exitCode, } = await withWorker(workerScript1);

    expect(exitCode).toBe(5979);
  });

  it("should execute the worker script 2 with value for lastMessage", async () => {
    const { exitCode, lastMessage, } = await withWorker<number>(workerScript2);

    expect(exitCode).toBe(5979);
    expect(typeof lastMessage).toBe("number");
    expect(lastMessage).toBe(23979);
  });

  it("should fail, when execute worker script 3", async () => {
    let hasFailed = false;
    try {
      await withWorker(workerScript3);
    } catch {
      hasFailed = true;
    }

    expect(hasFailed).toBe(true);
  });
});
