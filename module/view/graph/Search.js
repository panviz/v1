Class.create("ViewGraphSearch", {

  initialize : function(){
    var self = this
    var item = this.item = $app.getItemByName(t("Search"))
    item.type = 'search'
    item.label = ' '
    item.fixed = true
    var focusSearchString = function(){
      field.focus('', 100);
    }
    var request = function(e){
      if (e.value.length <= 2) return

      self.item.name = e.value
      self.item.get({name: true})
    }

    var field = this.control = Ext.create('Ext.form.field.Text', {
      name: 'searchField'
    , width: 140
    , floating: true
    , listeners: {
        change: {
          fn: request
        , scope: this
        , buffer: 500
        }
      , afterrender: focusSearchString
      , move: focusSearchString
      , specialkey: function(control, e){
          if (e.getKey() == e.ENTER) {
            self.hide()
            $app.search(field.value);
          }
        }
      }
    })
    this.global = false
  },

  show : function(point, localPoint){
    this.control.showAt(point.x, point.y);
    this.item.x = localPoint.x - 9
    this.item.y = localPoint.y - 9
    $item.show(this.item)
  },
  /*
   * Hide node and control
   * TODO Remove links with children and field value
   */
  hide : function(){
    this.control.hide()
    $item.hide(this.item)
  }
})
