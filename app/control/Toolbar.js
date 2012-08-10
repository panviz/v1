/**
 * Toolbar to display actions buttons
 */
Class.create("Toolbar", {

  initialize : function(p){
    this.bar = Ext.create('Ext.Toolbar', {
      region: p.region,
      xtype: 'toolbar',
      title: 'Toolbar',
      items: p.innerControls
    });

    this.extControls = [this.bar]
  },

  /**
   * Attach various listeners to an action to reflect its state on the button
   * @param button HTMLElement The button
   * @param action Action The action to observe.
   */
  attachListeners : function(button, action){
    action.observe("hide", function(){
      button.hide();
    }.bind(this));
    action.observe("show", function(){
      button.show();
    }.bind(this));
    action.observe("disable", function(){
      button.addClassName("disabled");
    }.bind(this));
    action.observe("enable", function(){
      button.removeClassName("disabled");
    }.bind(this));
    action.observe("submenu_active", function(submenuItem){
      if(!submenuItem.src || !action.p.subMenuUpdateImage) return;
      var images = button.select('img[id="'+action.p.name +'_button_icon"]');
      if(!images.length) return;
            icSize = 22;
            if(this.p.stylesImgSizes && this.style && this.p.stylesImgSizes[this.style]){
                icSize = this.p.stylesImgSizes[this.style];
            }
      images[0].src = resolveImageSource(submenuItem.src, action.__DEFAULT_ICON_PATH,icSize);
      action.p.src = submenuItem.src;
    }.bind(this));
  }
});
