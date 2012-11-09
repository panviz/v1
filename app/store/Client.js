/**
 * Stores Items in Browser
 */
Class.create("StoreClient", Store, {

  initialize : function($super){
    $super();
    if (!localStorage.s) localStorage.s = "{}";
    this._local = JSON.parse(localStorage.s);
    this._store = window.localStorage.s;
  },
  /**
   * Browser localStorage can save String only
   */
  save : function($super, onSave, man, name, diff){
    $super(onSave, man, name, diff);
    // TODO remove after debug
    this._local.module = [];
    localStorage.s = JSON.stringify(this._local);
  }
})
