'use strict';

// dependencies
var _debug = require('debug')('highr:datasource');
var _sequelize = require('sequelize');
var _config = require('../config.js');

_debug('INIT');

var __datasources = {};
var __datasourceConfig = _config.get('datasource');

// loop through all datasource definitions from `config.js` and create
// a datasource object for each
for (var ds in __datasourceConfig) {
    
    if (__datasourceConfig[ds].dialect === 'mysql') {
        __datasources[ds] = new _sequelize(
        __datasourceConfig[ds].database,
        __datasourceConfig[ds].user,
        __datasourceConfig[ds].password, {
            host: __datasourceConfig[ds].host,
            dialect: __datasourceConfig[ds].dialect,
            logging: _config.get('development')
        });   
    } else {
        __datasources[ds] = __datasourceConfig[ds];
    }
}

module.exports = {
    /**
     * Retrieve datasource by name.
     *
     * @param {string} name - Datasource name (see config.js).
     * @return {null|obj} - The Sequelize datasource object.
     */
    get: function(name) {

        if (__datasources.hasOwnProperty(name)) {

            _debug('FETCH - ', name);
            return __datasources[name];
        }

        _debug('Not found', name);
        return null;
    }
};