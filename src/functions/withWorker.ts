/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */

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

import type { Worker, WorkerOptions, } from "worker_threads";
import type { URL, } from "url";
import { invokeInEnvironment, isNullOrUndefined, } from "../utils";
import { NotSupportedError, } from "../errors";

/**
 * Custom options for 'withWorker()' function.
 */
export interface WithWorkerOptions {
  /**
   * Is invoked if a message has been received from worker.
   *
   * @param {any} message The received message.
   */
  onMessage?: ((message: any) => any) | null;
  /**
   * Worker data to submit.
   */
  workerData?: any;
}

/**
 * A result of 'withWorker()' function.
 */
export interface WithWorkerResult<T = any> {
  /**
   * The exit code on Node, (undefined) if browser.
   */
  exitCode?: number;
  /**
   * The last message.
   */
  lastMessage: T;
}

/**
 * Wraps the execution of a worker into a Promise.
 *
 * @example
 * ```
 * import { withWorker } from "@marcelkloubert/promises"
 *
 * // this is code for Node.js
 * // in a browser 'exitCode' will not exist
 * const { exitCode, lastMessage } = await withWorker("/path/to/worker_script.js")
 * ```
 *
 * @param {string|URL} workerFileOrUrl The path to the script file or the URL.
 * @param {WithWorkerOptions} [options] Custom options.
 *
 * @returns {Promise<WithWorkerResult<T>>} The promise with the result of the worker.
 */
export function withWorker<T = any>(workerFileOrUrl: string | URL, options: WithWorkerOptions = {}) {
  if (typeof options !== "object") {
    throw new TypeError("options must be of type object");
  }

  const { onMessage, workerData, } = options;

  return new Promise<WithWorkerResult<T>>((resolve, reject) => {
    invokeInEnvironment({
      "browser": () => {
        // @ts-ignore
        if (!window.Worker) {
          return reject(new NotSupportedError("Worker not supported"));
        }

        // @ts-ignore
        const worker: any = new Worker(`${workerFileOrUrl}`);

        worker.onerror = (error: any) => {
          reject(error);
        };

        worker.onmessage = (e: any) => {
          const lastMessage = e.data;

          onMessage?.(lastMessage);

          // first message will resolve the promise
          resolve({
            lastMessage,
          });
        };

        if (!isNullOrUndefined(workerData)) {
          worker.postMessage(workerData);
        }
      },
      "node": () => {
        const UrlClass: typeof URL = require("worker_threads").URL;

        if (typeof workerFileOrUrl !== "string" && !(workerFileOrUrl instanceof UrlClass)) {
          throw new TypeError("workerFileOrUrl must be of type string or URL");
        }

        const WorkerClass: typeof Worker = require("worker_threads").Worker;

        const workerOptions: WorkerOptions = {
          "env": {
            ...process.env,
          },
          "workerData": isNullOrUndefined(workerData) ? undefined : workerData,
        };

        const worker: Worker = new WorkerClass(workerFileOrUrl, workerOptions);

        worker.once("error", (error) => {
          reject(error);
        });

        let lastMessage: any;
        worker.on("message", (message) => {
          onMessage?.(message);

          lastMessage = message;
        });

        worker.once("exit", (exitCode) => {
          resolve({
            lastMessage,
            exitCode,
          });
        });
      },
    });
  });
}
