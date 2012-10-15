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
   * @param items Item or Array of Items
   * @return Boolean if selection changed
   */
  select : function(items){
    var s = this.selection;
    if (!Object.isArray(items)) items = [items];
    if (items[0] == s[0] && s.length == 1 && items.length == 1){
      return false;
    } else {
      this.selection = items;

      items.each(function(item){
        item.fixed = true;
      })

      // add items from selection which are not rendered
      var extra = items.diff(this.items);
      if (extra) this.items = extra.concat(this.items);
      this.view.update()
      return true;
    }
  },

  // Add new node
  add : function(point){
    var item = {name: t('new Node'), fixed: true, x: point[0], y: point[1]};
    this.items.push(item);
    this.select(item);
  },
  /**
   * Toggle linked items visibility of selected one
   * @param selected Item
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

  // Recursively show children and their children if they are expanded
  expand : function(parent){
    var self = this
    parent.expanded = true
    var children = parent.children()
    //this.links.show(parent, parent.out())

    children.each(function(child){
      self.show(child)
      if (child.expanded) self.expand(child)
    })
  },

  collapse : function(item){
    item.expanded = false
    this.hideChildren(item)
    this.view.update()
  },

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
      if (otherParents.isEmpty()) delete collection[index]
    })
    collection.compact().each(function(item){
      self.hide(item)
    })
    this.items = this.items.compact()
  },

  // Show item and links to already rendered items
  show : function(item){
    var self = this
    if (!this.items.include(item)) this.items.push(item);
    var links = item.links().filter(function(link){
      var to = $app.items.get(link.to)
      if (to) return self.isShown(to)
      return to
    })
    if (links) this.links.show(item, links)
    this.view.update()
  },
  
  isShown : function(item){
    return item.index >= 0
  },

  hide : function(item){
    delete this.items[item.index];
    delete item.index;
    this.links.hide(item.links())
  }
})
