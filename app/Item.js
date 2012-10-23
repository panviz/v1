/**
 * Abstract container for data
 * Everything should be an Item!
 */
Class.create("Item", ReactiveRecord, {

  /**
   * @param String name
   * @param Json [p] optional params
   */
  initialize : function($super, name){
    //TODO Calculate size base on all/in/out links?
    this.__defineGetter__("label", function(){
      return this._label ? this._label : this.name
    })
    this.__defineSetter__("label", function(label){
      this._label = label
    })
    this.__defineGetter__("size", function(){
      return this.relations ? this.out().length : 0
    })

    $super(name);
    //TODO should be private?
    // Array of {id: Number, type: String, direction: String, to: Number(Item ID)}
    this.relations = []      // Not loaded item has no links
    this.type = this.__className.toLowerCase()    // Local storage needs type = 'item'
    this.toStore = this.toStore.concat($w('relations label icon x y fixed expand '))
  },

  /**
   * @param Json [p] diff to update item
   */
  update : function($super, p){
    if (!p) return
    $super(p);
    
    // Update delegate class if type specified
    var type = this.type
    var hash = $H(p)
    if (type && type != 'item' && !hash.isEmpty()){
      if (!this[type]){
        var className = Class.getByName(type.capitalize())
        this[type] = new className(this)
        this[type].update(p)
      } else{
        this[type].update(p)
      }
    }
    if (this.id) document.fire("item:updated", this)
  },

  save : function($super){
    //TODO get data from this[type] to save
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.changed = false
    if (this.expanded) this.expand = true
    $super()
  },
  /**
   * if this Item is linked with given item
   * @param Item item
   * @returns Boolean
   */
  hasLink : function(item){
    //TODO
  },
  /**
   * Filter links
   * @param String [type] limit links to certain type if specified
   * @param String [direction] 'in'/'out'
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
   * Create link
   * @param Item item target of the outgoing link
   * @param String [type] link type
   * @returns Link created link
   */
  link : function(item, type){
    // TODO create '-ID'
    var link = {type: type, direction: 'out', to: item.id}
    this.relations.push(link)
    item.relations.push({type: type, direction: 'in', to: this.id})
    this.changed = true
    item.changed = true
    return link
  },
  /**
   * @param String [type] link type
   * @returns Link[] incoming links by type
   */
  inc : function(type){
    return this.links(type, 'in');
  },
  /**
   * @param String [type] link type
   * @returns Link[] of outgoing links by type
   */
  out : function(type){
    return this.links(type, 'out');
  },
  /**
   * Get linked items or Async load
   * @param String [type] item type
   * @param Link[] [links]
   * @returns Item[]
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
   * @returns Item[] all "child" items
   */
  children : function(itemType, linkType){
    var links = this.out(linkType)
    return this.linked(itemType, links)
  }
});
