'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:role-model' );
var _sequelize = require( 'sequelize' );
var _ds = require( '../components/datasource.js' ).get( 'base' );

_debug( 'INIT' );

// User model fields definition and validation
var RoleModel = _ds.define( 'role', {
    'id': {
        primaryKey: true,
        defaultValue: _sequelize.UUIDV4,
        type: _sequelize.UUID,
        field: 'id'
    },
    'name': {
        type: _sequelize.STRING( 45 ),
        field: 'name',
        allowNull: false,
        validate: {
            len: [ 1, 45 ]
        }
    }
}, {
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps: true,

    // don't use camelcase for automatically added attributes but underscore
    // style so updatedAt will be updated_at
    underscored: true,

    indexes: [ {
        fields: [ 'name' ],
        unique: true
    } ]
} );

module.exports = RoleModel;