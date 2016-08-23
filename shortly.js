var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var loggedIn = false;


app.get('/', 
function(req, res) {
  loggedIn ? res.render('index') : res.redirect('/login');
});

app.get('/login', 
function(req, res) {
  // console.log('get /login******');
  // console.log('THE REQ ******************', req);

  res.render('login');
});

app.get('/logout', 
function(req, res) {
  // console.log('get /logout******');
  // console.log('THE REQ ******************', req);
  loggedIn = false;
  res.render('login');
});

app.get('/create', 
function(req, res) {
  // console.log('get /create******');
  console.log('LOGGED IN? *******', loggedIn);
  loggedIn ? res.render('index') : res.redirect('/login');
});

app.get('/links', 
function(req, res) {
  // console.log('get /links******');
  if (loggedIn) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/links', 
function(req, res) {
  // console.log('post /create******');
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    return res.sendStatus(404);
  }

  if (loggedIn) {

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
          .then(function(newLink) {
            res.status(200).send(newLink);
          });
        });
      }
    });
    
  } else {
    res.status(200).redirect('/login');
  }




});

app.post('/signup', 
function(req, res) {
  // console.log('post /signup******');

  var userObj = {
    username: req.body.username,
    password: req.body.password
  };

  new User(userObj).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      Users.create(userObj)
      .then(function(newUser) {
        loggedIn = true;
        res.status(200).redirect('/');
      });
    }
  });
  
});

app.post('/login', 
function(req, res) {
  // console.log('post /login******');

  var userObj = {
    username: req.body.username,
    password: req.body.password
  };

  new User(userObj).fetch().then(function(found) {
    if (found) {
      // console.log('POST LOGIN FOUND*****************', found);
      loggedIn = true;
      res.redirect(200, '/');
    } else {
      // console.log('POST LOGIN NOT FOUND*****************');
      Users.create(userObj)
      .then(function(newUser) {
        console.log('REDIRECTING TO LOGIN');
        loggedIn = false;
        res.status(200).redirect('/login');
      });
    }
  });
  
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/login');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

app.listen(4568);
