/**
 * Stores data in Browser Indexed DB
 */
Class.create("StoreClient", Store, {

  initialize : function($super){
    $super();
    if (!localStorage.s) localStorage.s = "{}";
    this._local = JSON.parse(localStorage.s);
    this._store = window.localStorage.s;
  },

  save : function($super, onSave, type, name, diff){
    $super(onSave, type, name, diff);
    if (this._local.module[1]) this._local.module = this._local.module.without(this._local.module[1])
    localStorage.s = JSON.stringify(this._local);
  }
})
