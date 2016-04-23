'use strict';

// dependencies
var _debug = require('debug')('highr:config');

_debug('INIT');

var defaults = {

    //
    domain: 'local-higr.dev',

    //
    appName: 'highr-api-base',

    // Absolute path to the root folder of the app.
    // Will be set in the bootstrap process
    appPath: '',

    // Models definition path, relative to `appPath`
    modelPath: 'models',

    // Routes definition path, relative to `appPath`
    routePath: 'routes',

    //
    port: 3100,

    // If TRUE:
    //      - sync model with Sequelize definition on start-up and load
    // model fixtures;
    //      - Sequelize datasource logging set to true;
    //
    // THIS WILL DROP AND REBUILD ALL TABLES
    development: true,

    //
    datasource: {
        base: {
            host: 'localhost',
            database: 'highr_base',
            user: 'root',
            password: 'root',
            port: 3306,
            dialect: 'mysql' //change if else is needed
        },
        rethinkdb: {
            host: 'localhost',
            port: 3002,
            authKey: '',
            db: 'highr_base',
            dialect: 'rethinkdb' //change if else is needed
        }
    },

    // Using a high work factor makes it incredibly difficult to execute a
    // brute-force attack, but can put unnecessary load on the system.
    //
    // This values should be determined by testing the server on which the app
    // will work on.
    //
    // see security.stackexchange.com/questions/17207
    bcryptWorkFactor: 10,

    // Auth JWT settings
    jwt: {
        authExpiration: '3h',
        rememberExpiration: '14d',
        privateKey: '06a6a6a9-edf2-47ee-af93-3ae8f9a1f81a'
    }
};

module.exports = {
    /**
     * Retrieve configuration key
     *
     * @param  {string} key [description]
     * @return {any|null}   [description]
     */
    get: function(key) {

        if (defaults.hasOwnProperty(key)) {

            _debug('FETCH - ', key);
            return defaults[key];
        }

        _debug('Key not found', key);
        return null;
    },

    /**
     * Set configuration key, only if already defined
     *
     * @param  {string} key [description]
     * @return {any}        [description]
     */
    set: function(key, value) {

        if (defaults.hasOwnProperty(key)) {

            _debug('SET - ', key, 'to', value);
            defaults[key] = value;

            return true;
        }

        _debug('Key not found', key);
        return null;
    }
};