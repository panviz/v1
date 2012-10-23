Class.create("ItemMan", {
  items: [],

  initialize : function(view){
    this.view = view
    this.links = view.linkman
    this.selection = []
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
    if (items[0] == s[0] && s.length == 1 && items.length == 1){
      return false;
    } else {
      this.selection = items;

      items.each(function(item){
        self.fix(item)
      })

      // add items from selection which are not rendered
      var extra = items.diff(this.items);
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
    var item = $app.getItem()
    item.x = point[0]
    item.y = point[1]
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
    } else{
      item.fixed ? this.unfix(item) : this.fix(item)  // toggle floating
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
    this.fix(parent)
  },

  collapse : function(item){
    item.expanded = false
    item.fixed = false
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
      var to = $app.items.get(link.to)
      if (to) return self.isShown(to)
      return to
    })
    if (!links.isEmpty()) this.links.show(item, links)
    this.view.update()
  },

  fix : function(item){
    item.fixed = true
    delete item.tempFix
  },

  unfix : function(item){
    item.fixed = false
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
