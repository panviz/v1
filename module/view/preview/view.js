/**
 * A dynamic panel displaying details on the current selection.
 */
Class.create("ViewPreview", View, {
  // Item shown in Preview
  item: null,

  initialize : function($super, p){
    $super(p);
    
    this.control = Ext.create('Ext.grid.property.Grid', Object.extend(this.p, {
      source: {
        "Name": t("Item")
      }
    }));
    this.control.on('edit', this._onEdit.bind(this))
    this.extControls.push(this.control);
  },
  /**
   * Show item properties
   * TODO what to show on multiples selected 
   */
  _onContextChanged : function(e){
    var item = this.item = e.memo;
    var p = {};
    p[t("ID")] = item.id;
    p[t("Name")] = item.label;
    p[t("Children")] = item.size;
    p[t("Parents")] = item.inc().length;
    p[t("Links")] = item.links().length;
    p[t("Last login")] = Ext.Date.parse(item.lastLogin, 'c');
    p[t("Item type")] = item.type;
    p[t("Date created")] = Ext.Date.parse(item.createdAt, 'c');

    this.control.setSource(p);
  },

  _onEdit : function(editor, e){
    if (e.originalValue != e.value){
      var diff = {}
      diff[e.record.data.name] = e.value
      //this.item.update(diff)
    }
  },
  /**
   * Called by the other components to create a preview (thumbnail) of a given node
   * @param item Node The node to display
   * @param rich Boolean whether to display a rich content (flash, video, etc...) or not (image)
   * @returns Element
   */
  getPreview : function(item, rich){
  },
  /**
   * TODO move somewhere?
   * Gets the standard thumbnail source for previewing the node
   * @param item Node
   * @returns String
   */
  getThumbnailSource : function(item){
    return resolveImageSource(item.getIcon(), "/image/mime/ICON_SIZE", 64);
  },
  /**
   * Insert html in content pane
   * @param sHtml String
   */
  setContent : function(sHtml){
  },
  /**
   * Find template and evaluate it
   * @param mimeType String
   * @param fileNode Node
   * @param tArgs Object
   */
  getTemplateForMime : function(mimeType, fileNode, tArgs){
  },
  /**
   * Adds an "Action" section below the templates
   * @param selectionType String 'empty', 'multiple', 'unique'
   */
  addActions : function(selectionType){
  }
});
