'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:user-model' );
var _sequelize = require( 'sequelize' );
var _bcrypt = require( 'bcrypt' );
var _ds = require( '../components/datasource.js' ).get( 'base' );
var _config = require( '../config.js' );

_debug( 'INIT' );

// User model fields definition and validation
var UserModel = _ds.define( 'user', {
    'id': {
        primaryKey: true,
        defaultValue: _sequelize.UUIDV4,
        type: _sequelize.UUID,
        field: 'id'
    },
    'active': {
        type: _sequelize.BOOLEAN,
        field: 'active',
        allowNull: false,
        defaultValue: false
    },
    'email': {
        type: _sequelize.STRING( 100 ),
        field: 'email',
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    'robotName': {
        type: _sequelize.STRING( 45 ),
        field: 'robot_name',
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    'screenName': {
        type: _sequelize.STRING( 45 ),
        field: 'screen_name',
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    'password': {
        type: _sequelize.STRING( 100 ),
        field: 'password',
        allowNull: false,
        set: function( value ) {

            var hash = _bcrypt.hashSync( String( value ),
                _bcrypt.genSaltSync( _config.get( 'bcryptWorkFactor' ) )
            );

            this.setDataValue( 'password', hash );
        }
    }
}, {
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps: true,

    // don't use camelcase for automatically added attributes but underscore
    // style so updatedAt will be updated_at
    underscored: false,

    // enven tho you can set indexes on a field level, it's easier to "parse"
    // if they are all listed and defined in one place.
    indexes: [ {
        fields: [ 'email' ],
        unique: true
    }, {
        fields: [ 'createdAt' ]
    }, {
        fields: [ 'email', 'active' ]
    } ],

    classMethods: {

        /**
         * Wrap a create statement inside a transaction. Use this method when
         * creating with associations.
         *
         * @param  {[object]} data     Data to be saved.
         * @param  {[object]} options  [description]
         * @return {[promise]}         [description]
         */
        createWithTransaction: function( data, options ) {

            var __model = this;

            return _ds.transaction( function( t ) {
                options.transaction = t;
                return __model.create( data, options );
            } );
        }
    },

    //
    instanceMethods: {

        /**
         * Overwrute .toJSON to remove password field when converting object to JSON (when sending to client)
         *
         * @return {[object]} [description]
         */
        toJSON: function() {
            var values = this.get();

            delete values.password;

            return values;
        },
        fullName: function() {
            var values = this.get();
            
            return values.firstName + ' ' + values.lastName;
        }
    }

} );

module.exports = UserModel;