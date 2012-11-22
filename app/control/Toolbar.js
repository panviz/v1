Class.create("Toolbar", {

  initialize : function(p){
    this.bar = Ext.create('Ext.Toolbar', {
      region: p.region,
      xtype: 'toolbar',
      title: p.title,
      items: p.innerControls
    });

    this.extControls = [this.bar]
  }
});
