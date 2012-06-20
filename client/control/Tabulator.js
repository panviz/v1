/*
 * Description
 */
Class.create("Tabulator", Pane, {
	/**
	 * Constructor
	 * @param $super klass Superclass reference
	 * @param htmlElement HTMLElement Anchor of this pane
	 * @param tabulatorOptions Object Widget options
	 */
	initialize : function($super, htmlElement, tabulatorOptions){
		$super(htmlElement);
		this.tabulatorData 	= tabulatorOptions.tabInfos;		
		// Tabulator Data : array of tabs infos
		// { id , label, icon and element : tabElement }.
		// tab Element must implement : showElement() and resize() methods.
		// Add drop shadow here, otherwise the negative value gets stuck in the CSS compilation...
		var div = new Element('div', {className: 'tabulatorContainer', style: 'box-shadow:inset 0px -1px 2px #999999; -webkit-box-shadow:inset 0px -1px 2px #999999; -moz-box-shadow:inset 0px -1px 2px #999999;'});
		var table = new Element('table', {cellpadding: 0, cellspacing: 0, border: 0, width: '100%', style: 'height:25px;'});		
		$(this.htmlElement).insert({top: div});
		div.update(table);
		var tBody = new Element('tBody');
		var tr = new Element('tr');
		table.update(tBody);
		tBody.update(tr);
		this.tabulatorData.each(function(tabInfo){
			var td = new Element('td').addClassName('toggleHeader');
			td.addClassName('panelHeader');
			td.update('<img width="16" height="16" align="absmiddle" src="'+resolveImageSource(tabInfo.icon, '/image/action/ICON_SIZE', 16)+'"><span ajxp_message_id="'+tabInfo.label+'">'+I18N[tabInfo.label]+'</a>');
			td.observe('click', function(){
				this.switchTabulator(tabInfo.id);
			}.bind(this) );
			tr.insert(td);
			tabInfo.headerElement = td;
			disableTextSelection(td);
			this.selectedTabInfo = tabInfo; // select last one by default
		}.bind(this));
		if(tabulatorOptions.defaultTabId){
			this.switchTabulator(tabulatorOptions.defaultTabId);
		}
	},
	
	/**
	 * Tab change
	 * @param tabId String The id of the target tab
	 */
	switchTabulator : function(tabId){
		var toShow ;
		this.tabulatorData.each(function(tabInfo){
			var object = this.getAndSetObject(tabInfo);
			if(tabInfo.id == tabId){				
				tabInfo.headerElement.removeClassName("toggleInactive");
				tabInfo.headerElement.select('img')[0].show();
				if(object){
					toShow = object;
				}
				this.selectedTabInfo = tabInfo;
			}else{
				tabInfo.headerElement.addClassName("toggleInactive");
				tabInfo.headerElement.select('img')[0].hide();
				if(object){
					object.showElement(false);
				}
			}
		}.bind(this));
		if(toShow){
			toShow.showElement(true);
			toShow.resize();
		}
	},
	
	/**
	 * Resizes the widget
	 */
	resize : function(){
		if(!this.selectedTabInfo) return;
		var object = this.getAndSetObject(this.selectedTabInfo);
		if(object){
			object.resize();
		}
	},
	
	/**
	 * Implementation of the IWidget methods
	 */
	getDomNode : function(){
		return this.htmlElement;
	},
	
	/**
	 * Implementation of the IWidget methods
	 */
	destroy : function(){
		this.tabulatorData.each(function(tabInfo){
			var object = this.getAndSetObject(tabInfo);
			tabInfo.headerElement.stopObserving("click");
			object.destroy();
		}.bind(this));
		this.htmlElement.update("");
        if(window[this.htmlElement.id]){
            delete window[this.htmlElement.id];
        }
		this.htmlElement = null;
	},
	
	
	/**
	 * Getter/Setter of the Widget that will be attached to each tabInfo
	 * @param tabInfo Object
	 * @returns IWidget
	 */
	getAndSetObject : function(tabInfo){
		var object = tabInfo.object || null;
		if($(tabInfo.element) && $(tabInfo.element).paneObject && (!object || object != $(tabInfo.element).paneObject) ){
			object = tabInfo.object = $(tabInfo.element).paneObject;
		}
		return object;		
	}
});
