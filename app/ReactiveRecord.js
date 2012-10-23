Class.create("ReactiveRecord", Reactive, {
  /**
   * Load record on creation
   * @param {Number|String} [idOrName]
   * @param Store [store]
   */
  initialize : function($super, idOrName, store){
    $super(store);
    this.toStore = $w('name type')
    if (Object.isNumber(idOrName)) this.id = idOrName;
    if (Object.isString(idOrName)) this.name = idOrName;
    this.loaded = false;
    // Let initialization chain finish before update
    if (idOrName) setTimeout(this.get.bind(this, null, idOrName), 10)
  },
  /**
   * On remote record change, Proxy will call this method
   * Augment it in concrete Record class
   * @param Json [p]
   */
  update : function(p){
    var self = this
    $w('id createdAt').concat(this.toStore).each(function(attr){
      //TODO what if remote has deleted attr?
      if (p[attr]){
        self[attr] = p[attr]
        delete p[attr]
      }
    })
    this.loaded = true;
  },

  save : function(){
    var self = this
    var content = {}
    this.toStore.each(function(p){
      if (self[p] != undefined) content[p] = self[p]
    })
    var idOrName = this.id > 0 ? this.id : this.name
    this.put(null, idOrName, content)
  }
})
