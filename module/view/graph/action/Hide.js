Class.create("ActionHide", Action, {

  execute : function(){
    this.saved = $item.selection
    $item.hide(this.saved)
  },

  undo : function(){
    $item.show(this.selection)
  }
})
