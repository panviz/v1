Class.create("ItemContextMenu", Item, {

  initialize : function($super){
    this.__defineGetter__("changed", function(){
    })
    this.__defineSetter__("changed", function(){
    })
    $super()
    this.name = this.id = 'ContextMenuItem'
    this.type = 'contextMenu'
    this.label = ' '
    this.noContextMenu = true
    this.size = -30
    this.expand = true
    this.fixed = true

    this.item
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
      this.link($app.getItemByName('ActionNewItem', true))
    }
    this.unlink()
    this.x = item.x
    this.y = item.y

    var actions = $w('DeleteAction RenameAction GroupAction')
    if ($item.isShown(item)) actions.push('HideAction')
    actions.each(function(action){
      var menuItem = $app.getItemByName('ActionItem', {action: name})
      self.link(actionItem)
    })
  }
})
