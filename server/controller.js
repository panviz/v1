var root = {}

module.exports = function () {
  return root;
};

root.index = function(req, res, next){
  //TODO define ui.name, currentLanguage, theme based on requester locale, platform 
  $gui.setUI("desktop");
  $gui.setTheme("mybase");
  res.render('index.ejs', {layout: '', user: req.user, settings: $proxy.p});
};


//Deprecated
root.login = function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
};

//Deprecated
root.logout = function(req, res){
  req.logout();
  res.redirect('/');
};

//Deprecated
root.ensureAuthenticated = function(req, res, next){
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
};
