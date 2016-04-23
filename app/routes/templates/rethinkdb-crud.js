'use strict';

// dependencies
var _ds = require( '../../components/datasource.js' ).get( 'rethinkdb' );
var _thinky = require('thinky')(_ds);
var _r = _thinky.r;
var _debug = require( 'debug' )( 'highr:router:rethinkdb-crudify-template' );

_debug( 'INIT' );

/**
 * [RethinkdbCRUDify constructor description]
 * @param {[type]} sequelizeModel [description]
 */
function RethinkdbCRUDify( sequelizeModel ) {
    this.model = sequelizeModel;
}

/**
 * Get model instance by ID
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.findByID = function( req, res, next ) {

    var __model = this.model;
    var id = req.params.id;

    __model.get(id).run().then(function(modelInstance) {
        
        res.payload = modelInstance;
        next();
    }).catch( function( error ) {

        res.statusCode = 404;
        next( error );
    });
};

/**
 * Get all model instances
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.findAll = function( req, res, next ) {

    var __model = this.model;

    __model.run().then(function(modelInstance) {
        
        res.payload = modelInstance;
        next();
    }).catch( function( error ) {

        res.statusCode = 404;
        next( error );
    });
};

/**
 * Delete model instance
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.delete = function( req, res, next ) {

    var __model = this.model;
    var id = req.params.id;

    __model.get(id).delete().run().then(function(modelInstance) {
        
        res.payload = modelInstance;
        next();
    }).catch( function( error ) {

        res.statusCode = 409;
        next( error );
    });
};

/**
 * Create model instance
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.create = function( req, res, next ) {

    var __model = this.model;
    var newModel = new __model(req.body);

    newModel.save().then(function(result) {
        res.payload = result;
        res.statusCode = 201;

        next();
    }).catch( function( error ) {

        // error
        res.statusCode = 409;
        next( error );
    });
};

/**
 * Update model instance
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.update = function( req, res, next ) {

    var __model = this.model;
    var id = req.params.id;

    __model.get(id).update(req.body).run().then(function(modelInstance) {
        res.payload = modelInstance;
        res.statusCode = 201;

        next();
    }).catch( function( error ) {

        // error
        res.statusCode = 409;
        next( error );
    });
};

/**
 * Remove key model instance
 *
 * @param  {[Object]}   req  Request object passed from connect
 * @param  {[Object]}   res  Response object passed from connect
 * @param  {Function}   next Connect "next in line" callback
 * @return {[type]}
 */
RethinkdbCRUDify.prototype.replace = function( req, res, next ) {
    /**
     * Sample Object request: { "custom": { "c3018c48-62f3-4b36-9844-0cc37e78f889": true } }
     */
    var __model = this.model;
    var id = req.params.id;

    __model.get(id).replace(_r.row.without(req.body)).run().then(function(modelInstance) {
        res.payload = modelInstance;
        res.statusCode = 201;

        next();
    }).catch( function( error ) {

        // error
        res.statusCode = 409;
        next( error );
    });
};


module.exports = RethinkdbCRUDify;