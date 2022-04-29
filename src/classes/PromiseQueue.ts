/* eslint-disable @typescript-eslint/no-non-null-assertion */
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

import { asAsync, isNullOrUndefined, } from "../utils";

interface PromiseQueueItem {
  action: (...args: any[]) => Promise<any>;
  activate: () => void;
  args: any[];
  deactivate: () => void;
}

/**
 * Options for a new 'PromiseQueue' instance.
 */
export interface PromiseQueueOptions {
  /**
   * A custom interval in milliseconds, which is used by an action to check
   * if it is ready to be executed.
   */
  actionInterval?: number | null;
  /**
   * Auto start queue or not. Default: (true)
   */
  autoStart?: boolean | null;
  /**
   * The maximum number of promises running at the same time. Default: 1
   */
  concurrency?: number | null;
  /**
   * A custom interval in milliseconds, which is used by the queue itself
   * to check and enqueue next actions.
   */
  nextActionsInterval?: number | null;
}

/**
 * An action for a 'PromiseQueue.enqueue()' call.
 */
export type PromiseQueueAction<T = any> =
  ((context: PromiseQueueActionContext, ...args: any[]) => T) |
  ((context: PromiseQueueActionContext, ...args: any[]) => PromiseLike<T>) |
  Promise<T>;

/**
 * A context for a 'PromiseQueueAction'.
 */
export interface PromiseQueueActionContext {
  /**
   * Gets if the action is still in queue or not.
   */
  readonly isInQueue: boolean;
  /**
   * Gets if the queue is active or not.
   */
  readonly isQueueActive: boolean;
}

/**
 * A promise queue.
 *
 * @example
 * ```
 * import assert from "assert"
 * import { PromiseQueue } from "@marcelkloubert/promises"
 *
 * // create and start the queue
 * const queue = new PromiseQueue({
 *   "autoStart": true,
 *   "concurrency": 10 // maximum 10 actions at the same time
 * })
 *
 * const promises: Promise<any>[] = []
 * let counter = 0
 *
 * // lets create 100 actions and
 * // add them to queue
 * const actionCount = 100
 * for (let i = 0; i < actionCount; i++) {
 *   promises.push(
 *     queue.enqueue(async () => {
 *       // do some (long) work here ...
 *
 *       ++counter
 *     })
 *   )
 * }
 *
 * // wait until all actions have been executed
 * await Promise.all(promises)
 *
 * // stop the queue
 * queue.stop()
 *
 * // counter should now be the number of
 * // enqueued actions
 * assert.strictEqual(counter, promises.length)
 * ```
 */
export class PromiseQueue {
  private activeItems: PromiseQueueItem[] = [];
  private readonly concurrency: number;
  private readonly itemInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private readonly nextItemsInterval: number;
  private pendingItems: PromiseQueueItem[] = [];

  /**
   * Initializes a new instance of that class.
   *
   * @param {PromiseQueueOptions} [options] Custom options.
   */
  public constructor(options: PromiseQueueOptions = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be of type object");
    }

    // options.concurrency
    if (!isNullOrUndefined(options.concurrency)) {
      if (typeof options.concurrency !== "number") {
        throw new TypeError("options.concurrency must be of type object");
      }

      if (options.concurrency < 1) {
        throw new RangeError("options.concurrency must be at least 1");
      }

      this.concurrency = options.concurrency;
    } else {
      this.concurrency = PromiseQueue.concurrency;
    }

    // options.autostart
    let autoStart: boolean;
    if (!isNullOrUndefined(options.autoStart)) {
      if (typeof options.autoStart !== "boolean") {
        throw new TypeError("options.autoStart must be of type boolean");
      }

      autoStart = options.autoStart;
    } else {
      autoStart = PromiseQueue.autoStart;
    }

    // options.actionInterval
    if (!isNullOrUndefined(options.actionInterval)) {
      if (typeof options.actionInterval !== "number") {
        throw new TypeError("options.actionInterval must be of type number");
      }

      if (options.actionInterval < 1) {
        throw new RangeError("options.actionInterval must be at least 1");
      }

      this.itemInterval = options.actionInterval;
    } else {
      this.itemInterval = PromiseQueue.actionInterval;
    }

    // options.nextActionsInterval
    if (!isNullOrUndefined(options.nextActionsInterval)) {
      if (typeof options.nextActionsInterval !== "number") {
        throw new TypeError("options.nextActionsInterval must be of type number");
      }

      if (options.nextActionsInterval < 1) {
        throw new RangeError("options.nextActionsInterval must be at least 1");
      }

      this.nextItemsInterval = options.nextActionsInterval;
    } else {
      this.nextItemsInterval = PromiseQueue.nextActionsInterval;
    }

