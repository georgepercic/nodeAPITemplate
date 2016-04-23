'use strict';

// dependencies
var _debug = require('debug')('highr:router:auth-routes');
var _connectRoute = require('connect-route');
var _async = require('async');
var _bcrypt = require('bcrypt');
var _jwt = require('jsonwebtoken');
var _jsonValidator = require('ajv');
var _moment = require('moment');
var _fs = require('fs');

var _requestValidationError = require('../errors/RequestValidationError');
var _config = require('../config');
var _userModel = require('../models/users');
var _tokenModel = require('../models/tokens');

_debug('INIT');

module.exports = function(connectApp) {
    
    function _sendEmail(tokens) {
        var token = tokens[0].token;
        var fileContent = 'http://highr.dev/user/confirm-account/' + token;
        _fs.writeFile('./uploads/test', fileContent, function(err) {
            if(err) {
                _debug(err);
            } else {
                _debug('The file was saved!');
            }
        }); 
    }

    function localRoutes(router) {

        // create a json validator (per model) using draft proposals for v5
        //
        var __usersValidator = _jsonValidator({
            allErrors: true,
            v5: true
        });

        // add schemas to validator
        //
        var registerUserSchema = require('../schemas/request-register');
        var loginUserSchema = require('../schemas/request-login');

        __usersValidator.addSchema(registerUserSchema, 'post-users-account');
        __usersValidator.addSchema(loginUserSchema, 'patch-users-account');

        // create que connection to activity que
        //

        /*
         *  Login route
         */
        router.patch('/user/account', function(req, res, next) {

            _async.waterfall([
                // validate request data
                //
                function(callback) {

                    // check data against schema
                    var __isRequestValid = __usersValidator.validate(
                        'patch-users-account', req.body);

                    //
                    if (__isRequestValid) {
                        callback(null);
                    } else {
                        callback(new _requestValidationError(__usersValidator.errorsText()));
                    }
                },
                // see if user exists
                //
                function(callback) {

                    _userModel.findOne({
                        where: {
                            'email': req.body.email,
                            'active': true
                        }
                    })
                        .then(function(user) {

                            if (user === null) {
                                res.statusCode = 401;
                                callback(new Error('Email/password combination is wrong.'));
                            } else {
                                callback(null, user);
                            }
                        })
                        .catch(function(error) {
                            callback(error);
                        });
                },
                // compare password
                //
                function(user, callback) {

                    _bcrypt.compare(
                        req.body.password,

                        user.get('password'),

                        function(error, isMatch) {

                            if (error || isMatch === false) {
                                res.statusCode = 401;
                                callback(new Error('Email/password combination is wrong.'));
                            } else {
                                callback(null, user);
                            }
                        });
                },
                // construct JWT token & Remember Token
                //
                function(user, callback) {

                    var __result = user.toJSON();
                    var __jwt = _config.get('jwt');

                    __result.tokens = {
                        auth: _jwt.sign({}, __jwt.privateKey, {
                            algorithm: 'HS256',
                            expiresIn: __jwt.authExpiration,
                            issuer: _config.get('domain'),
                            subject: user.get('id')
                        })
                    };

                    if (req.body.rememberMe === true) {

                        __result.tokens.remember = _jwt.sign({},
                            __jwt.privateKey, {
                                algorithm: 'HS256',
                                expiresIn: __jwt.rememberExpiration,
                                issuer: _config.get('domain'),
                                subject: user.get('id')
                            });
                    }

                    callback(null, __result);
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

        });

        /*
         *  Register route
         */
        router.post('/user/account', function(req, res, next) {

            _async.waterfall([
                // validate request data
                //
                function(callback) {

                    // check data against schema
                    var __isRequestValid = __usersValidator.validate(
                        'post-users-account', req.body);

                    //
                    if (__isRequestValid) {
                        callback(null);
                    } else {
                        callback(new _requestValidationError(__usersValidator.errorsText()));
                    }
                },
                // save user data with associated token
                //
                function(callback) {

                    var __userData = req.body;

                    __userData.tokens = [ {
                        email: req.body.email,
                        type: 'auth',
                        expiresAt: _moment().add(1, 'days').format()
                    } ];

                    _userModel.createWithTransaction(__userData, {
                        include: [ {
                            model: _tokenModel
                        } ]
                    })
                        .then(function(savedUser) {
                            // Transaction has been committed
                            // result is whatever the result of the
                            // promise chain returned to the transaction
                            // callback
                            res.statusCode = 201;
                            callback(null, savedUser);
                        })
                        .catch(function(error) {
                            // Transaction has been rolled back
                            // err is whatever rejected the promise chain
                            // returned to the transaction callback
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
                        //send email
                        //var tokens = result.tokens;
                        _sendEmail(result.tokens);
                        
                        res.payload = result;
                        next();
                    }
                });
        });
        
        /**
         * Confirm account
         */
        router.get('/user/confirm-account/:token', function (req, res, next) {
            _async.waterfall([
                //find token
                function (callback) {
                    
                    var __queryOptions = {
                        where: {
                            token: req.params.token
                        }
                    };
                    _tokenModel.findOne(__queryOptions).then(function(token) {

                        // check for not found
                        if (token === null) {
                            res.statusCode = 404;
                            callback(new Error('Token not found.'));
                        } else {
                            callback(null, token);
                        }
                    }).catch(function(error) {

                        callback(error);
                    });
                },
                
                //activate account
                function (token, callback) {
                    if (token !== null) {
                        token.usedAt = _moment().format();
                        token.save().then(function() {
                            _userModel.update({'active': true}, {
                                where: {
                                    id: token['userId']
                                }
                            })
                            .then(function(result) {
                                callback(null, result);
                            })
                            .catch(function(error) {
                                callback(error);
                            });
                        })
                        .catch(function(error) {
                            callback(error);
                        });
                    } else {
                        res.statusCode = 404;
                        callback(new Error('Token not found'));
                    }
                }
            ], function (error, result) {
                if (error) {

                    if (res.statusCode < 400) {
                        res.statusCode = 409;
                    }
                    next(error);
                } else {
                    res.statusCode = 201;
                    res.payload = result;
                    next();
                }
            });
        });
    }

    connectApp.use(_connectRoute(localRoutes));
};