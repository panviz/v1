/*
 * TODO inherit Reactive but not Provider as it is manager of Records
 */
Class.create("ReactiveRecord", Reactive, {

  // Load record on creation
  initialize : function($super, name, store){
    $super(store);
    this.name = name;
    this.loaded = false;
    this.get(this._update.bind(this), name)
  },

  // augment in Record class
  _update : function(data){
    this.loaded = true;
  }
})
