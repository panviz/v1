// Load dependencies
const express       = require('express')
  , errors        = require('../config/server/errors')
  require(ROOT_PATH + '/app/Util');

/**
 * Application class
 * Creates express server for static content and some extra
 */
Class.create("Application", {

  initialize : function(){
    $util = new Util();
    this.man = {};
    var list = $util.loadList('/config/server/list.txt');
    list.forEach(function(name){
      require(ROOT_PATH + name);
    })
    this.p = require(ROOT_PATH + '/config/settings.json');
    this.p.available_languages = $H($util.requireAll(ROOT_PATH + '/config/i18n')).keys();

    var s = this.server = express.createServer()
    this.configure();
    
    var db = this.db =  new StoreGraph(this.p.db);
    // As there is no current user
    $user = this.user = this.man['user'] = new UserFul(db);
    // Read only configured modules to Store
    var moduleStore = new StoreModule(this.p.module);
    this.modular = this.man['module'] = new Modular(moduleStore);
    this.provider = this.man['item'] = new Provider(db);
  },

  // Configure expressjs server
  configure : function(){
    var s = this.server;
    s.set('views', ROOT_PATH + '/client/html');
    s.helpers($util);
    s.set('view engine', 'ejs');
    s.use(express.logger('\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'));
    s.use(express.cookieParser());
    s.use(express.bodyParser());
    s.use(express.methodOverride());
    s.use(express.errorHandler({dumpException: true, showStack: true}));
    s.use(express.session({ secret: 'keyboard cat' }));
    //TODO debug only
    s.use('/app', express.static(ROOT_PATH + '/app'));
    s.use('/client', express.static(ROOT_PATH + '/client'));
    //TODO restrict to images, css
    s.use('/module', express.static(ROOT_PATH + '/module'));
    // TODO restrict to user's folder only
    s.use('/data', express.static(ROOT_PATH + '/data'));
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
      var path = r[0];
      var method = r[1];
      var action = r[2];
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
    var templateStore = new StoreJSON(templatePath);
    this.templateFul = this.man['gui'] = new TemplateFul(templateStore);
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
    // Create Reactive Messanger
    $proxy = this.proxy = new Proxy(this.p.socketPath);
    s.listen(this.env.port);
    console.log('\x1b[36mGraph\x1b[90m v%s\x1b[0m running as \x1b[1m%s\x1b[0m on http://%s:%d'
      , this.p.version
      , this.env.name
      , this.env.host
      , s.address().port
    )
  },

  /**
   * get from app or Modular
   * TODO make more generic
   */
  getManager : function(name){
    return this.man[name] || this.modular.getSync('provider' + name);
  }
});
