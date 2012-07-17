/*
 * Manager of Model mappings to DB tables
 */

Class.create("ORM", {

  // Class representing Record
  _storages : {},
 
  initialize : function(){
  },
 
  /*
   * @name Model name
   * @returns Storage
   */
  getStorage : function(name){
    var storage = this._storages[name];
    if (!storage){
      storage = this._storages[name] = new Store(name);
    }
    return storage;
  }
})
