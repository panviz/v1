Class.create("ActionRename", Action, {

  execute : function(){
  },

  undo : function(){
    $item.show(this.saved)
  }
})
