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
      return this.relations ? this.out().length : 0;
    })

    $super(name);
    // Array of {id: Number, type: String, direction: String, to: Number(Item ID)}
    this.relations = []      // Not loaded item has no links
    this.type = this.__className.toLowerCase()    // Local storage needs type = 'item'
    this.toStore = this.toStore.concat($w('relations label icon x y fixed expanded '))
  },

  update : function($super, p){
    if (!p) return
    debugger
    $super(p);
    // Reload local record from server
    if (!this.id) return this.get(null, this.name, {force: true});
    this.label = this.label || this.name;
    
    // Update delegate class if type specified
    var type = this.type
    var hash = $H(p)
    if (type && !hash.isEmpty()){
      if (!this[type]){
        var className = Class.getByName(type.capitalize())
        this[type] = new className(this)
        this[type].update(p)
      } else{
        this[type].update(p)
      }
    }
    if (this.id && !hash.isEmpty()) document.fire("item:updated", this);
  },

  save : function($super){
    //TODO get data from this[type] to save
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    $super()
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
    var links = this.relations
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
    links = links || this.relations
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
