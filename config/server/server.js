//TODO Update Settings
const express = require('express')
    , expose = require('express-expose')
		, passport = require('passport')
		, LocalStrategy = require('passport-local').Strategy;
var appSettings = require(ROOT_PATH + '/config/settings.json');

  //Global
    require(ROOT_PATH + '/app/Registry')
    require(ROOT_PATH + '/app/UserFul');

module.exports = function(app){

  var userFul = new UserFul();
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    userFul.findById(id, function (err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        
        // Find the user by username.  If there is no user with the given
        // username, or the password is not correct, set the user to `false` to
        // indicate failure and set a flash message.  Otherwise, return the
        // authenticated `user`.
        userFul.findByName(username, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false, { message: 'Unkown user ' + username }); }
          if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
          return done(null, user);
        })
      });
    }
  ));

  //TODO don't expose expressjs setting to client
  Object.extend(app.settings, appSettings);
  //make Global
  settings = app.settings;

  //  Configure expressjs
  var registry = new Registry(settings.socketPath, app);
  app.configure(function (){
  this
    .set('views', ROOT_PATH + '/app/theme/mybase/html')
    .helpers(require(ROOT_PATH + '/app/Template'))
    .set('view engine', 'ejs')
    .use(express.logger('\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'))
    .use(express.cookieParser())
    .use(express.bodyParser())
    .use(express.methodOverride())
    .use(express.errorHandler({dumpException: true, showStack: true}))
    .use(express.session({ secret: 'keyboard cat' }))
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    .use(passport.initialize())
    .use(passport.session())
    .use('/module', express.static(ROOT_PATH + '/module'))
    .use('/app', express.static(ROOT_PATH + '/app'))
    .use('/client', express.static(ROOT_PATH + '/client'))
  });
  
  settings.available_languages = require(ROOT_PATH + '/config/i18n/list.json');
  settings.i18n= require(ROOT_PATH + '/config/i18n/' + app.settings.locale + '.json');

  return app;
}
