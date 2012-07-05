exports.boot = function(app){
  bootControllers(app);
};

function bootControllers(app) {
  fs.readdir(ROOT_PATH + '/controllers', function(err, files){
    if (err) throw err;
    files.forEach(function(file){
      bootController(app, file);
    });
  });
}

// Example (simplistic) controller support

function bootController(app, file) {
  var name = file.replace('.js', '')
    , actions = require('./controllers/' + name)
    , plural = name + 's' // realistically we would use an inflection lib
    , prefix = '/' + plural; 

  // Special case for "app"
  if (name == 'app') prefix = '/';

  Object.keys(actions).map(function(action){
    var fn = controllerAction(name, plural, action, actions[action]);
    switch(action) {
      case 'index':
        app.get(prefix, fn);
        break;
      //case 'add':
        //app.put(prefix, fn);
        //break;
      case 'show':
        app.get(prefix + '/:id.:format?', fn);
        break;
      case 'create':
        app.post(prefix + '/:id', fn);
        break;
      case 'edit':
        app.get(prefix + '/:id/edit', fn);
        break;
      case 'update':
        app.put(prefix + '/:id', fn);
        break;
      case 'destroy':
        app.del(prefix + '/:id', fn);
        break;
    }
  });
}

// Proxy res.render() to add some magic

function controllerAction(name, plural, action, fn) {
  return function(req, res, next){
    var render = res.render
      , format = req.params.format
      , path = ROOT_PATH + '/views/' + name + '/' + action + '.html';
    res.render = function(obj, options, fn){
      res.render = render;
      // Template path
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
      }

      // Format support
      if (action == 'show' && format) {
        if (format === 'json') {
          return res.send(obj);
        } else {
          throw new Error('unsupported format "' + format + '"');
        }
      }

      // Render template
      res.render = render;
      options = options || {};
      // Expose obj as the "users" or "user" local
      if (action == 'index') {
        options[plural] = obj;
      } else {
        options[name] = obj;
      }
      return res.render(path, options, fn);
    };
    fn.apply(this, arguments);
  };
}
