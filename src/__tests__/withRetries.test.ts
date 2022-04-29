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

import { withRetries, } from "..";
import { MaximumTriesReachedError, } from "../errors";

describe("withRetries() function", () => {
  it("should throw MaximumTriesReachedError", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      const action = async () => {
        throw new Error("Foo");
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      const expectedErrorCount = maxRetries + 1;

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), maxRetries);
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(true);
        expect(Array.isArray(thrownException.errors)).toBe(true);
        expect(typeof thrownException.errors.length).toBe("number");
        expect(thrownException.errors.length).toBe(expectedErrorCount);
        expect(result).toBe(false);
      }
    }
  });

  it("should throw MaximumTriesReachedError and has waitBeforeRetry value", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      const action = async () => {
        throw new Error("Foo");
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      const expectedErrorCount = maxRetries + 1;

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), {
            maxRetries,
            "waitBeforeRetry": 10,
          });
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(true);
        expect(Array.isArray(thrownException.errors)).toBe(true);
        expect(typeof thrownException.errors.length).toBe("number");
        expect(thrownException.errors.length).toBe(expectedErrorCount);
        expect(result).toBe(false);
      }
    }
  });

  it("should not throw MaximumTriesReachedError if no error is thrown in action", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      const action = async () => {
        return true;
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), maxRetries);
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(false);
        expect(result).toBe(true);
      }
    }
  });

  it("should not throw MaximumTriesReachedError if no error is thrown in action and has waitBeforeRetry value", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      const action = async () => {
        return true;
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), {
            maxRetries,
            "waitBeforeRetry": 10,
          });
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(false);
        expect(result).toBe(true);
      }
    }
  });

  it("should not throw MaximumTriesReachedError if maxRetries not reached", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      let counter = maxRetries;
      const action = async () => {
        if (counter-- > 0) {
          throw new Error("Foo");
        }

        return true;
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), maxRetries);
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(false);
        expect(result).toBe(true);
      }
    }
  });

  it("should not throw MaximumTriesReachedError if maxRetries not reached and has waitBeforeRetry value", async () => {
    for (let maxRetries = 0; maxRetries <= 10; maxRetries++) {
      let counter = maxRetries;
      const action = async () => {
        if (counter-- > 0) {
          throw new Error("Foo");
        }

        return true;
      };

      const actionsGetters = [
        () => action,
        () => action(),
      ];

      for (const getAction of actionsGetters) {
        let thrownException: any;
        let result: any = false;
        try {
          result = await withRetries(getAction(), {
            maxRetries,
            "waitBeforeRetry": 10,
          });
        } catch (ex) {
          thrownException = ex;
        }

        expect(thrownException instanceof MaximumTriesReachedError).toBe(false);
        expect(result).toBe(true);
      }
    }
  });
});
