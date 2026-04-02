import { logger } from "./diagnostic-log";

/**
 * marked v17+ uses Array.prototype.at (ES2022). Target Kindle / old WebKit
 * (see supported-browser-features.txt) where .at is missing — load before app.
 * ES5-safe implementation.
 */
export function installArrayAtPolyfill(): void {
  if (typeof Array === "undefined" || Array.prototype.at) {
    return;
  }

  function toInteger(value: unknown): number {
    var x = Number(value);
    if (x !== x || x === 0) {
      return 0;
    }
    return x < 0 ? -Math.floor(-x) : Math.floor(x);
  }

  logger("polyfills").debug("installing Array.prototype.at polyfill");

  Array.prototype.at = function (index: number) {
    var o = Object(this) as ArrayLike<unknown>;
    var len = o.length >>> 0;
    var relativeIndex = toInteger(index);
    var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
    if (k < 0 || k >= len) {
      return undefined;
    }
    return o[k];
  };
}

installArrayAtPolyfill();
