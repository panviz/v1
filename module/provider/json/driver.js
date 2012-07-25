Class.create("Provider.Json", Store, {

  /*
   */
  initialize : function(name, source){
    this._model = name;
    if (source){
      this._local = $H($util.requireAll(source)).values();
    } else {
      this._local = $A(require(ROOT_PATH + '/data/' + name + '.json'));
    }
  }
})

