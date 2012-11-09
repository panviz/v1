/**
 * Control for users action: Save
 */
Class.create("MainMenu", {

	initialize : function(p){
    var self = this
    var action = this.action = new ActionSave({})
    this.saveButton = Ext.create('Ext.Button', {
      text: t("Save")
		, scale: p.buttonSize
    , handler: action.execute
    })
    var separator = Ext.create('Ext.toolbar.Separator')
    this.search = Ext.create('Ext.form.field.Text', {
      name: 'searchField'
    , fieldLabel: t('Live Search')
    , labelAlign: 'right'
    , width: 300
    , listeners: {
        change: {
          fn: function(e){$app.search(e.value, self.searchGlobal.value)}
        , scope: this
        , buffer: 100
        }
      }
    })
    this.searchGlobal = Ext.create('Ext.form.field.Checkbox', {
      boxLabel: 'Global'
    })
    this.extControls = [this.saveButton, separator, this.search, this.searchGlobal];
  }
})
