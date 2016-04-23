'use strict';

// dependencies
var _debug = require('debug')('highr:router');
var _compression = require('compression');
var _bodyParser = require('body-parser');
var _cookieParser = require('cookie-parser');
var _jwt = require('jsonwebtoken');
var _fs = require('fs');
var _path = require('path');
var _qs = require('qs');
var _sanitizer = require('./sanitizer');

var _config = require('../config.js');
var _logger = require('./logger.js');

_debug('INIT');

module.exports = function(connectApp) {

    // Middle 1.1 - Compression middleware
    //
    connectApp.use(_compression());

    // Middle 1.2 - Body parsing middleware
    //
    connectApp.use(_bodyParser.json());

    // Middle 1.3 - Parse and set cookies on req.cookies
    //
    connectApp.use(_cookieParser());

    // Middle 2 - Parse the query string into JSON object
    //
    connectApp.use(function querystringParsing(req, res, next) {

        req.query = {};

        if (req.url.indexOf('?') !== -1) {

            var queryString = req.url.substring(
                req.url.indexOf('?') + 1, req.url.length);

            req.query = _qs.parse(queryString, {
                delimiter: '&',
                allowDots: true
            });
        }

        _debug(req.query);

        next();
    });
    
    //Middle 2.1 - Sanitize user input
    connectApp.use(function inputSanitize(req, res, next) {
        if(req.body) {
            _sanitizer(req.body);
        }
        next();
    });

    // Middle 3 - Request validation
    //
    connectApp.use(function validateRequest(req, res, next) {

        _debug('Validating request for', req.url);

        next();
    });

    // Middle 3.1 - verify token
    //
    connectApp.use('/api', function validateToken(req, res, next) {

        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        var __jwt = _config.get('jwt');

        if (token) {
            _debug('Validating token for', token);
            // verifies secret and checks exp
            _jwt.verify(token, __jwt.privateKey, function(err, decoded) {
                if (err) {
                    res.statusCode = 403;
                    next(new Error('Failed to authenticate token.'));
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });

        } else {
            
            _debug('No token found :(');
            // if there is no token
            // return an error
            res.statusCode = 403;
            next(new Error('Token not provided'));
        }
    });

    // Middle 4 - Load application routes
    //
    var routeFolder = _path.join(
        _config.get('appPath'),
        _config.get('routePath')
    );

    // Load routes from each file inside the routes folder
    //
    var files = _fs.readdirSync(routeFolder);

    _debug('Loading from ', routeFolder);

    for (var i = 0, len = files.length; i < len; i++) {

        var __filePath = _path.join(routeFolder, files[i]);
        var __stats = _fs.statSync(__filePath);

        if (__stats.isFile()) {
            require(__filePath)(connectApp);
        }
    }

    // Intercept errors and pass them to the client
    //
    // Errors that occur in the middleware added before the error middleware
    // will invoke this middleware when errors occur.
    //
    connectApp.use(function onerror(err, req, res, next) {

        // format error for client
        res.payload = {
            errno: err.errno,
            code: err.code,
            error: err.name,
            message: err.message
        };

        if (typeof err.errors !== 'undefined') {
            res.payload.details = err.errors;
        }

        // set generic error if not already set
        if (res.statusCode < 400) {
            res.statusCode = 400;
        }

        // log to file
        _logger.log({
            req: req,
            res: res
        }, err);

        next();
    });

    // Middle 5 - prepare JSON response
    // Last callback before sending data to client
    //
    connectApp.use(function beforeSend(req, res) {

        if (typeof res.payload === 'undefined') {
            res.payload = {};
        }

        // transform json object to string
        res.payload = JSON.stringify(res.payload);

        res.writeHead(res.statusCode, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(res.payload, 'utf8')
        });

        _debug('Served:', req.url, 'with status', res.statusCode);

        // bye bye
        res.end(res.payload, 'utf8');
    });
    
    

};