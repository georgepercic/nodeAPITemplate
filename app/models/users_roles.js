'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:user-role-model' );
var _sequelize = require( 'sequelize' );
var _ds = require( '../components/datasource.js' ).get( 'base' );

_debug( 'INIT' );

var UserRoleModel = _ds.define( 'user_role', {
    'id': {
        primaryKey: true,
        defaultValue: _sequelize.UUIDV4,
        type: _sequelize.UUID,
        field: 'id'
    },

    // Set FK relationship (hasMany) with `Roles`
    'role_id': {
        defaultValue: _sequelize.UUIDV4,
        type: _sequelize.UUID,
        field: 'role_id'
    },

    // Set FK relationship (hasMany) with `Users`
    'user_id': {
        defaultValue: _sequelize.UUIDV4,
        type: _sequelize.UUID,
        field: 'user_id'
    }
}, {
    // timestamp attributes (updatedAt, createdAt)
    timestamps: false,

    // define the table's name
    tableName: 'users_roles'
} );

module.exports = UserRoleModel;