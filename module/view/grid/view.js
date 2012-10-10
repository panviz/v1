Class.create("ViewGrid", View, {

  initialize : function($super, p){
    $super(p);
    this.model = Ext.define('ExtItem', {
      extend: 'Ext.data.Model',
      fields: [
      //columns definition
        {name: 'name', type: 'string'},
        {name: 'createdAt', type: 'string'},
        {name: 'size', type: 'number'}
      ]
    });

    this.store = Ext.create('Ext.data.TreeStore', {
      model: this.model
    });

    this.tree = Ext.create('Ext.tree.Panel', Object.extend(this.p, {
      xtype: 'treepanel',
      store: this.store,
      useArrows: true,
      rootVisible: true,
      multiSelect: true,
      //singleExpand: true,
      //the 'columns' property is now 'headers'
      columns: [
        {
          xtype: 'treecolumn',
          text: t('Item Name'),
          flex: 2,
          sortable: true,
          dataIndex: 'label'
        },{
          xtype: 'templatecolumn',
          text: t('Date created'),
          sortable: true,
          dataIndex: 'createdAt',
          tpl: Ext.create('Ext.XTemplate', '{createdAt:this.formatDate}', {
            formatDate: function(v) {
              var date = Ext.Date.parse(v, 'c');
              return Ext.Date.format(date, t('m/d/Y'))
            }
          })
        },{
          text: t('Children'),
          sortable: true,
          dataIndex: 'size'
        }
      ]
    }));
    this.extControls.push(this.tree);
  },

  _onContextChanged : function(e){
    //TODO
    var item = e.memo
    var node = {}
    node.name = item.label
    node.createdAt = item.createdAt
    node.size = item.size
    node.isLeaf = !!item._links
    this.store.setRootNode(node)
  },

  _onItem : function(e){
  }
})
