Class.create("ViewGraphItemMan", {
  items: [],

  initialize : function(view){
    this.view = view
    this.links = view.linkman
    this.selection = []
    $item = this
  },
  /**
   * Change selection to new items
   * Selection may have multiple items on:
   *  Search results
   *  Grid selection
   * @param {Item|Item[]} items one or many items
   * @return Boolean if selection changed
   */
  select : function(items){
    var self = this
    var s = this.selection;
    if (!Object.isArray(items)) items = [items];
    // TODO define which items to add/remove to selection BETTER
    if (items[0] == s[0] && s.length == 1 && items.length == 1){
      return false;
    } else {
      // Remove highlight for previously selected items
      this.selection.each(function(item){
        item.selected = false
        d3.select('#'+item.id+' circle').style("stroke", "#aaf")
        self.view._onMouseOut(item)
      })
      this.selection = items;

      items.each(function(item){
        self.view._onMouseOver(item)
        item.selected = true
        self.fix(item)
        d3.select('#'+item.id+' circle').style("stroke", "#f00").style("stroke-width", 2)
      })

      // show items from selection if they are not shown
      var extra = items.substract(this.items)
      if (extra){
        extra.each(function(item){
          self.show(item)
        })
      }
      //TODO remove this udpate as if no items were added selected items will become fixed anyway
      this.view.update()
      return true;
    }
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
      item.expanded ? this.collapse(item) : this.expand(item)
    }
  },
  /**
   * Show children
   * they will be recursively shown if they are expanded
   * @param Item parent
   */
  expand : function(parent){
    var self = this
    var children = parent.children()

    children.each(function(child){
      self.show(child)
    })
    parent.expanded = true
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
        if (self.isShown(child) && !collection.include(child)){
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
    var self = this
    //TODO make better fix for d3.force.tick()
    item.px = item.x
    item.py = item.y
    // expand item if it should be but not yet
    if (!item.relations.isEmpty() && item.expand && !item.expanded) this.expand(item)

    if (!this.items.include(item)) this.items.push(item);

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
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/pinGrey.ico")
    item.fixed = true
    delete item.tempFix
  },

  unFix : function(item){
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/no.ico")
    item.fixed = false
  },

  addContext : function(item){
    d3.select('#'+item.id+' g image').attr("xlink:href", "/client/image/pin.ico")
    $user.contexts.push(item.id)
  },
  
  removeContext : function(item){
    $user.contexts = $user.contexts.without(item.id)
    this.unFix(item)
  },

  isShown : function(item){
    return item.index >= 0
  },

  // Hiding means deleting item and all its links from Man index
  hide : function(item){
    delete this.items[item.index];
    delete item.index;
    this.links.hide(item.links())
  }
})
