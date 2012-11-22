/**
 * Abstract container for data
 * Everything should be an Item!
 */
Class.create("Item", ReactiveRecord, {
  /**
   * @param String name
   * @param Json [p] optional params
   */
  initialize : function($super, name, p){
    //TODO Calculate size base on all/in/out links?
    this.__defineGetter__("label", function(){
      return this._label ? this._label : this.name
    })
    this.__defineSetter__("label", function(label){
      this._label = label
    })
    this.__defineGetter__("size", function(){
      return this._size || (this.relations.isEmpty() ? this.out().length : 1)
    })
    this.__defineSetter__("size", function(size){
      this._size = size
    })
    this.__defineGetter__("icon", function(){
      return '/client/image/item/' + this.type + '.ico'
    })
    this.__defineGetter__("changed", function(){
      return this._changed
    })
    this.__defineSetter__("changed", function(value){
      this._changed = value
      if (value) document.fire("app:changed")
    })

    this.man = 'item'
    this.id = $util.generateId()
    $super(name);
    if (p){this.x = p.x; this.y = p.y}
    //TODO should be private?
    // Array of {id: Number, type: String, direction: String, to: Number(Item ID)}
    this.relations = []      // Not loaded item has no links
    this.type = this.__className.toLowerCase()    // Local storage needs type = 'item'
    this.toStore = this.toStore.concat($w('relations label icon x y fixed expand content'))
  },
  /**
   * @param Json [data] new data to update item
   * @param Json [diff] Diff to update item
   */
  update : function($super, data, diff){
    var update = data || diff
    if (!update) return
    $super(data, diff);
    
    // Update delegate class if type specified
    var type = this.type
    var hash = $H(update)
    var className = Class.getByName(type.capitalize())
    if (type && type != 'item' && className && !hash.isEmpty()){
      if (!this[type]){
        this[type] = new className(this)
        this[type].update(data, diff)
      } else{
        this[type].update(data, diff)
      }
    }
    document.fire("item:updated", this)
  },

  save : function($super){
    //TODO get data from this[type] to save
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.changed = false
    this.expand = this.expanded
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
    type = type || 'REL'
    var id = $util.generateId()
    var link = {id: id, type: type, direction: 'out', target: item.id}
    this.relations.push(link)
    this.changed = true
    item.relations.push({id: id, type: type, direction: 'in', target: this.id})
    item.changed = true
    document.fire("item:linked", {item: this, link: link})
    return link
  },
  /*
   */
  unlink : function(item, type){
    if (!item && !type) return this.relations = []
    //this.relations = this.relations.without(function(rel){return rel.id == })
    //item.relations = item.relations.without()
    this.changed = true
    item.changed = true
    //document.fire("item:unlinked", this, link)
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
      return $app.getItem(link.target)
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
  },

  // Remove incoming links
  _onSave : function($super, idOrName, options, diff){
    if (diff && diff.relations){
      var diffRel = diff.relations
      var byDirection = function(rel){
        return rel.direction == 'out'
      }
      diffRel[0] = diffRel[0].filter(byDirection)
      diffRel[1] = diffRel[1].filter(byDirection)
      if (diffRel[0].isEmpty() && diffRel[1].isEmpty()) delete diff.relations
    }
    if (!$H(diff).isEmpty() || options.name) $super(idOrName, options, diff)
  }
})
