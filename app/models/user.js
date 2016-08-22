var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  username: undefined,
  password: undefined,
  initialize: function(userObject) {
    this.set('username', userObject.username);
    this.set('password', userObject.password);
  }
});

module.exports = User;