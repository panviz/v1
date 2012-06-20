/**
 * Independant widget for opening a form with a Tree in it
 */
Class.create("TreeSelector", {
	/**
	 * Constructor
	 * @param oElement HTMLElement
	 * @param options Object
	 */
	initialize : function(oElement, options){
		this.htmlElement = oElement;
		this.options = Object.extend({
			filterSelectorId : 'select[id="external_repository"]',
			targetField : 'input[name="dest"]',
			targetNode: 'input[name="dest_node"]',
			treeContainer : '.treeCopyContainer'
		}, options || {});
	},
	/**
	 * Load the tree data
	 * @param rootNode Node
	 */
	load : function(rootNode){
		if(webFXTreeHandler && webFXTreeHandler.selected){
			this.__initialWebFXSelection = webFXTreeHandler.selected;
		}
		this.filterSelector = this.htmlElement.select(this.options.filterSelectorId)[0];
		var target = this.targetField = this.htmlElement.select(this.options.targetField)[0];
		var targetNode = this.targetNode = this.htmlElement.select(this.options.targetNode)[0];
		this.treeContainer = this.htmlElement.select(this.options.treeContainer)[0];
		this.filterSelector.hide();
		this._nodeActionCallback = function(e){
			// Warning, this is the tree object
			target.value = this.item.getPath();
			targetNode.value = this.item.getPath();
 			this.select();			
		};
		this._nodeFilter = function(item){
			return (!item.isLeaf());
		};
		if(!rootNode){
			rootNode = new Node("/", false, I18N[373], "folder.png");
		}
		this.treeCopy = new AJXPTree(rootNode, this._nodeActionCallback, this._nodeFilter);							
		this.treeContainer.update(this.treeCopy.toString());
		$(this.treeCopy.id).observe("click", function(e){
			this.action();
			Event.stop(e);
		}.bind(this.treeCopy));
		this.treeCopy.focus();
		this.treeCopy.setRootNode(rootNode);
		
	},
	/**
	 * Clear the widget
	 */
	unload : function(){
		if(this.__initialWebFXSelection){
			this.__initialWebFXSelection.select();
		}
		this.treeCopy.remove();
	},
	/**
	 * Retrieve select node
	 * @returns String
	 */
	getSelectedNode : function(){
		return this.targetNode.getValue();
	},
	/**
	 * Retrieve selected label
	 * @returns String
	 */
	getSelectedLabel : function(){
		return this.target.getValue();
	},
	/**
	 * Whether to show / hide the filter <select> object
	 * @param bool Boolean
	 */
	setFilterShow : function(bool){
		if(bool) this.filterSelector.show();
		else this.filterSelector.hide();
	},
	/**
	 * Check whether the filter is active and its value is different from the original value
	 * @param refValue String Original value
	 * @returns Boolean
	 */
	getFilterActive : function(refValue){
		if(!this.filterSelector.visible()) return false;
		if(refValue && this.filterSelector.getValue() == refValue) return false;
		return true;
	},
	/**
	 * Add an option to the filter
	 * @param key String
	 * @param value String
	 * @param position String empty or "top"
	 */
	appendFilterValue : function(key, value, position){
		var newOption = new Element('option', {value: key}).update(value);
		var obj;
		if(position == 'top'){
			obj = {top : newOption};
		}else{
			obj = newOption;
		}
		this.filterSelector.insert(obj);
	},
	/**
	 * Sets an option as selected
	 * @param index Integer
	 */
	setFilterSelectedIndex : function(index){
		this.filterSelector.selectedIndex = index;
	},
	/**
	 * Add a changecallback to the filter
	 * @param func Function
	 */
	setFilterChangeCallback : function(func){
		this.filterSelector.observe("change", func.bind(this));
	},
	/**
	 * Reload the root node of the tree
	 * @param item Node
	 */
	resetRootNode : function(item){
		this.treeCopy.item.clear();
		this.treeCopy.setRootNode(item);		
		this.treeCopy.item.load();
	}
});
