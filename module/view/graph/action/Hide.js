Class.create("ActionHide", Action, {

  execute : function(){
    this.saved = $item.hide(null, false, true)
  },

  undo : function(){
    $item.show(this.saved, true)
  }
})
