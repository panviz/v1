/**
 * Stores data in Browser Indexed DB
 */
Class.create("StoreClient", Store, {

  initialize : function(){
    this._uniqColumns = [];
    this._local = window.localStorage.s = [];
  }
})
