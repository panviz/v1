Class.create("ViewGraphContextMenu", {

  initialize : function(){
    this.control = new Ext.menu.Menu({
      items: [{
        id: 'rename'
      , text: 'Rename'
      , handler: function(e,i){
          //TODO show input string
        }
      , scope: this
      },{
        id: 'incoming'
      , text: 'Show incoming'
      , iconCls: 'incoming'
      , handler: function(e,i){
          this.target.remove()
        }
      , scope: this
      },{
        id: 'delete'
      , text: 'Delete'
      , iconCls: 'delete'
      , handler: function(e,i){
          this.target.remove()
        }
      , scope: this
      }]
    });
  },

  show : function(point, item){
    if (item) this.target = item
    this.control.showAt(point.x, point.y);
    d3.event.preventDefault()
  },

  hide : function(){
  }
})
