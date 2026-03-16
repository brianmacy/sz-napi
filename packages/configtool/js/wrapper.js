'use strict';

const { mapToConfigError } = require('./errors');

function wrapFunction(fn) {
  return function wrapped(...args) {
    try {
      const result = fn.apply(this, args);
      if (result && typeof result.then === 'function') {
        return result.catch((err) => {
          throw mapToConfigError(err);
        });
      }
      return result;
    } catch (err) {
      throw mapToConfigError(err);
    }
  };
}

module.exports = { wrapFunction };
