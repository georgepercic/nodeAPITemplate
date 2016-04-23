'use strict';

// dependencies
var _debug = require('debug')('highr:router:profile-routes');
var _connectRoute = require('connect-route');
var _formidable = require('formidable');
var _fs = require('fs');
var _path = require('path');
var _validator = require('validator');
var _ = require('underscore');
var _async = require('async');
var _uuid = require('node-uuid');


var _crudify = require('./templates/rethinkdb-crud');
var _profileModel = require('../models/profiles');
var _uploadModel = require('../models/uploads');

_debug('INIT');

module.exports = function(connectApp) {
    
    function _getYoutubeId(url){
        
        var id = '';
        url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        
        if(url[2] !== undefined) {
            id = url[2].split(/[^0-9a-z_\-]/i);
            id = id[0];
        } else {
            id = url;
        }
        
        return id;
    }
    
    function _buildProfileTree(req, res, next) {
        var reqObj = req.body;
                
        if (!_.isEmpty(reqObj['custom'])) {
            //validate and build custom profile content
            _.each(reqObj['custom'], function (value, key) {
                if (typeof value['type'] === 'undefined' || typeof value['content'] === 'undefined') {
                    next(new Error('Invalid custom profile'));
                } else {
                    var uuidKey = _validator.isUUID(key, 4) ? key : _uuid.v4();
                    var type = value['type'];
                    var content = value['content'];
                    
                    //check if type is video
                    if (type === 'video') {
                        //check for video source field
                        if (typeof value['source'] === 'undefined') {
                            next(new Error('Invalid custom profile. Source needed for video.'));
                        } else {
                            //if source is youtube
                            if (value['source'] === 'youtube') {
                                //get the video id from url and replace original content
                                var videoId = _getYoutubeId(content);
                                
                                //build custom profile for db
                                reqObj['custom'][uuidKey] = {
                                    'label': key,
                                    'type':  type,
                                    'content': videoId,
                                    'source': value['source']
                                };
                            } else {
                                next(new Error('Unknown source'));
                            }
                        }
                    } else {
                        //build custom profile for db
                        reqObj['custom'][uuidKey] = {
                            'label': key,
                            'type':  type,
                            'content': content
                        };
                    }
                    
                    delete reqObj['custom'][key];
                }
            });
        }
        
        return reqObj;
    }

    function localRoutes(router) {

        var profilesCRUD = new _crudify(_profileModel);

        /*
         *  Find All Profiles
         */
        router.get('/api/profiles', function(req, res, next) {
            profilesCRUD.findAll(req, res, next);
        });

        /*
         *  Find Profile By ID
         */
        router.get('/api/profiles/:id', function(req, res, next) {
            profilesCRUD.findByID(req, res, next);
        });

        /*
         *  Delete User Profile By ID
         */
        router.delete('/api/profiles/:id', function(req, res, next) {

            profilesCRUD.delete(req, res, next);
        });

        /*
         *  Create User Profile
         */
        router.post('/api/profiles/:id', function(req, res, next) {
            
            var userId = req.params.id;
            var jwtDecoded = req.decoded;
            
            if (userId !== jwtDecoded.sub) {
                res.statusCode = 403;
                next(new Error('Not authorized'));
            }
            
            try {
                var profile = _buildProfileTree(req, res, next);
                var newProfileModel = new _profileModel(profile);

                newProfileModel.save().then(function(result) {
                    res.payload = result;
                    res.statusCode = 201;

                    next();
                }).catch( function( error ) {

                    // error
                    res.statusCode = 409;
                    next( error );
                });
                
            } catch (error) {
                next(error);
            }
        });

        router.post('/api/profile-uploads', function(req, res, next) {

            var resPayload = {};
            var form = new _formidable.IncomingForm();
            
            //define form parse rules
            form.keepExtensions = true;
            form.uploadDir = './tmp/';
            form.encoding = 'utf-8';
            form.multiples = true;

            form.parse(req);

            form
                .on('error', function(err) {
                    next(err);
                })
                .on('file', function(inputName, file) {
                    if (inputName == 'avatar') {
                        resPayload['avatar'] = file.name;
                    }
                })
                .on('end', function() {

                    var savedFiles = [];
                    var userId = req.decoded['sub'];

                    //check if folder exists: if is not, create
                    try {
                        //check
                        _fs.statSync(_path.resolve('uploads', userId));
                    } catch (e) {
                        //create
                        _fs.mkdirSync(_path.resolve('uploads', userId));
                    }

                    var isNewFile = false;
                    var existingFiles = [];

                    _.each(this.openedFiles, function(file) {
                        //check if file exists
                        try {
                            _fs.statSync(_path.resolve('uploads', userId, file.name));
                        } catch (e) {
                            //if file does not exists, it will be moved
                            isNewFile = true;
                            var savePath = _path.resolve('uploads', userId, file.name);

                            try {
                                _fs.renameSync(file.path, savePath);
                                savedFiles.push(file.name);
                            } catch (error) {
                                _debug(error);
                            }
                        }

                        if (!isNewFile) {
                            //if file exists, delete temp stored file
                            try {
                                _fs.unlinkSync(file.path);
                            } catch (error) {
                                //TODO: log error
                                _debug(error);
                            }
                            
                            existingFiles.push(file.name);
                        }
                    });
                    //prepare payload response
                    resPayload['files'] = savedFiles;
                    
                    if (savedFiles.length) {
                        //store files into rethinkdb
                        _async.waterfall([

                            // see if exists
                            function(callback) {

                                _uploadModel.get(userId).then(function(user) {
                                    callback(null, user);
                                })
                                .catch(function() {
                                    //if error, id is not in the db
                                    callback(null, null);
                                });
                            },

                            //if exists - update, else - create
                            function(user, callback) {
                                if (user === null) {
                                    resPayload['userId'] = userId;
                                    var newUpload = new _uploadModel(resPayload);
                                    //create if not exists
                                    newUpload.save().then(function(upload) {
                                        callback(null, upload);
                                    }).catch(function(error) {
                                        // error
                                        callback(error);
                                    });
                                    
                                } else {
                                    //update
                                    _uploadModel.get(userId).update(resPayload).run().then(function(upload) {
                                        callback(null, upload);
                                    }).catch( function( error ) {
                                        // error
                                        callback(error);
                                    });
                                }
                            }
                        ], function(error, result) {

                            if (error) {

                                next(error);
                            } else {
                                if (existingFiles.length) {
                                    result['existingFiles'] = existingFiles;
                                }
                        
                                res.payload = result;
                                res.statusCode = 201;

                                next();
                            }
                        });   
                    } else {
                        next(new Error('File already exists'));
                    }
                });
        });

        /*
         *  Update User Profile
         */
        router.patch('/api/profiles/:id', function(req, res, next) {
            var userId = req.params.id;
            var jwtDecoded = req.decoded;
            
            if (userId !== jwtDecoded.sub) {
                res.statusCode = 403;
                next(new Error('Not authorized'));
            }
            
            try {
                var profile = _buildProfileTree(req, res, next);

                _profileModel.get(userId).update(profile).then(function(result) {
                    res.payload = result;
                    res.statusCode = 201;

                    next();
                }).catch( function( error ) {

                    // error
                    res.statusCode = 409;
                    next( error );
                });
                
            } catch (error) {
                next(error);
            }
        });
        
        /*
         *  Remove key from profile json
         */
        router.patch('/api/profile-remove-key/:id', function(req, res, next) {
            profilesCRUD.replace(req, res, next);
        });
    }

    connectApp.use(_connectRoute(localRoutes));
};