    if (autoStart) {
      this.start();
    }
  }

  /**
   * Returns the number of items, which are already active.
   */
  public get activeLength(): number {
    return this.activeItems.length;
  }

  /**
   * A default value for a 'PromiseQueueOptions.actionInterval' prop.
   */
  public static actionInterval = 100;

  /**
   * A default value for a 'PromiseQueueOptions.autoStart' prop.
   */
  public static autoStart = true;

  /**
   * A default value for a 'PromiseQueueOptions.concurrency' prop.
   */
  public static concurrency = 1;

  /**
   * Clears the queue.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * const queue = new PromiseQueue()
   * assert.strictEqual(queue.isEmpty, true)
   *
   * for (let i = 1; i <= 10; i++) {
   *   queue.enqueue(async () => {
   *     // do some (long) work here ...
   *   })
   *
   *   assert.strictEqual(queue.isEmpty, false)
   * }
   *
   * queue.clear()
   * assert.strictEqual(queue.isEmpty, false)
   * ```
   */
  public clear() {
    this.pendingItems = [];
    this.activeItems = [];
  }

  /**
   * Enqueues a new action.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * const queue = new PromiseQueue()
   * assert.strictEqual(queue.length, 0)
   *
   * for (let i = 1; i <= 10; i++) {
   *   queue.enqueue(async () => {
   *     // do some (long) work here ...
   *   })
   *
   *   assert.strictEqual(queue.length, i)
   * }
   * ```
   *
   * @param {PromiseQueueAction} action The action to enqueue.
   * @param {any[]} [args] One or more argument for the action.
   *
   * @returns {Promise<T>} The promise with the result of the action.
   */
  public enqueue<T = any>(action: PromiseQueueAction, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let itemTimer: NodeJS.Timer | null = null;

      const newItem: PromiseQueueItem = {
        "action": asAsync(action),
        "activate": () => {
          const shouldNotContinue = () => {
            return !this.isActive || !this.isInQueue(newItem);
          };

          const checkIfReady = () => {
            if (shouldNotContinue()) {
              return;
            }

            itemTimer = setTimeout(() => {
              itemTimer = null;

              if (shouldNotContinue()) {
                return;
              }

              if (this.activeItems.indexOf(newItem) > -1) {
                const context: PromiseQueueActionContext = {
                  "isInQueue": undefined!,
                  "isQueueActive": undefined!,
                };

                Object.defineProperties(context, {
                  "isInQueue": {
                    "enumerable": true,
                    "configurable": false,
                    "get": () => this.isInQueue(newItem),
                  },
                  "isQueueActive": {
                    "enumerable": true,
                    "configurable": false,
                    "get": () => this.isActive,
                  },
                });

                newItem.action(...args)
                  .then(resolve)
                  .catch(reject)
                  .finally(() => {
                    this.activeItems = this.activeItems.filter((item) => item !== newItem);
                  });
              } else {
                checkIfReady();
              }
            }, this.itemInterval);
          };

          checkIfReady();
        },
        args,
        "deactivate": () => {
          if (itemTimer !== null) {
            clearTimeout(itemTimer);
          }
        },
      };

      this.pendingItems.push(newItem);

      newItem.activate();
    });
  }

  /**
   * Returns a list of all items.
   *
   * @returns {PromiseQueueItem[]} The list of all items.
   */
  protected getAllItems(): PromiseQueueItem[] {
    return [...this.pendingItems, ...this.activeItems,];
  }

  /**
   * Gets if queue is active or not.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * const queue = new PromiseQueue()
   * assert.strictEqual(queue.isActive, true)
   *
   * queue.stop()
   * assert.strictEqual(queue.isActive, false)
   * ```
   */
  public get isActive(): boolean {
    return this.timer !== null;
  }

  /**
   * Returns if the queue is empty or not.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * const queue = new PromiseQueue()
   * assert.strictEqual(queue.isEmpty, true)
   *
   * for (let i = 1; i <= 10; i++) {
   *   queue.enqueue(async () => {
   *     // do some (long) work here ...
   *   })
   *
   *   assert.strictEqual(queue.isEmpty, false)
   * }
   * ```
   */
  public get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Checks if an item is part of this queue.
   *
   * @param {PromiseQueueItem} item The item to check.
   *
   * @returns {boolean} Is part of this queue or not.
   */
  protected isInQueue(item: PromiseQueueItem): boolean {
    return this.activeItems.indexOf(item) > -1 ||
      this.pendingItems.indexOf(item) > -1;
  }

  /**
   * Returns the number of all items of the queue.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * const queue = new PromiseQueue()
   * assert.strictEqual(queue.length, 0)
   *
   * for (let i = 1; i <= 10; i++) {
   *   queue.enqueue(async () => {
   *     // do some (long) work here ...
   *   })
   *
   *   assert.strictEqual(queue.length, i)
   * }
   * ```
   */
  public get length(): number {
    return this.getAllItems().length;
  }

  /**
   * A default value for a 'PromiseQueueOptions.nextActionsInterval' prop.
   */
  public static nextActionsInterval = 100;

  /**
   * Returns the number of items, which are still pending.
   */
  public get pendingLength(): number {
    return this.pendingItems.length;
  }

  /**
   * Starts the queue.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * // create, but do not start the queue
   * const queue = new PromiseQueue({
   *   "autoStart": false,
   * })
   *
   * // do some preparations ...
   *
   * // now start the queue
   * queue.start()
   *
   * // ...
   * ```
   */
  public start() {
    this.timer = setInterval(() => {
      while (this.activeItems.length < this.concurrency) {
        const firstItem = this.pendingItems.shift();

        if (firstItem) {
          this.activeItems.push(firstItem);
        } else {
          break;
        }
      }
    }, this.nextItemsInterval);
  }

  /**
   * Stops the queue.
   *
   * @example
   * ```
   * import assert from "assert"
   * import { PromiseQueue } from "@marcelkloubert/promises"
   *
   * // create and start the queue
   * const queue = new PromiseQueue()
   *
   * // work with the queue ...
   *
   * // stop the queue
   * queue.stop()
   * ```
   */
  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);

      this.timer = null;

      this.getAllItems().forEach((item) => {
        item.deactivate();
      });
    }
  }
}
