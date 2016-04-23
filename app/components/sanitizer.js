'use strict';

// dependencies
var _debug = require('debug')('highr:sanitizer');
var _sanitizer = require('validator');
var _ = require('underscore');

_debug('INIT');

var Sanitizer = function (obj) {
    _.each(obj, function(value, key) {
        if (typeof value === 'object' && value !== null) {
            Sanitizer(value);
        } else if(typeof value === 'string') {
            value = _sanitizer.escape(value);
            value = _sanitizer.blacklist(value, '\\[\\]');
            if (typeof key === 'string' && _sanitizer.matches(key, /email/i)) {
                value = _sanitizer.normalizeEmail(value, { lowercase: true, remove_dots: false, remove_extension: true });
            }
            obj[key] = value;
        }
    });
};

module.exports = Sanitizer;