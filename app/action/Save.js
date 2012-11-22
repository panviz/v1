Class.create("ActionSave", Action, {

  initialize : function($super){
    $super()
    this.deny = true
    this.p.accessKey = 'Ctrl+s'
    document.observe("app:saved", this.disable.bind(this))
    document.observe("app:changed", this.enable.bind(this))
  },

  execute : function(){
    $app.save()
  }
})
