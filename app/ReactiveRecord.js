Class.create("ReactiveRecord", Reactive, {
  /**
   * Load record on creation
   * @param String [id]
   * @param Store [store]
   */
  initialize : function($super, id, store){
    $super(store);
    this.toStore = $w('name type')
    this.loaded = false;
    // Let initialization chain finish before update
    if (id){
      this.id = id
      setTimeout(this.get.bind(this, null, id), 10)
    }
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
      if (p[attr] != undefined){
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
    this.put(null, this.id, content)
  }
})
