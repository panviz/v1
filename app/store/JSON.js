/**
 * Stores data in json file
 */
Class.create("StoreJSON", Store, {

  /**
   * @param path of directory or file
   */
  initialize : function($super, name, path){
    $super();
    this._local[name] = $H($util.requireAll(path)).values();
  }
})
