'use strict';

/**
 * [RequestValidationError description]
 * @param {[type]} message [description]
 */
function RequestValidationError(message) {
    this.name = 'RequestValidationError';

    if (message) {
        message = message.split(',').map(function(value) {
            return String(value).trim();
        });
    }

    this.message = message || 'Request data malformed.';
    this.stack = (new Error()).stack;
}

RequestValidationError.prototype = Object.create(Error.prototype);
RequestValidationError.prototype.constructor = RequestValidationError;

module.exports = RequestValidationError;