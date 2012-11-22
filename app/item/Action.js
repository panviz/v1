Class.create("ItemAction", Item, {
  /**
   * @param String p.action name
   */
  initialize : function($super, p){
    $super()
    this.type = p.action
    this.action = $act.get(p.action)
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
