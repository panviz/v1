/*
 * Stores data in json file
 */
Class.create("StoreJSON", Store, {

  /*
   * @param name Model class name
   * @param source directory Path for File storage
   */
  initialize : function($super, name, source){
    $super(name);
    if (source){
      this._local = $H($util.requireAll(source)).values();
    } else {
      this._local = $A(require(ROOT_PATH + '/data/' + name + '.json'));
    }
  }
})
