/**
 * Abstract container for data
 * Everything should be an Item!
 */
Class.create("Item", ReactiveRecord, {

  //linked Array of linked Items
  /**
   * @param name String
   * @param p JSON optional params
   */
  initialize : function($super, name){
    //TODO Calculate size base on all/in/out links?
    this.__defineGetter__("size", function(){
      return this._links ? this.out().length : 0;
    })
    this._links = []      // Not loaded item has no links

    $super(name);
    this.type = this.__className.toLowerCase();
  },

  update : function($super, p){
    $super(p);
    // Reload local record from server
    if (!p.id) return this.get(null, p.name, {force: true});
    var p = p || {};
    this.x = p.x; this.y = p.y;
    this.fixed = p.fixed;
    this.label = p.label || p.name;
    this.icon = p.icon;
    // Array of {id: Number, type: String, direction: String, to: Number(Item ID)}
    this._links = p.links;         // All links of item
    if (p.type){
      var className = Class.getByName(p.type.capitalize())
      this[p.type] = new className(p, this)
    }
    if (this.id) document.fire("item:updated", this);
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
   * Filter links
   * @param type String limit links to certain type if specified
   * @param direction String 'in'/'out'
   * @returns Array of links
   */
  links : function(type, direction){
    var self = this
    var links = this._links
    if (type){
      links = links.filter(function(link){
        return link.type == type
      })
    }
    if (direction){
      links = links.filter(function(link){
        return link.direction == direction
      })
    }
    return links
  },
  /**
   * @type String
   * @returns Array of incoming links by type
   */
  inc : function(type){
    return this.links(type, 'in');
  },
  /**
   * @type String
   * @returns Array of outgoing links by type
   */
  out : function(type){
    return this.links(type, 'out');
  },
  /**
   * Get linked items or Async load
   */
  linked : function(type, links){
    var self = this
    links = links || this._links
    var linked = links.map(function(link){
      return $app.getItem(link.to)
    })
    if (type){
      linked.filter(function(item){
        return item.type == type
      })
    }
    return linked
  },

  /**
   * @param itemType
   * @param linkType
   * @returns Array "parent" items
   */
  parents : function(itemType, linkType){
    var links = this.inc(linkType)
    return this.linked(itemType, links)
  },

  /**
   * @param itemType
   * @param linkType
   * @returns Array all "child" items
   */
  children : function(itemType, linkType){
    var links = this.out(linkType)
    return this.linked(itemType, links)
  }
});
