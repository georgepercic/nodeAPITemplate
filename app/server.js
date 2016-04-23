'use strict';

// dependencies
var _debug = require('debug')('highr:base');
var _connect = require('connect');
var _logger = require('./components/logger');

// configuration store
var _config = require('./config');

// set absolute path
_config.set('appPath', __dirname);

// set slug lib default format
var _slug = require('slug');
_slug.defaults.mode = 'rfc3986';

// connect middleware pipe
var app = _connect();

// load routes
require('./components/router.js')(app);

// load models
require('./models');

// handle non application errors
process.on('uncaughtException', function(err) {

    // log to file
    _logger.log({}, err);

    process.exit(1);
});

// Start Base
// The .listen() method is a convenience to start a HTTP server.
app.listen(_config.get('port'));

_debug('Started listening on port', _config.get('port'));