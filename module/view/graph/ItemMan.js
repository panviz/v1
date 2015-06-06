Class.create("ViewGraphItemMan", {
  items: [],

  initialize : function(view){
    this.view = view
    this.links = view.linkman
    // Array of selected items in graph view
    this.selection = []
    $item = this
  },
  /**
   * Change selection to new items
   * Selection may have multiple items on:
   *  Search results
   *  other view multiple selection
   * @param {Item|Item[]} items one or many items
   * @return Boolean if selection changed
   */
  select : function(items){
    var self = this
    var s = this.selection;
    if (!Object.isArray(items)) items = [items];
    var add = items.substract(s).filter(function(item){
      return !item.action
    })
    var remove = s.substract(items)
    // Remove highlight for previously selected items
    remove.each(function(item){
      item.selected = false
      d3.select('#'+item.id+' circle').style("stroke", "#aaf")
      self.deHighlight(item)
    })
    // show items from selection if they are not shown
    var extra = add.substract(this.items)
    extra.each(function(item){
      self.show(item)
    })
    add.each(function(item){
      item.selected = true
      self.fix(item)
      self.highlight(item)
      d3.select('#'+item.id+' circle').style("stroke", "#f00").style("stroke-width", 2)
    })
    if (!add.isEmpty() || !remove.isEmpty()){
     this.selection = items
     this.view.update()
     return true
    }
  },

  highlight : function(item){
    d3.select('#'+item.id+' circle').style('stroke-width', 2)
    d3.select('#'+item.id+' text').style('font-weight', 'bold')
  },

  deHighlight : function(item){
    d3.select('#'+item.id+' circle').style('stroke-width', 1)
    d3.select('#'+item.id+' text').style('font-weight', 'normal')
  },

  // Add new node
  create : function(point){
    var item = $app.createItem(null, point)
    this.select(item);
  },
  /**
   * Toggle linked items visibility of selected one
   * collapsed item is not fixed and floats
   * @param Item item
   */
  // TODO consider direction & type of links
  // TODO nodes should have links to its lines (to delete lines by index, not full search)
  toggle : function(item){
    var self = this;
    var children = item.children();
    if (children){
      item.change()
      item.expanded ? this.collapse(item) : this.expand(item)
    }
  },
  /**
   * Show children
   * they will be recursively shown if they are expanded
   * @param Item parent
   * @param Boolean hidden show hidden children
   */
  expand : function(parents, hidden){
    var self = this
    if (!parents) parents = this.selection
    if (!Object.isArray(parents)) parents = [parents]
    parents.each(function(parent){
      var children = parent.children()
      children.each(function(child){
        if (child.hidden && hidden){
          child.change('hidden', false)
        }
        self.show(child)
      })
      parent.expanded = true
    })
  },

  collapse : function(item){
    item.expanded = false
    //this.unfix(item)
    this.hideChildren(item)
    this.view.update()
  },

  // TODO merge with collapse
  // Hide all children of item which have no parents which will not be hidden
  hideChildren : function(selected){
    var self = this
    // collect items to hide
    var collection = []
    var collect = function(item){
      item.children().each(function(child){
        // Do not hide pinned items
        if (!child.pinned && self.isShown(child) && !collection.include(child)){
          collection.push(child)
          collect(child)
        }
      })
    }
    collect(selected)

    // remove items from collection if they have parents (not to hide)
    collection.each(function(item, index){
      var otherParents = item.parents().filter(function(parent){
        return parent != selected && !collection.include(parent)
      })
      if (!otherParents.isEmpty()) delete collection[index]
    })
    collection.compact().each(function(item){
      self.hide(item)
    })
    this.items = this.items.compact()
  },
  show : function(item){
    if (item.hidden){
      if (this.isShown(item)) this.hide(item)
      return
    }
    var self = this
    //TODO make better fix for d3.force.tick()
    item.px = item.x
    item.py = item.y

    if (!this.items.include(item)) this.items.push(item);

    // expand item if it should be but not yet
    if (!item.relations.isEmpty() && item.expand && !item.expanded) this.expand(item)

    // Show links to already rendered items
    var links = item.links().filter(function(link){
      var target = $app.items.get(link.target)
      if (target) return self.isShown(target)
    })
    // hide all item's links because some could be deleted
    this.links.hide(item)
    if (!links.isEmpty()) this.links.show(item, links)
    this.view.update()
  },

  fix : function(item){
    if (item.fixed) return
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/pinGrey.ico")
    item.fixed = true
    delete item.tempFix
  },

  unFix : function(item){
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/no.ico")
    item.fixed = false
  },

  pin : function(item){
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/pin.ico")
    item.pinned = true
    $user.addContext(item)
  },
  
  unPin : function(item){
    item.pinned = false
    $user.removeContext(item)
    this.unFix(item)
  },

  isShown : function(item){
    return item.index >= 0
  },
  /**
   * Hiding means deleting item and all its links from Man index
   * @param Boolean deep hide with children
   * @param Boolean permanent do not show next time
   */
  hide : function(items, deep, permanent){
    var self = this
    if (!items) items = this.selection
    if (!Object.isArray(items)) items = [items]
    items.each(function(item){
      if (!self.isShown(item)) return
      if (deep) self.collapse(item)
      if (permanent) item.change('hidden', false)
      self.unPin(item)
      self.items = self.items.without(item)
      delete item.index;
      if (!deep) self.links.hide(item.links())
      self.view.update()
    })
    return items
  },

  remove : function(){
    var self = this
    this.selection.each(function(item){
      self.hide(item)
      $app.remove(item)
    })
  }
})
