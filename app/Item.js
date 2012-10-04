/**
 * Abstract container for data
 */
Class.create("Item", ReactiveRecord, {

  //links Array of {type: String, direction: String, end: Number(Node ID)}
  //linked Array of linked Items
  /**
   * @param name String
   * @param p JSON optional params
   */
  initialize : function($super, name){
    //TODO Calculate size base on all/in/out links?
    this.__defineGetter__("size", function(){
      return this.out ? this.out.length : 0;
    })

    $super(name);
    this.type = this.__className.toLowerCase();
  },

  _update : function($super, p){
    $super(p);
    var p = p || {};
    this.x = p.x; this.y = p.y;
    this.fixed = p.fixed;
    this.label = p.label || p.name;
    this.icon = p.icon;
    this._links = p.links;
    if (this.id) document.fire("item:updated");
  },

  /**
   * if this Item is linked with given item
   * @param item Item
   * @returns Boolean
   */
  hasLink : function(item){
    //TODO
  },

  /**
   * @param type String limit links to certain type if specified
   * @returns Array all directly linked items
   */
  //TODO consider type
  links : function(){
    if (this.xLinks) return this.xLinks
    var links = this.xLinks = [];
    if (this._links){
      this._links.each(function(link){
        var xLink = Object.clone(link);
        xLink.to = new Item(link.to);
        links.push(xLink);
      })
    }
  },

  /**
   * @returns Array all "parent" items
   */
  inc : function(type){
    return this.links(type, 'in');
  },

  /**
   * @returns Array all "child" items
   */
  out : function(type){
    return this.links(type, 'out');
  }

});
