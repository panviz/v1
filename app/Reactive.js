/*
 * Reactive Provider
 * Storage mapper
 * Implements instant record update with only two methods:
 * Get - retrieves data from Remote by uniq identifier "name"
 * Put - send new, null, or updated record to Remote
 * Is responsible for access restrictions
 */
Class.create("Reactive", {

  initialize : function(store){
    this.store = store || $orm.getStorage(this.__className);
  },

  /*
   * Find record in local storage first
   * If item exists - return it (it is definitely up to date)
   * Else load it
   * if no options specified - returns record's public representation
   * @param name unique identifier of record
   * TODO options should specify addressee or access rights?
   * @param options may have token - role identifier
   */
  get : function(callback, name, options){
    var self = this;

    /* @server never enters onLoad
     * @param data 
     */
    var onLoad = function(data){
      // Update local storage if Remote Storage has found the record
      if (data.name){
        self.store.save(onFind, data.name, data);
      } else {
        $modal.error(data);
      }
    }

    var onFind = function(data){
      // On missing record
      // Client storage returns null, so request goes to Remote
      // Remote storage throws NotFound Error
      if (data){
        // TODO Reduce data by user access level
        //if (options.addressee ){
          //var onUser = function(data){
            //evaluate user rights
          //}
          //$user.store.findById(onUser, addressee)
          //var data = data;
        //} else {
          //var data = self._public.map(function(key){
            //return user[key];
          //})
        //}
        callback(data);
      } else {
        $proxy.get(onLoad, self.__className.toLowerCase(), name, options)
      }
    }
    this.store.find(onFind, name, "name")
  },

  /*
   * Saves changes locally first then sync with remote
   * @returns Json difference in record between previous and current
   */
  put : function(callback, name, content, options){
    var self = this;

    if (isServer){
      var onSave = callback;
    } else {
      var onSave = function(diff){
        // Do not send if data not changed
        if (diff){
          $proxy.put(callback, self.__className.toLowerCase(), name, diff)
        }else{
          callback()
        }
      }
    }

    //TODO check access rights
    return this.store.save(onSave, name, content);
  }
})
