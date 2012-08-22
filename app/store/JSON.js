/**
 * Stores data in json file
 */
Class.create("StoreJSON", Store, {

  /**
   * @param path of directory or file
   */
  initialize : function($super, path){
    this._uniqColumns = [];
    this._local = $H($util.requireAll(path)).values();
  }
})
