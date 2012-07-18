// Load dependencies
const express       = require('express')
  , errors        = require('../config/server/errors')
  require(ROOT_PATH + '/app/Error');
  require(ROOT_PATH + '/app/Util');
  require(ROOT_PATH + '/app/Parcel');
  require(ROOT_PATH + '/app/Proxy');
  require(ROOT_PATH + '/app/ORM');
  require(ROOT_PATH + '/app/Reactive');
  require(ROOT_PATH + '/app/UserFul');
  require(ROOT_PATH + '/app/Store');
  require(ROOT_PATH + '/app/Gui');

/*
 * Application class
 * Creates express server for static content and some extra
 */
Class.create("Application", {

  initialize : function(){
    $util = new Util();
    this.p = require(ROOT_PATH + '/config/settings.json');
    this.p.available_languages = $H($util.requireAll(ROOT_PATH + '/config/i18n')).keys();

    var s = this.server = express.createServer()
    $orm = this.orm = new ORM();

    $user = this.userFul = new UserFul();

    // Load Expressjs config
    this.configure();
  },

  // Configure expressjs server
  configure : function(){
    var s = this.server;
    s.set('views', ROOT_PATH + '/client/html')
    s.helpers(require(ROOT_PATH + '/server/Helper'))
    s.set('view engine', 'ejs')
    s.use(express.logger('\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'))
    s.use(express.cookieParser())
    s.use(express.bodyParser())
    s.use(express.methodOverride())
    s.use(express.errorHandler({dumpException: true, showStack: true}))
    s.use(express.session({ secret: 'keyboard cat' }))
    //// Initialize Passport!
    //s.use(passport.initialize())
    //// Also use passport.session() middleware, to support persistent login sessions (recommended).
    //s.use(passport.session())
    s.use('/app', express.static(ROOT_PATH + '/app'))
    s.use('/client', express.static(ROOT_PATH + '/client'))
    s.use('/module', express.static(ROOT_PATH + '/module'))
  },

  //TODO
  setMiddleware : function(method, path, middleware){
  },

  setRoute : function(routes){
    //TODO when it would be more actions move to Controller class
    var root = {};
    root.index = function(req, res, next){
      //TODO define ui.name, currentLanguage, theme based on requester locale, platform 
      var ui = "desktop";
      var theme = "mybase";
      $app.setGui(ui, theme);
      res.render('index.ejs', {layout: '', settings: $app.p});
    };

    var s = this.server;
    routes.forEach(function(r){
      var path = r[0]
      var method = r[1]
      var action = r[2]
      s[method](path, eval(action));
    })
    
    // Load error routes + pages
    errors(s);
  },

  setGui : function(ui, theme){
    var uiName = uiName || "desktop";
    var config = require(ROOT_PATH + '/config/' + uiName)
    Object.extend(this.p.ui, config);
    var themeName = themeName || 'mybase';
    var ui = this.p.ui;
    ui.theme = ui.themes[themeName];

    this.p.i18n = require(ROOT_PATH + '/config/i18n/' + this.p.locale + '.json');
    var templatePath = ROOT_PATH + this.p.ui.theme.path + '/template';
    var templateStore = new Store("Template", templatePath);
    $gui = this.gui = new Gui(this.p, templateStore);
  },

  setEnv : function(env){
    this.env = env;
    //TODO remove unnecessary variables from express?
    var s = this.server;
    if (env.name == "local")
    s.set('ENV','local')
    s.set('host', env.host)
    s.set('port', env.port)
  },

  run : function(){
    var s = this.server;
    // Create Reactive Messaging Server
    $proxy = this.proxy = new Proxy(this.p, s);
    s.listen(this.env.port);
    console.log('\x1b[36mGraph\x1b[90m v%s\x1b[0m running as \x1b[1m%s\x1b[0m on http://%s:%d'
      , this.p.version
      , this.env.name
      , this.env.host
      , s.address().port
    )
  }
});
