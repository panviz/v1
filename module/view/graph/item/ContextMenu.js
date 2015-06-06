Class.create("ItemContextMenu", Item, {

  initialize : function($super){
    $super()
    this.__defineGetter__("changed", function(){ return false })
    this.__defineSetter__("changed", function(){ return false })
    this.actionClassName = 'ItemAction'
    this.name = this.id = 'ItemContextMenu'
    this.type = 'contextMenu'
    this.label = ' '
    this.noContextMenu = true
    this.size = -30
    this.iconSize = 500
    this.expand = true
    this.fixed = true
  },
  /**
   * @param Point point where on base menu has been called
   * @param Item item for which menu opened
   */
  show : function(item, point){
    var self = this
    if (!item){
      this.x = point.x
      this.y = point.y
      this.link($app.getItemByName('ItemActionNew', true))
    }
    this.unlink()
    this.x = item.x
    this.y = item.y
    var x = item.x + 70
    var y = item.y - 100

    var actions = $w('Delete Rename Group')
    if ($item.isShown(item)) actions.push('Hide')
    // TODO linked() may be async set Reveal action add async too
    var hiddenItems = item.linked().filter(function(linked){
      return linked.hidden
    })
    if (!hiddenItems.isEmpty()){
      actions.push('ShowAll')
    }
    actions.each(function(name){
      var menuItem = $app.getItemByName(self.actionClassName, {name: self.actionClassName + name})
      menuItem.x = x
      menuItem.y = y+=40
      self.link(menuItem)
    })
  }
})
