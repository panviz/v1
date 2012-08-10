/*
 * Stores Manager
 * Model mappings to DB tables
 * TODO change JSON to DB
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
    //TODO make generic unification for reactive provider & record
    if (name == 'UserFul') name = 'User';
    if (name == 'Modular') name = 'Module';
    if (name == 'Provider') name = 'Item';
    var storage = this._storages[name];
    if (!storage){
      storage = this._storages[name] = new StoreJSON(name);
    }
    return storage;
  }
})
