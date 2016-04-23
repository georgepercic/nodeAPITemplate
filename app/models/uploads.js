'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:uploads-model' );
var _ds = require( '../components/datasource.js' ).get( 'rethinkdb' );

var _thinky = require('thinky')(_ds);
var _type = _thinky.type;

_debug( 'INIT' );

// User profile model fields definition and validation
var UploadModel = _thinky.createModel('uploads', {
    userId: _type.string(),
    avatar: _type.string(),
    files: _type.array(),
    createdAt: _type.date().default(new Date)
}, {
    pk: 'userId' 
});

module.exports = UploadModel;