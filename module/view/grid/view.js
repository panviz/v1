Class.create("ViewGrid", View, {

  initialize : function($super){
    $super();
    this.model = Ext.define('ExtItem', {
      extend: 'Ext.data.Model',
      fields: [
      //columns definition
        {name: 'id', type: 'number'},
        {name: 'name', type: 'string'},
        {name: 'modified', type: 'string'}
      ]
    });

    this.store = Ext.create('Ext.data.TreeStore', {
      model: this.model,
      root: {
        id: 1,
        name: "root",
        modified: 9,
        expanded: true,
        children: [
          { leaf: true, id: 2, name: "second", modified: 8},
          { id: 3, name: "third", modified: 7, children: [
              { id: 4, name: "forth", modified: 6, leaf: true },
              { id: 5, modified: 5, leaf: true}
            ]
          },
          { id: 6, name: "six", modified: 4, leaf: true }
        ]
      }
    });
  },

  render : function(p){
    this.p = Object.extend(this.p, p);
    this.tree = Ext.create('Ext.tree.Panel', Object.extend(this.p, {
      xtype: 'treepanel',
      //width: '30%',
      store: this.store,
      useArrows: true,
      rootVisible: true,
      multiSelect: true,
      //singleExpand: true,
      //the 'columns' property is now 'headers'
      columns: [
        {
          xtype: 'treecolumn',
          text: 'Id',
          flex: 2,
          sortable: true,
          dataIndex: 'id'
        },{
          text: 'Item name',
          sortable: true,
          dataIndex: 'name'
        },{
          text: 'Date modified',
          sortable: true,
          dataIndex: 'modified'
        }
      ]
    }));
    this.extControls.push(this.tree);
  }
})
