/** 
 * Container for a Repository.
 */
Class.create("Repository", {

	/**
	 * @var String
	 */
	id: undefined,
	/**
	 * @var String
	 */
	label: 'No Repository',
	/**
	 * @var String
	 */
	icon: '',
	/**
	 * @var String
	 */
	accessType: '',
	/**
	 * @var object
	 */
	itemProviderDef: null,
	/**
	 * @var ResourcesManager
	 */
	resourcesManager: undefined,
	/**
	 * @var Boolean
	 */
	allowCrossRepositoryCopy: false,
    /**
     * @var Boolean
     */
    userEditable: false,
	/**
	 * @var String
	 */
	slug: '',
    /**
     * @var String
     */
    owner: '',

	/**
	 * Constructor
	 * @param id String
	 * @param xmlDef XMLNode
	 */
	initialize : function(id, xmlDef){
		if(I18N){
			this.label = I18N[391];
		}
		this.id = id;
		this.icon = THEME.path +'/image/actions/16/network-wired.png';
		this.resourcesManager = new ResourcesManager();
		if(xmlDef) this.loadFromXml(xmlDef);
	},
	
	/**
	 * @returns String
	 */
	getId : function(){
		return this.id;
	},
	
	/**
	 * @returns String
	 */
	getLabel : function(){
		return this.label;
	},
	/**
	 * @param label String
	 */
	setLabel : function(label){
		this.label = label;
	},
	
	/**
	 * @returns String
	 */
	getIcon : function(){
		return this.icon;
	},
	/**
	 * @param label String
	 */
	setIcon : function(icon){
		this.icon = icon;
	},

    /**
     * @return String
     */
    getOwner : function(){
        return this.owner;
    },

	/**
	 * @returns String
	 */
	getAccessType : function(){
		return this.accessType;
	},
	/**
	 * @param label String
	 */
	setAccessType : function(access){
		this.accessType = access;
	},
	
	/**
	 * Triggers ResourcesManager.load
	 */
	loadResources : function(){
		this.resourcesManager.load();
	},
	
	/**
	 * @returns Object
	 */
	getItemProviderDef : function(){
		return this.itemProviderDef;
	},
	
	/**
	 * @param slug String
	 */
	setSlug : function(slug){
		this.slug = slug;
	},
	
	/**
	 * @returns String
	 */
	getSlug : function(){
		return this.slug;
	},

    getOverlay : function(){
        return (this.getOwner() ? resolveImageSource("shared.png", "/image/overlays/ICON_SIZE", 8) : "");
    },
	
	/**
	 * Parses XML Node
	 * @param repoNode XMLNode
	 */
	loadFromXml : function(repoNode){
		if(repoNode.getAttribute('allowCrossRepositoryCopy') && repoNode.getAttribute('allowCrossRepositoryCopy') == "true"){
			this.allowCrossRepositoryCopy = true;
		}
		if(repoNode.getAttribute('user_editable_repository') && repoNode.getAttribute('user_editable_repository') == "true"){
			this.userEditable = true;
		}
		if(repoNode.getAttribute('access_type')){
			this.setAccessType(repoNode.getAttribute('access_type'));
		}
		if(repoNode.getAttribute('repositorySlug')){
			this.setSlug(repoNode.getAttribute('repositorySlug'));
		}
		if(repoNode.getAttribute('owner')){
			this.owner = repoNode.getAttribute('owner');
		}
		for(var i=0;i<repoNode.childNodes.length;i++){
			var childNode = repoNode.childNodes[i];
			if(childNode.nodeName == "label"){
				this.setLabel(childNode.firstChild.nodeValue);
			}else if(childNode.nodeName == "client_settings"){
                if(childNode.getAttribute('icon_tpl_id')){
                    this.setIcon(window.serverAccessPath+'&get_action=get_user_template_logo&template_id='+childNode.getAttribute('icon_tpl_id')+'&icon_format=small');
                }else{
                    this.setIcon(childNode.getAttribute('icon'));
                }
				for(var j=0; j<childNode.childNodes.length;j++){
					var subCh = childNode.childNodes[j];
					if(subCh.nodeName == 'resources'){
						this.resourcesManager.loadFromXmlNode(subCh);
					}else if(subCh.nodeName == 'node_provider'){
						var nodeProviderName = subCh.getAttribute("ajxpClass");
						var nodeProviderOptions = subCh.getAttribute("ajxpOptions").evalJSON();
						this.itemProviderDef = {name: nodeProviderName, options: nodeProviderOptions};
					}
				}
			}
		}			
	}
});
