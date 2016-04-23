'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:models' );
var _ds = require( '../components/datasource' ).get( 'base' );
var _config = require( '../config' );

var _userModel = require( './users' );
var _roleModel = require( './roles' );
var _tokenModel = require( './tokens' );
var _userRoleModel = require( './users_roles' );

_debug( 'INIT' );

// User n:m Role
_userModel.belongsToMany( _roleModel, {
    through: {
        model: _userRoleModel,
        unique: false
    },
    foreignKey: 'user_id'
} );

// Role n:m User
_roleModel.belongsToMany( _userModel, {
    through: {
        model: _userRoleModel,
        unique: false
    },
    foreignKey: 'role_id'
} );

// User 1:m Token
_userModel.hasMany( _tokenModel );
_tokenModel.belongsTo( _userModel );

//
//
if ( _config.get( 'development' ) === true ) {

    // drop tables and rebuild
    _ds.sync( {
        force: true
    } ).then( function() {

        // load test data
        require( './fixtures' );
    } );
}