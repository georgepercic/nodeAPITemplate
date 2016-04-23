'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:router:roles-routes' );
var _connectRoute = require( 'connect-route' );

var _roleModel = require( '../models/roles' );
var _crudify = require( './templates/crud' );

_debug( 'INIT' );

module.exports = function( connectApp ) {

    function localRoutes( router ) {

        var rolesCRUD = new _crudify( _roleModel );

        /*
         *  Find All
         */
        router.get( '/api/roles', function( req, res, next ) {
            rolesCRUD.findAll( req, res, next );
        } );

        /*
         *  Find By ID
         */
        router.get( '/api/roles/:id', function( req, res, next ) {
            rolesCRUD.findByID( req, res, next );
        } );

    }

    connectApp.use( _connectRoute( localRoutes ) );
};