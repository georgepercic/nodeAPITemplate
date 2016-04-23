'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:router:user-routes' );
var _connectRoute = require( 'connect-route' );
var _async = require( 'async' );

var _crudify = require( './templates/crud' );
var _userModel = require( '../models/users' );
var _roleModel = require( '../models/roles' );

_debug( 'INIT' );

module.exports = function( connectApp ) {

    function localRoutes( router ) {

        var usersCRUD = new _crudify( _userModel );

        /*
         *  Find All
         */
        router.get( '/api/users', function( req, res, next ) {
            usersCRUD.findAll( req, res, next );
        } );

        /*
         *  Find By ID
         */
        router.get( '/api/users/:id', function( req, res, next ) {

            if (typeof req.decoded !== 'undefined' ) {
                var userId = req.params.id;
                var jwtDecoded = req.decoded;
                
                if (userId !== jwtDecoded.sub) {
                    res.statusCode = 403;
                    next(new Error('Not authorized'));
                }
                
                usersCRUD.findByID( req, res, next );  
            } else {
                next(new Error('Not authorized'));
            }
        } );

        /*
         *  Delete User By ID
         */
        router.delete( '/api/users/:id', function( req, res, next ) {

            _async.waterfall( [

                // see if user exists
                //
                function( callback ) {

                    _userModel.findOne( {
                        where: {
                            id: req.params.id
                        }
                    } )
                        .then( function( user ) {

                            if ( user === null ) {
                                res.statusCode = 404;
                                callback( new Error( 'User not found.' ) );
                            } else {
                                callback( null, user );
                            }
                        } )
                        .catch( function( error ) {
                            callback( error );
                        } );
                },

                // delete
                //
                function( user, callback ) {

                    user.destroy( {
                        where: {
                            id: user.getid
                        }
                    } )
                        .then( function( user ) {
                            callback( null, user );
                        } )
                        .catch( function( error ) {
                            callback( error );
                        } );
                }
            ], function( error, result ) {

                if ( error ) {

                    if ( res.statusCode < 400 ) {
                        res.statusCode = 409;
                    }
                    next( error );
                } else {
                    res.payload = result;
                    next();
                }
            } );
        } );
        
        /*
         *  Create
         */
        router.post( '/api/users', function( req, res, next ) {

            _userModel.create( req.body )
                .then( function( users ) {

                    res.payload = users;
                    res.statusCode = 201;

                    next();
                } ).catch( function( error ) {

                    // error
                    res.statusCode = 409;
                    next( error );
                } );
        } );

        /*
         *  Update
         */
        router.patch( '/api/users/:id', function( req, res, next ) {
            
            if (typeof req.decoded !== 'undefined' ) {
                var userId = req.params.id;
                var jwtDecoded = req.decoded;
                
                if (userId !== jwtDecoded.sub) {
                    res.statusCode = 403;
                    next(new Error('Not authorized'));
                }
                
                usersCRUD.update( req, res, next );  
            } else {
                next(new Error('Not authorized'));
            }
        } );

        /*
         *  Find Roles for user ID
         */
        router.get( '/api/users/:id/roles', function( req, res, next ) {

            // cast to array if exists
            if ( typeof req.query.attributes === 'undefined' ) {
                req.query.attributes = [];
            } else if ( typeof req.query.attributes === 'string' ) {
                req.query.attributes = [ req.query.attributes ];
            }

            // don't retrieve any fields other that `id`, unless specified
            var __attributes = [ 'id' ].concat( req.query.attributes );

            _userModel.findOne( {
                include: [ {
                    model: _roleModel
                } ],
                attributes: __attributes,
                where: {
                    id: req.params.id
                }
            } ).then( function( user ) {

                if ( user === null ) {
                    res.statusCode = 404;
                } else {
                    res.payload = user;
                }

                next();
            } ).catch( function( error ) {

                res.statusCode = 409;
                next( error );
            } );
        } );

        // Users Add Role
        //
        router.post( '/api/users/:userId/roles/:roleId', function( req, res, next ) {

            _async.waterfall( [

                // see if user exists
                //
                function( callback ) {

                    _userModel.findOne( {
                        where: {
                            id: req.params.userId
                        }
                    } )
                        .then( function( user ) {

                            if ( user === null ) {
                                res.statusCode = 404;
                                callback( new Error( 'User not found.' ) );
                            } else {
                                callback( null, user );
                            }
                        } )
                        .catch( function( error ) {
                            callback( error );
                        } );
                },

                // see if role exits
                //
                function( user, callback ) {

                    _roleModel.findOne( {
                        where: {
                            id: req.params.roleId
                        }
                    } )
                        .then( function( role ) {

                            if ( role === null ) {
                                res.statusCode = 404;
                                callback( new Error( 'Role not found.' ) );
                            } else {
                                callback( null, user, role );
                            }
                        } )
                        .catch( function( error ) {
                            callback( error );
                        } );
                },

                // assign role to user
                //
                function( user, role, callback ) {

                    if ( role.assignable === false ) {
                        res.statusCode = 409;
                        callback( new Error( 'Role is not assignable.' ) );
                    } else {

                        // passed all the tests, do the assignment
                        user.addRole( [ role.id ] )
                            .then( function( userRole ) {
                                callback( null, userRole );
                            } )
                            .catch( function( error ) {
                                callback( error );
                            } );
                    }
                }

                // after all callbacks are ran or error is passed
                //
            ], function( error, result ) {

                if ( error ) {

                    if ( res.statusCode < 400 ) {
                        res.statusCode = 409;
                    }
                    next( error );
                } else {
                    res.payload = result;
                    next();
                }
            } );
        } );
    }

    connectApp.use( _connectRoute( localRoutes ) );
};