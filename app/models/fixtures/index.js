'use strict';

// dependencies
var _debug = require( 'debug' )( 'highr:fixtures' );
var _fixtures = require( 'sequelize-fixtures' );

var models = {
    User: require( '../users' ),
    Role: require( '../roles' )
};

//
var _rolesFixtures = require( './data/roles.json' );
_fixtures.loadFixtures( _rolesFixtures, models ).then( function() {

    _debug( 'Loaded Role fixtures' );

    //
    var _usersFixtures = require( './data/users.json' );

    _fixtures.loadFixtures( _usersFixtures, models ).then( function() {
        _debug( 'Loaded User fixtures' );
    } );
} );