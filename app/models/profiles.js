'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:profile-model' );
var _ds = require( '../components/datasource.js' ).get( 'rethinkdb' );

var _thinky = require('thinky')(_ds);
//var _r = _thinky.r;
var _type = _thinky.type;

_debug( 'INIT' );

// User profile model fields definition and validation
var ProfileModel = _thinky.createModel('profiles', {
    userId: _type.string(),
    firstName: _type.string(),
    lastName: _type.string(),
    sex: _type.string(),
    maritalStatus: _type.string(),
    dob: _type.date(),
    country: _type.string(),
    city: _type.string(),
    phone: _type.string(),
    activity: _type.array(),
    skills: _type.array(),
    interests: _type.array(),
    avatar: _type.string(),
    facebookId: _type.string(),
    twitterId: _type.string(),
    linkedinId: _type.string(),
    website: _type.string(),
    custom: _type.object(),
    createdAt: _type.date().default(new Date)
}, {
    pk: 'userId' 
});

module.exports = ProfileModel;