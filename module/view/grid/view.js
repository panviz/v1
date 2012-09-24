Class.create("ViewGrid", View, {

  initialize : function($super, p){
    $super();
    this.p = Object.extend(this.p, p);
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
          text: 'Item Name',
          flex: 2,
          sortable: true,
          dataIndex: 'name'
        },{
          text: 'Date created',
          sortable: true,
          dataIndex: 'createdAt'
        },{
          text: 'Children',
          sortable: true,
          dataIndex: 'size'
        }
      ]
    }));
    this.extControls.push(this.tree);
    document.observe("app:context_changed", this._onContextChanged.bind(this));
  },

  _onContextChanged : function(e){
    this.store.setRootNode(e.memo);
  }
})
