/**
 * Show search results connected
 */
Class.create("ItemSearch", Item, {

  initialize : function($super){
    $super()
    var self = this
    this.__defineGetter__("changed", function(){
    })
    this.__defineSetter__("changed", function(value){
    })
    this.__defineSetter__("expanded", function(value){
    })
    this.name = this.id = 'ItemSearch'
    this.type = 'search'
    this.label = ' '
    this.fixed = true
    //TODO use value from user preferences "number of search results"
    this.childrenQuantity = 10
    this.expand = true

    var focusSearchString = function(){
      field.focus('', 100);
    }
    var request = function(e){
      if (e.value.length <= 2) return
      // TODO remove shown children on previous search 
      self.get({name: true, search: e.value})
    }

    var control = this.control = Ext.create('Ext.panel.Panel', {
      floating: true
    , layout: 'hbox'
    , border: false
    , items: [{
        xtype: 'textfield'
      , itemId: 'searchField'
      , name: 'searchField'
      , emptyText: "Find or Create Item"
      , grow: true
      , width: 125
      , listeners: {
          change: {
            fn: request
          , scope: this
          , buffer: 500
          }
        , afterrender: focusSearchString
        , move: focusSearchString
        , specialkey: function(panel, e){
            if (e.getKey() == e.ENTER) {
              $app.search(field.value);
            }
          }
        }
      }, {
        xtype: 'button'
      , itemId: 'addItem'
      , iconCls: 'addBtn'
      , border: false
      }]
    })
    //control.setBorder(false)
    var field = control.getComponent('searchField')
    var button = control.getComponent('addItem')
    button.on('click', $app.getItemByName.bind($app, 'ItemCreateNew'))
    this.global = false
  },

  show : function(point, localPoint){
    this.control.showAt(point.x, point.y);
    this.x = localPoint.x - 8
    this.y = localPoint.y - 8
  },
  /*
   * Hide node and control
   * TODO Remove links with children and field value
   */
  hide : function(){
    this.control.hide()
  },

  onLoad : function(data){
    this.update(data);
  }
})
