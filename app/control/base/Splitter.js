//TODO implement CME Splitter
Class.create("Splitter", Pane, {
    //__implements: ["ActionProvider"],

	/**
	 * Constructor
	 * @param container HTMLElement
	 * @param options Object
	 */
	initialize: function(container, options){				
		this.options = Object.extend({
			direction	: 	'vertical',
			activeClass	:	'active',
			fit			:	null,
            minSize     :   16,
            foldingButton:  null,
			onDrag 		:	Prototype.EmptyFunction,
			endDrag 	:	Prototype.EmptyFunction,
			startDrag 	:	Prototype.EmptyFunction
			// initA, initB
			// minA, maxA, minB, maxB
		}, arguments[1]||{});
		var verticalOpts = {
			cursor:			'e-resize',
			splitbarClass: 	'vsplitbar',
			eventPointer:	Event.pointerX,
			set:			'left',
			adjust:			'width', 
			getAdjust:		this.getWidth,
			offsetAdjust:	'offsetWidth', 
			adjSide1:		'Left',
			adjSide2:		'Right',
			fixed:			'height',
			getFixed:		this.getHeight,
			offsetFixed:	'offsetHeight',
			fixSide1:		'Top',
			fixSide2:		'Bottom'
		};
		var horizontalOpts = {
			cursor:			'n-resize',
			splitbarClass: 	'hsplitbar',
			eventPointer:	Event.pointerY,
			set:			'top',			
			adjust:			'height', 
			getAdjust:		this.getHeight,
			offsetAdjust:	'offsetHeight', 
			adjSide1:		'Top',
			adjSide2:		'Bottom',
			fixed:			'width',
			getFixed:		this.getWidth,
			offsetFixed:	'offsetWidth',
			fixSide1:		'Left',
			fixSide2:		'Right'			
		};
		if(this.options.direction == 'vertical') Object.extend(this.options, verticalOpts);
		else Object.extend(this.options, horizontalOpts);
		
		this.htmlElement = $(container);
		this.htmlElement.paneObject = this;
		
		this.group = $(container).setStyle({position:'relative'});
		var divs = this.group.childElements();
		divs.each(function(div){
			div.setStyle({
				position:'absolute'/*,
				margin:0*/
			});
		});
		this.paneA = divs[0];
		this.paneB = divs[1];
		this.initBorderA = parseInt(this.paneA.getStyle('border'+this.options.adjSide1+'Width')) + parseInt(this.paneA.getStyle('border'+this.options.adjSide2+'Width')) || 0;
		this.initBorderA += parseInt(this.paneA.getStyle('margin'+this.options.adjSide1)) + parseInt(this.paneA.getStyle('margin'+this.options.adjSide2));
		this.initBorderB = parseInt(this.paneB.getStyle('border'+this.options.adjSide1+'Width')) + parseInt(this.paneB.getStyle('border'+this.options.adjSide2+'Width'))  || 0;
		this.initBorderB += parseInt(this.paneB.getStyle('margin'+this.options.adjSide1)) + parseInt(this.paneB.getStyle('margin'+this.options.adjSide2));

        if(!this.initBorderA) this.initBorderA = 0;
        if(!this.initBorderB) this.initBorderB = 0;

		this.splitbar = new Element('div', {unselectable:'on'});
		this.splitbar.addClassName(this.options.splitbarClass).setStyle({position:'absolute', cursor:this.options.cursor,fontSize:'1px'});
		this.paneA.insert({after:this.splitbar});

        this.startSplitFunc = this.startSplit.bind(this);
        this.endSplitFunc = this.endSplit.bind(this);
		this.splitbar.observe("mousedown", this.startSplitFunc);
		this.splitbar.observe("mouseup", this.endSplitFunc);
		
		this.initCaches();
		
		this.paneA._init = (this.options.initA==true?parseInt(this.options.getAdjust(this.paneA)):this.options.initA) || 0;
		this.paneB._init = (this.options.initB==true?parseInt(this.options.getAdjust(this.paneB)):this.options.initB) || 0;
		if(this.paneB._init){
			this.paneB.setStyle(this.makeStyleObject(this.options.adjust, this.paneB._init));
		}
		if(this.paneA._init){
			this.paneA.setStyle(this.makeStyleObject(this.options.adjust, this.paneA._init));
		}
		//Event.observe(window,"resize", function(e){this.resizeGroup(e, null, true);}.bind(this));
		this.resizeGroup(null, this.paneB._init || this.paneA._init || Math.round((this.group[this.options.offsetAdjust]-this.group._borderAdjust-this.splitbar._adjust)/2));

        this.userLoggedObs = function(){
            var sizePref = this.getUserPreference("size");
            var folded = this.getUserPreference("folded");
			if(sizePref){
                if(folded) this.moveSplitter(parseInt(sizePref));
                else this.resizeAnimated(parseInt(sizePref));
			}
            if(folded){
                this.foldWithoutAnim();
            }
		}.bind(this);
		document.observe("app:user_logged",this.userLoggedObs);

        this.compConfigObs = function(event){
            if(!this.htmlElement){
                document.stopObserving("app:component_config_changed", this.compConfigObs);
                return;
            }
            if(event.memo.className == "Splitter::"+this.htmlElement.id){
                var node = event.memo.classConfig.get("all");
                var size = XPathSelectSingleNode(node, 'property[@name="resize"]');
                var folded = XPathSelectSingleNode(node, 'property[@name="folded"]');
                if(size){
                    var sizeValue = parseInt(size.getAttribute("value"));
                    if(folded && folded.getAttribute("value") == "true") this.moveSplitter(sizeValue);
                    else this.resizeAnimated(sizeValue);
                }
                if(folded && folded.getAttribute("value") == "true"){
                    this.foldWithoutAnim();
                }
            }
        }.bind(this);
        document.observe("app:component_config_changed", this.compConfigObs);

        this.doSplitFunc = this.doSplitMouse.bind(this);
		Event.observe(this.group, "mousemove", this.doSplitFunc);
		Event.observe(this.group, "mouseup", this.endSplitFunc);
		// NEW HTML5 : set it to false to disable native draggable!
		this.splitbar.draggable = false;
        disableTextSelection(this.group);
        if(this.options.startFolded){
            this.foldWithoutAnim();
        }
	},

    destroy:function($super){
        Event.stopObserving(this.group, "mousemove", this.doSplitFunc);
        this.splitbar.stopObserving("mousedown", this.startSplitFunc);
        this.splitbar.stopObserving("mouseup", this.endSplitFunc);
        document.stopObserving("app:user_logged",this.userLoggedObs);
        document.stopObserving("app:component_config_changed", this.compConfigObs);
        this.splitbar.remove();
        if(this.paneA.paneObject) {
            this.paneA.paneObject.destroy();
            this.paneA.remove();
        }
        if(this.paneB.paneObject) {
            this.paneB.paneObject.destroy();
            this.paneB.remove();
        }
    },

    /**
     * Gets the action of this component
     * @returns $H
     */
    getActions : function(){
        if(!this.options.foldingButton) return $H();
        var foldingButtonOptions = this.options.foldingButton;

        // function may be bound to another context
        var oThis = this;
        var options = {
            name:'folding_action',
            src:'view_left_close.png',
            text_id:416,
            title_id:415,
            text:I18N[416],
            title:I18N[415],
            hasAccessKey:false,
            subMenu:false,
            subMenuUpdateImage:false,
            callback: function(){
                var state = oThis.toggleFolding();
                app.actionBar.getAction("folding_action").setIcon('view_left_'+ (state?'right':'close') + '.png');
            },
            listeners : {
                init:function(){
                }
            }
            };
        var context = {
            selection:false,
            dir:true,
            actionBar:true,
            actionBarGroup:'default',
            contextMenu:true,
            infoPanel:false
            };
        // Create an action from these options!
        var foldingAction = new Action(options, context);
        return $H({folding_button:foldingAction});
    },

	/**
	 * Resize panes on drag event or manually
	 * @param event Event
	 * @param size Integer
	 * @param keepPercents Boolean
	 */
	resizeGroup: function(event, size, keepPercents){	
		// console.log("Resize", this.options.direction, size);
		var groupInitAdjust = this.group._adjust;
		this.group._fixed = this.options.getFixed(this.group) - this.group._borderFixed;
		this.group._adjust = this.group[this.options.offsetAdjust] - this.group._borderAdjust;
		
		if(this.group._fixed <= 0 || this.group._adjust <= 0) return;
		
		// Recompute fixed
		var optName = this.options.fixed;
		var borderAdjA = this.initBorderA;
		this.paneA.setStyle(this.makeStyleObject(optName, this.group._fixed-this.paneA._padFixed-borderAdjA+'px'));
		var borderAdjB = this.initBorderB;
		this.paneB.setStyle(this.makeStyleObject(optName,this.group._fixed-this.paneB._padFixed-borderAdjB+'px'));
		this.splitbar.setStyle(this.makeStyleObject(optName, this.group._fixed+'px'));		

        if(this.splitbar.hasClassName("folded")){
            var hiddenWidth = parseInt(this.paneA.getStyle(this.options.set));
            this.moveSplitter(0, true, -hiddenWidth);
            return;
        }
		// Recompute adjust
		if(keepPercents && !size && groupInitAdjust){			
			size = parseInt(this.paneA[this.options.offsetAdjust] * this.group._adjust / groupInitAdjust ) + this.initBorderA;
			//console.log("moveSplitter::keep", this.options.direction, size);
		}else{
			size = size||(!this.options.initB?this.paneA[this.options.offsetAdjust]:this.group._adjust-this.paneB[this.options.offsetAdjust]-this.splitbar._adjust);
			//console.log("moveSplitter::nokeep", this.options.direction, size);
		}
		this.moveSplitter(size);
	},

    /**
     * @return boolean Folded (true) or not
     */
    toggleFolding : function(){
        if(this.splitbar.hasClassName("folded")) {
            this.unfold();
            return false;
        }else {
            this.fold();
            return true;
        }
    },

    fold:function(){
        if(this.effectWorking) return;
        this.prefoldValue = this.options.getAdjust(this.paneA);
        this.effectWorking = true;
        new Effect.Tween(null, this.prefoldValue, 0, {afterFinish:function(){
            this.splitbar.addClassName('folded');
            this.effectWorking = false;
            this.setUserPreference("folded", true);
        }.bind(this)}, function(p){
            this.moveSplitter(p, true, this.prefoldValue);
        }.bind(this) );
    },

    unfold:function(){
        if(this.effectWorking) return;
        var target = this.prefoldValue;
        if(!target){
            target = 150;
            this.paneA.setStyle(this.makeStyleObject(this.options.adjust, 150+'px'));
        }
        this.effectWorking = true;
        new Effect.Tween(null, 0, target, {afterFinish:function(){
            this.splitbar.removeClassName('folded');
            this.effectWorking = false;
            this.setUserPreference("folded", false);
        }.bind(this) }, function(p){
            this.moveSplitter(p, true, target);
        }.bind(this) );
    },

    foldWithoutAnim : function(){
        this.prefoldValue = this.options.getAdjust(this.paneA);
        this.moveSplitter(0, true, this.prefoldValue);
        this.splitbar.addClassName('folded');
        this.setUserPreference("folded", true);
    },

    resizeAnimated : function(size){
        if(this.effectWorking) return;
        if(this.splitbar.hasClassName("folded")){
            return;
        }
        this.effectWorking = true;
        var current = this.options.getAdjust(this.paneA) + this.initBorderA;
        new Effect.Tween(null, current, size, {afterFinish:function(){
            this.effectWorking = false;
        }.bind(this) }, function(p){
            this.moveSplitter(p);
        }.bind(this) );
    },

	/**
	 * Start drag event
	 * @param event Event
	 */
	startSplit: function(event){
        if(this.splitbar.hasClassName("folded")){
            return false;
        }
		this.splitbar.addClassName(this.options.activeClass);
		this.paneA._posAdjust = this.options.getAdjust(this.paneA) + this.initBorderA - this.options.eventPointer(event);
		/*
		if(!this.moveObserver){
			this.moveObserver = this.doSplitMouse.bind(this);
			this.upObserver = this.endSplit.bind(this);
		}
		*/
		//Event.observe(this.group, "mousemove", this.moveObserver);
		//Event.observe(this.group, "mouseup", this.upObserver);
		if(this.options.startDrag){
			this.options.startDrag(this.getCurrentSize());
		}
	},
	/**
	 * During drag event
	 * @param event Event
	 * @returns Boolean
	 */
	doSplitMouse: function(event){
        if (!this.splitbar.hasClassName(this.options.activeClass)){        	
        	return this.endSplit(event);
        }        
		this.moveSplitter(this.paneA._posAdjust + this.options.eventPointer(event));
	}, 
	/**
	 * End drag event
	 * @param event Event
	 */
	endSplit: function(event){
		if (!this.splitbar.hasClassName(this.options.activeClass)){
			return;
		}
		this.splitbar.removeClassName(this.options.activeClass);
		/*
		if(this.moveObserver){
			//Event.stopObserving(this.group, "mousemove", this.moveObserver);
			//Event.stopObserving(this.group, "mouseup", this.upObserver);
        	this.moveObserver = 0; this.upObserver = 0;
		}
		*/
		if(this.options.endDrag){
			this.options.endDrag(this.getCurrentSize());
		}
		if($(this.paneA).paneObject){
			$(this.paneA).paneObject.resize();
		}
		if($(this.paneB).paneObject){
			$(this.paneB).paneObject.resize();
		}
        this.setUserPreference("size", this.getCurrentSize());
	},
	/**
	 * Move the splitter object
	 * @param np Integer
	 */
	moveSplitter:function(np, folding, foldingSize){
		np = Math.max(this.paneA._min+this.paneA._padAdjust, this.group._adjust - (this.paneB._max||9999), this.options.minSize,
				Math.min(np, this.paneA._max||9999, this.group._adjust - this.splitbar._adjust - 
				Math.max(this.paneB._min+this.paneB._padAdjust, this.options.minSize)));
		var optNameSet = this.options.set;				
		var optNameAdjust = this.options.adjust;				
		this.splitbar.setStyle(this.makeStyleObject(this.options.set, np+'px'));
		var borderAdjA = 0;
		var borderAdjB = 0;
		if(this.initBorderA){
			borderAdjA = this.initBorderA;
		}
        var targetAdjustA = np-this.paneA._padAdjust-borderAdjA;
        if(folding){
            this.paneA.setStyle(this.makeStyleObject(this.options.set, (targetAdjustA - foldingSize) +'px'));
        }else{
            this.paneA.setStyle(this.makeStyleObject(this.options.adjust, targetAdjustA+'px'));
        }
		this.paneB.setStyle(this.makeStyleObject(this.options.set, np+this.splitbar._adjust+'px'));
		if(this.initBorderB){
			borderAdjB = this.initBorderB;
		}
        var bSide =this.group._adjust-this.splitbar._adjust-this.paneB._padAdjust-np-borderAdjB;
        bSide = Math.max(0,bSide);
		this.paneB.setStyle(this.makeStyleObject(this.options.adjust, bSide+"px"));
		if(!Prototype.Browser.IE){
			this.paneA.fire("resize");
			this.paneB.fire("resize");
		}
		if(this.options.onDrag) this.options.onDrag();
		if($(this.paneA).paneObject){
			$(this.paneA).paneObject.resize();
		}
		if($(this.paneB).paneObject){
			$(this.paneB).paneObject.resize();
		}		
	},
	/**
	 * Cache some CSS properties
	 * @param jq Object
	 * @param n Integer
	 * @param pf Integer
	 * @param m1 Integer
	 * @param m2 Integer
	 */
	cssCache:function(jq,n,pf,m1,m2){
		var boxModel = (!Prototype.Browser.IE || document.compatMode == "CSS1Compat");
		jq[n] = boxModel? (parseInt(jq.getStyle(pf+m1))||0) + (parseInt(jq.getStyle(pf+m2))||0) : 0;
	},
	/**
	 * Cache panes data
	 * @param jq Object
	 * @param pane Element
	 */
	optCache: function(jq, pane){
		jq._min = Math.max(0, this.options["min"+pane] || parseInt(jq.getStyle("min-"+this.options.adjust)) || 0);
		jq._max = Math.max(0, this.options["max"+pane] || parseInt(jq.getStyle("max-"+this.options.adjust)) || 0);		
	}, 
	/**
	 * Initialize css cache
	 */
	initCaches: function(){
		this.splitbar._adjust = this.splitbar[this.options.offsetAdjust];
		this.cssCache(this.group, "_borderAdjust", "border", this.options.adjSide1, this.options.adjSide2);
		this.cssCache(this.group, "_borderFixed",  "border", this.options.fixSide1, this.options.fixSide2);
		this.cssCache(this.paneA, "_padAdjust", "padding", this.options.adjSide1, this.options.adjSide2);
		this.cssCache(this.paneA, "_padFixed",  "padding", this.options.fixSide1, this.options.fixSide2);
		this.cssCache(this.paneB, "_padAdjust", "padding", this.options.adjSide1, this.options.adjSide2);
		this.cssCache(this.paneB, "_padFixed",  "padding", this.options.fixSide1, this.options.fixSide2);
		this.optCache(this.paneA, 'A');
		this.optCache(this.paneB, 'B');		
	},
	/**
	 * Get the width of an element
	 * @param el HTMLElement
	 * @returns Integer
	 */
    getWidth: function(el) {
	    return el.offsetWidth;
    },
  /**
   * Gets the height of an element
   * @param el HTMLElement
   * @returns Integer
   */
    getHeight: function(el) {
        if (typeof el.offsetHeight != "undefined"){
            return parseInt(el.offsetHeight);                                 //ie
        } else {
        	var h = el.getHeight();
        	if(!h && el.parentNode){
        		 h = $(el.parentNode).getHeight();
        		 if(!Prototype.Browser.IE) h -= parseInt($(el.parentNode).paddingHeight*2);
        	}
            return h;
        }
    }, 
    /**
     * Create a style object for Prototype setStyle method
     * @param propStringName String
     * @param propValue Mixed
     * @returns {Object}
     */
    makeStyleObject: function(propStringName, propValue){
    	var sObject = {};
    	sObject[propStringName] = propValue;
    	return sObject;
    },
    /**
     * Get the current size of paneA
     * @returns Integer
     */
    getCurrentSize : function(){
    	return this.options.getAdjust(this.paneA);
    },
    /**
     * Trigger a resize of the widget
     */
    resize : function(){
    	if(this.options.fit && this.options.fit == 'height'){
    		fitHeightToBottom(this.htmlElement, (this.options.fitParent?$(this.options.fitParent):null));
    	}
    	this.resizeGroup(null, null, true);
        if(!this.firstResizePassed){
            this.userLoggedObs();
            this.firstResizePassed = true;
        }
    },
    /**
     * Show/hide widget (do nothing)
     * @param show Boolean
     */
    showElement : function(show){}

});