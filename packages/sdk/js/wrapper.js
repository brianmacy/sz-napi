'use strict';

const { mapToSzError } = require('./errors');

function wrapFunction(fn) {
  return function wrapped(...args) {
    try {
      const result = fn.apply(this, args);
      if (result && typeof result.then === 'function') {
        return result.catch((err) => {
          throw mapToSzError(err);
        });
      }
      return result;
    } catch (err) {
      throw mapToSzError(err);
    }
  };
}

function wrapClass(NativeClass, methodNames) {
  for (const name of methodNames) {
    const original = NativeClass.prototype[name];
    if (typeof original !== 'function') {
      continue;
    }
    NativeClass.prototype[name] = wrapFunction(original);
  }
  return NativeClass;
}

module.exports = { wrapFunction, wrapClass };
