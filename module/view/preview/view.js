/**
 * TODO implement as View
 * A dynamic panel displaying details on the current selection.
 */
Class.create("ViewPreview", View, {

  /**
   * Constructor
   * @param $super klass Superclass reference
   * @param element HTMLElement
   */
  initialize : function($super, element, p){
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
   * Show/Hide the panel
   * @param show Boolean
   */
  showElement : function(show){
    if(!this.element) return;
    if(show) this.element.show();
    else this.element.hide();
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
