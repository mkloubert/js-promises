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

/**
 * A 'cancel()' action for a 'CancelablePromise'.
 */
export type PromiseCancelAction = (reason?: string) => any;

/**
 * The getter for an 'isCanceled' prop of a 'CancelablePromise' instance.
 */
export type IsCanceledGetter = () => any;

/**
 * A promise, which can be cancelled.
 */
export class CancelablePromise<T = any> implements Promise<T>, PromiseLike<T> {
  /**
   * Initializes a new instance of that class.
   *
   * @param {Promise<T>} promise The base promise.
   * @param {PromiseCancelAction} cancel The function, which is used for cancellation.
   * @param {IsCanceledGetter} isCanceledGetter The function, which gets the value for 'isCanceled' prop.
   */
  public constructor(
    public readonly promise: Promise<T>,
    public readonly cancel: PromiseCancelAction,
    private readonly isCanceledGetter: IsCanceledGetter,
  ) {
    if (!(promise instanceof Promise)) {
      throw new TypeError("promise must be of type Promise");
    }

    if (typeof cancel !== "function") {
      throw new TypeError("cancel must be of type function");
    }

    if (typeof isCanceledGetter !== "function") {
      throw new TypeError("isCanceledGetter must be of type function");
    }
  }

  /**
   * @inheritdoc
   */
  public get [Symbol.toStringTag](): string {
    return this.promise[Symbol.toStringTag];
  }

  /**
   * @inheritdoc
   */
  public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  /**
   * @inheritdoc
   */
  public finally(onfinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onfinally);
  }

  /**
   * Gets a value, which indicates if operation has been cancelled or not.
   */
  public get isCanceled() {
    return !!this.isCanceledGetter();
  }

  /**
   * @inheritdoc
   */
  public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
