/**
 * Linear Item context menu for main (top) toolbar
 */
Class.create("ActionsMenu", {

	initialize : function(p){
    var self = this
    var save = $act.get('ActionSave')
    var download = $act.get('ActionDownload')
    this.saveBtn = Ext.create('Ext.Button', {
      cls: 'saveBtn'
    , iconCls: 'disabled'
		, scale: p.buttonSize
    , handler: save.apply
    , scope: save
    })
    this.downloadBtn = Ext.create('Ext.Button', {
      cls: 'downloadBtn'
    , iconCls: 'disabled'
		, scale: p.buttonSize
    , handler: download.apply
    , scope: download
    })
    this.setListeners(this.saveBtn, save)
    this.setListeners(this.downloadBtn, download)

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
    this.extControls = [this.saveBtn, this.downloadBtn, separator, this.search, this.searchGlobal];
  },
  /**
   * Attach various listeners to an action to reflect its state on the button
   * @param button ExtButton
   * @param action Action the action to observe.
   */
  setListeners : function(button, action){
    action.observe("hide", function(){
      button.hide()
    }.bind(this))
    action.observe("show", function(){
      button.show()
    }.bind(this))
    action.observe("disable", function(){
      button.setIconCls("disabled")
    }.bind(this))
    action.observe("enable", function(){
      button.setIconCls("enabled")
    }.bind(this))
    //action.observe("submenu_active", function(submenuItem){
      //if(!submenuItem.src || !action.p.subMenuUpdateImage) return;
      //var images = button.select('img[id="'+action.p.name +'_button_icon"]');
      //if(!images.length) return;
            //icSize = 22;
            //if(this.p.stylesImgSizes && this.style && this.p.stylesImgSizes[this.style]){
                //icSize = this.p.stylesImgSizes[this.style];
            //}
      //images[0].src = resolveImageSource(submenuItem.src, action.__DEFAULT_ICON_PATH,icSize);
      //action.p.src = submenuItem.src;
    //}.bind(this));
  }
})
