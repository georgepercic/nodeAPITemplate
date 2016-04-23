'use strict';

// dependencies
var _debug = require('debug')('highr:logger');
var _bunyan = require('bunyan');
var _config = require('../config');

// What to log if certain field are available in the logging object
//
var __serializers = {

    // trim out data from the request
    //
    req: function(req) {
        if (!req || !req.connection) {
            return req;
        }

        var __body = req.body;

        // dont log plain text passwords
        //
        // TODO: this should be looking for pass in depth ... we'll see
        // depending on use cases
        if (typeof __body.password !== 'undefined') {
            __body.password = '****';
        }

        return {
            method: req.method,
            url: {
                route: req.route,
                path: req.url,
                params: req.params,
                queryParams: req.query
            },
            body: __body,
            headers: req.headers,
            remoteAddress: req.connection.remoteAddress,
            remotePort: req.connection.remotePort,
            cookies: req.cookies
        };
    },

    // trim out data from the response
    //
    res: function(res) {
        if (!res || !res.statusCode) {
            return res;
        }

        return {
            statusCode: res.statusCode,
            header: res._header,
            payload: res.payload
        };
    },

    // trim out data from the error
    //
    error: function(error) {
        var __errorStack = {};

        // format stack as object
        if (typeof error.stack === 'string') {
            __errorStack = error.stack.split('\n').reduce(
                function(o, v, i) {
                    o[i] = v;
                    return o;
                }, {});
        }

        return {
            name: error.name,
            stack: __errorStack
        };
    }
};

// Create the logger
//
var __logger = _bunyan.createLogger({
    name: _config.get('appName'),
    level: 'trace',
    serializers: __serializers,
    streams: [ {
        path: './logs/' + _config.get('appName') + '-error.log'
    } ]
});

_debug('INIT');

module.exports = {
    /**
     * Bunyan logger wrapper that forces logger.trace
     *
     * @param  {[type]} fields [description]
     * @param  {[type]} error  [description]
     * @return {[type]}        [description]
     */
    log: function(fields, error) {

        // default value - empty object
        if (typeof fields === 'undefined' || fields === null) {
            fields = {};
        }

        fields.error = error;

        __logger.trace(fields, error.message);
    }
};