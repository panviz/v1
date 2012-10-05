/**
 * On initialize Record binds its _update method on message from Remote
 * In such way this Record will be always updated on any remote change
 */
Class.create("ReactiveRecord", Reactive, {

  // Load record on creation
  initialize : function($super, name, store){
    $super(store);
    if (Object.isString(name)) this.name = name;
    if (Object.isNumber(name)) this.id = name;
    this.loaded = false;
    if (name) this.get(this._update.bind(this), name)
  },

  // augment in Record class
  _update : function(p){
    this.id = p.id;
    this.name = p.name;
    this.createdAt = p.createdAt;
    this.loaded = true;
  }
})
