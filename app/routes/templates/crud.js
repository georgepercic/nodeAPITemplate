'use strict';

// dependencies
var _debug = require('debug')('highr:router:crudify-template');
var _async = require('async');

_debug('INIT');

/**
 * [CRUDify constructor description]
 * @param {[type]} sequelizeModel [description]
 */
function CRUDify(sequelizeModel) {
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
CRUDify.prototype.findByID = function(req, res, next) {
    //_debug(req.decoded);
    var __model = this.model;

    // default query options
    //
    var __queryOptions = {
        where: {
            id: req.params.id
        }
    };

    // test query param `attributes`, always return `id` field and cast to
    // array
    //
    if (typeof req.query.attributes !== 'undefined') {
        __queryOptions.attributes = [ 'id' ].concat(req.query.attributes);
    }

    // do the model find
    //
    __model.findOne(__queryOptions).then(function(modelInstance) {

        // check for not found
        if (modelInstance === null) {
            res.statusCode = 404;
            next(new Error(__model.name.toUpperCase() + ' not found.'));
        } else {
            res.payload = modelInstance;
        }

        next();
    }).catch(function(error) {

        res.statusCode = 409;
        next(error);
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
CRUDify.prototype.findAll = function(req, res, next) {

    var __model = this.model;

    _async.waterfall(
        [
            // setup query options based on request params
            //
            function(callback) {

                // default query options
                //
                var __queryOptions = {
                    limit: 10,
                    offset: 0,
                    // TODO: need to fix this, maybe the model doesnt have
                    // createdAt field. Look at Sequelize scopes.
                    order: [
                        [ 'createdAt', 'DESC' ]
                    ]
                };

                // test query param `attributes`, always return `id` field and
                // cast to array
                //
                if (typeof req.query.attributes !== 'undefined') {
                    __queryOptions.attributes = [ 'id' ].concat(req.query.attributes);
                }

                // test query param `limit`
                //
                if (typeof req.query.limit !== 'undefined') {
                    __queryOptions.limit = Number(req.query.limit);
                }

                // test query param `offset`
                //
                if (typeof req.query.offset !== 'undefined') {
                    __queryOptions.offset = Number(req.query.offset);
                }
                _debug(__queryOptions);

                callback(null, __queryOptions);
            },

            // do the model find
            //
            function(queryOptions, callback) {

                __model.findAll(queryOptions)
                    .then(function(modelInstances) {
                        callback(null, modelInstances);
                    })
                    .catch(function(error) {
                        callback(error);
                    });
            }
        ],

        // after all callbacks are ran or error is passed
        //
        function(error, result) {

            if (error) {

                if (res.statusCode < 400) {
                    res.statusCode = 409;
                }
                next(error);
            } else {
                res.payload = result;
                next();
            }
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
CRUDify.prototype.delete = function(req, res, next) {

    var __model = this.model;

    _async.waterfall([

        // see if model exists
        function(callback) {

            __model.findOne({
                where: {
                    id: req.params.id
                }
            })
                .then(function(modelInstance) {

                    if (modelInstance === null) {
                        res.statusCode = 404;
                        callback(new Error(__model.name.toUpperCase() + ' not found.'));
                    } else {
                        callback(null, modelInstance);
                    }
                })
                .catch(function(error) {
                    callback(error);
                });
        },

        // delete
        function(modelInstance, callback) {

            modelInstance.destroy({
                where: {
                    id: modelInstance.id
                }
            })
                .then(function(modelInstance) {
                    callback(null, modelInstance);
                })
                .catch(function(error) {
                    callback(error);
                });
        }
    ], function(error, result) {

        if (error) {

            if (res.statusCode < 400) {
                res.statusCode = 409;
            }
            next(error);
        } else {
            res.payload = result;
            next();
        }
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
CRUDify.prototype.create = function(req, res, next) {

    var __model = this.model;

    __model.create(req.body)
        .then(function(modelInstance) {

            res.payload = modelInstance;
            res.statusCode = 201;

            next();
        }).catch(function(error) {

            // error
            res.statusCode = 409;
            next(error);
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
CRUDify.prototype.update = function(req, res, next) {

    var __model = this.model;

    _async.waterfall([

        // see if model exists
        function(callback) {

            __model.findOne({
                where: {
                    id: req.params.id
                }
            })
                .then(function(modelInstance) {

                    if (modelInstance === null) {
                        res.statusCode = 404;
                        callback(new Error(__model.name.toUpperCase() + ' not found.'));
                    } else {
                        callback(null, modelInstance);
                    }
                })
                .catch(function(error) {
                    callback(error);
                });
        },

        // update
        //
        function(modelInstance, callback) {

            modelInstance.update(req.body, {
                where: {
                    id: modelInstance.id
                }
            })
                .then(function(modelInstance) {
                    callback(null, modelInstance);
                })
                .catch(function(error) {
                    callback(error);
                });
        }
    ], function(error, result) {

        if (error) {

            if (res.statusCode < 400) {
                res.statusCode = 409;
            }
            next(error);
        } else {
            res.payload = result;
            next();
        }
    });
};

module.exports = CRUDify;