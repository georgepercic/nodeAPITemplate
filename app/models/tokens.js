'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:token-model' );
var _sequelize = require( 'sequelize' );
var _crypto = require( 'crypto' );

var _userModel = require( './users' );
var _ds = require( '../components/datasource.js' ).get( 'base' );

_debug( 'INIT' );

// Token model fields definition and validation
//
var TokenModel = _ds.define( 'token', {
    'id': {
        type: _sequelize.UUID,
        primaryKey: true,
        defaultValue: _sequelize.UUIDV4,
        field: 'id'
    },
    'userId': {
        type: _sequelize.UUID,
        field: 'userId',
        allowNull: false,
        references: {
            model: _userModel,
            key: 'id'
        }
    },
    'email': {
        type: _sequelize.STRING( 100 ),
        field: 'email',
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            len: [ 0, 100 ]
        }
    },
    'type': {
        type: _sequelize.CHAR( 4 ),
        field: 'type',
        allowNull: false
    },
    'token': {
        type: _sequelize.CHAR( 40 ),
        field: 'token',
        allowNull: false,
        unique: true,
        defaultValue: function() {
            return _crypto.randomBytes( 20 ).toString( 'hex' );
        }
    },
    'expiresAt': {
        type: _sequelize.DATE,
        field: 'expiresAt',
        allowNull: true,
        defaultValue: null
    },
    'usedAt': {
        type: _sequelize.DATE,
        field: 'usedAt',
        allowNull: true,
        defaultValue: null
    }
}, {
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps: true,

    // don't use camelcase for automatically added attributes but underscore
    // style so updatedAt will be updated_at
    underscored: false

    //
    // indexes: [  ]

} );

module.exports = TokenModel;