Class.create("ItemAction", Item, {
  /**
   * @param String p.name action name
   */
  initialize : function($super, p){
    $super()
    this.__defineGetter__("changed", function(){ return false })
    this.__defineSetter__("changed", function(){ return false })
    this.id = this.name = p.name
    var actionName = p.name.replace('Item', '')
    this.label = p.name.replace('ItemAction', '')
    this.noContextMenu = true
    this.iconSize = 32
    this.type = actionName
    this.fixed = true
    this.action = $act.get(actionName)
  }
})
// ActionGroup?
Class.create("ItemActionNew", Item, {
  initialize : function($super){
    $super()
    this.type = 'actionNew'
    this.action = $act.get('ActionNew')
  }
})
