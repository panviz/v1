Class.create("ViewGraph", View, {
  
  nodes: [],    // svg nodes for visible items
  edges: [],    // svg lines for visible links
  root: {},     // centered item

  initialize : function($super, options){
    $super(options);
    var self = this;
    this.linkman = new ViewGraphLinkMan(this)
    this.itemman = new ViewGraphItemMan(this)
    var p = this.p;
    this.element = $(p.contentEl);
    this.contextMenu = $app.getItemByName("ItemContextMenu", {})
    this.search = $app.getItemByName("ItemSearch", {})
    var control = this.control = Ext.create('Ext.panel.Panel', p);
    this.extControls.push(control)

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d.size * self.p.graph.chargeK})
      .linkDistance(function(d){ return d.target.size + 75; })
    this.drag = d3.behavior.drag()
      .on("dragstart", this._onDragstart.bind(this))
      .on("drag", this._onDragmove.bind(this))
      .on("dragend", this._onDragend.bind(this));
    this.vis = d3.select("#"+p.contentEl).append("svg");
    d3.select('#desktop')
      .on("click", this._onClickBase.bind(this))
      .on("dblclick", this._onDblClickBase.bind(this))
      .on("contextmenu", this._onRightClickBase.bind(this))
    this.vis.append("svg:defs")
      .append("svg:marker")
        .attr("id", 'type')
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    control.on('resize', this._onResize.bind(this));
    document.observe("app:selection_changed", this._onSelectionChanged.bind(this));
    document.observe("item:updated", this._onItem.bind(this));
    document.observe("item:linked", this._onLinked.bind(this))
    // Select context if view is loaded after app:context_changed event
    if ($user){
      this._onContextChanged({memo: $user.context})
      this._onSelectionChanged({memo: $app.selection})
    }
  },

  // update graph accordingly to registries of items and links
  update : function(){
    var self = this;
    // Restart the force layout.
    this.force.stop()
    this.force
      .gravity(0)     //no gravity to center
      .nodes(this.itemman.items)
      .links(this.linkman.links)
      .start();

    // Update the links…
    this.edges = this.vis.selectAll("line.link")
      .data(this.linkman.links, function(d){ return d.id; });

    // Enter any new links.
    this.edges.enter().insert("line", '.node')
      .attr("class", "link")
      .attr("id", function(d){ return d.id})
      //.on("mouseover", this._onMouseOverEdge.bind(this))
      //.on("mouseout", this._onMouseOutEdge.bind(this))
      .attr("x1", function(d){ return d.source.x })
      .attr("y1", function(d){ return d.source.y })
      .attr("x2", function(d){ return d.target.x })
      .attr("y2", function(d){ return d.target.y })
      .style("stroke", "#9ecae1")
      .attr("marker-end", "url(#type)")

    // Remove old links.
    this.edges.exit().remove();

    // Update the nodes
    this.nodes = this.vis.selectAll(".node")
      .data(this.itemman.items, function(d){ return d.id })

    //TODO add transition for adding nodes
    // Add new nodes
    var g = this.nodes.enter().append("g")
      .attr("class", 'node')
      .attr("id", function(d){ return d.id })
      .on("click", this._onClickNode.bind(this))
      .on("dblclick", this._onDblClickNode.bind(this))
      .on("mousedown", this._onMouseDown.bind(this))
      .on("mousemove", this._onMouseMove.bind(this))
      .on("contextmenu", this._onRightClickNode.bind(this))
      .on("mouseup", this._onMouseUp.bind(this))
      .on("mouseover", this._onMouseOver.bind(this))
      .on("mouseout", this._onMouseOut.bind(this))
      .call(this.drag)
    g.append("circle")
      .attr("r", function(d){ return d.size/2 + self.p.graph.nodeRadius })
      .style("stroke", function(d){ return d.selected ? "faa" : "#aaf" })
      .style("stroke-width", function(d){ return d.selected ? 2 : 1 })
      .style("fill", function(d){ return d.out().isEmpty() ? "#fff" : "#eee" })
      .style(":hover", "opacity: 0.5")
    g.append("image")
      .attr("xlink:href", function(d){ return d.icon})
      .attr("x", function(d){ return (d.iconSize/2 + self.p.graph.nodeRadius)/-2 })
      .attr("y", function(d){ return (d.iconSize/2 + self.p.graph.nodeRadius)/-2 })
      .attr("width", function(d){ return d.iconSize/2 + self.p.graph.nodeRadius })
      .attr("height", function(d){ return d.iconSize/2 + self.p.graph.nodeRadius })
    var stateGroup = g.append("g")
    stateGroup.append("image")
      .attr("xlink:href", function(d){ return d.fixed ? (d.pinned ? '/client/image/pin.ico' : '/client/image/pinGrey.ico') : '/client/image/no.ico' })
      .attr("x", function(d){ return (d.size/2 + self.p.graph.nodeRadius)/3 })
      .attr("y", function(d){ return -(d.size/2 + self.p.graph.nodeRadius) })
      .attr("width", 10)
      .attr("height", 12)
      .on("click", this._onClickPin.bind(this))
    //Text should be on top
    g.append("text")
      .attr("dx", 10)
      .attr("dy", "10pt")
      .attr("font-weight", function(d){ return d.selected ? "bold" : "normal" })
      .text(function(d){ return d.label || d.id })

    // Remove old nodes
    this.nodes.exit()
      .transition()
        .duration(750)
        .attr("y", 60)
        .style("fill-opacity", 1e-6)
      .remove()
  },

  _onContextChanged : function(e){
    this.itemman.select([e.memo]);
  },

  _onSelectionChanged : function(e){
    this.itemman.select(e.memo)
  },

  // Update visual node on graph
  _onItem : function(e){
    var item = e.memo
    if (this.itemman.isShown(item)){
      //TODO remove only updated nodes
      // remove node because d3 will not update it on enter as already rendered
      this.nodes.remove();
      this.itemman.show(item)
    }
  },

  _onLinked : function(e){
    var item = e.memo.item
    var link = e.memo.link
    if (this.itemman.isShown(item)) this.linkman.show(item, link)
  },

  // Move nodes and lines on layout recalculation
  _onTick : function(e){
    var p = this.p;
    var radius = p.graph.nodeRadius;
    var width = p.width;
    var height = p.height;
    this.nodes.attr("transform", function(d){
      d.x = Math.max(radius, Math.min(width - radius, d.x))
      d.y = Math.max(radius, Math.min(height - radius, d.y));
      return "translate(" + d.x + "," + d.y + ")";
    })

    this.edges
      .attr("x1", function(d){ return d.source.x })
      .attr("y1", function(d){ return d.source.y })
      .attr("x2", function(d){ return d.target.x })
      .attr("y2", function(d){ return d.target.y })
  },

  _onClickNode : function(item){
    d3.event.stopPropagation()
    if (d3.event.ctrlKey) this.itemman.hide(item)
    if (d3.event.ctrlKey && d3.event.shiftKey) this.itemman.remove(item)
    if (item.action){
      item.action.execute()
      this.itemman.hide(this.contextMenu, true)
    }
  },

  _onDblClickNode : function(item){
    d3.event.stopPropagation()
    this.itemman.toggle(item)
  },

  _onRightClickNode : function(item){
    d3.event.stopPropagation()
    d3.event.preventDefault()
    this.itemman.hide(this.contextMenu, true)
    if (item.noContextMenu) return 
    this.contextMenu.show(item)
    this.itemman.show(this.contextMenu)
  },

  _onClickBase : function(){
    this.itemman.hide(this.contextMenu, true)
  },

  // Show search string
  _onDblClickBase : function(){
    var point = d3.event
    var coords = d3.mouse(this.element);
    this.search.show(point, {x: coords[0], y: coords[1]})
    this.itemman.show(this.search)
  },

  _onRightClickBase : function(){
    d3.event.preventDefault()
    var coords = d3.mouse(this.element)
    this.contextMenu.show(null, {x: coords[0], y: coords[1]})
    this.itemman.show(this.contextMenu)
  },

  _onMouseDown : function(item){
    if (item.action) return
    if (this.itemman.select(item)) document.fire('app:context_changed', item);
  },

  _onMouseMove : function(item){
  },

  _onMouseUp : function(item){
  },

  _onMouseOver : function(item){
    var self = this
    this.hover = item
    if (!item.fixed){
      item.tempFix = true
      item.fixed = true
    }
    // Open menu on hover and close all other previously opened menu items
    if (item.action){
      //this.contextMenu.items.each(function(item){self.itemman.collapse(item)})
      this.itemman.expand(item)
      return 
    }
    if (item.selected) return
    this.itemman.highlight(item)
  },

  _onMouseOut : function(item){
    delete this.hover
    if (item.tempFix){
      item.fixed = false
      delete item.tempFix
    }
    if (item.selected) return
    this.itemman.deHighlight(item)
  },

  _onDragstart : function(item){
    // auto positioning is off while dragging
    this.force.stop()
  },

  _onDragmove : function(item){
    //TODO do once for all subsequent move events
    var node = d3.select('#'+item.id)
    node.attr('pointer-events', 'none')
    item.px += d3.event.dx;
    item.py += d3.event.dy;
    if (d3.event.dx || d3.event.dy) item.change()
    item.x += d3.event.dx;
    item.y += d3.event.dy; 
    this._onTick(); // this is the key to make it work together with updating both px,py,x,y on item
  },

  _onDragend : function(item){
    if (this.hover && item != this.hover){
      var link = item.link(this.hover)
      //TODO dragged item should be put to drag start position if link created?
      //item.fixed = false
      this.update()
    }
    this.itemman.fix(item)
    this._onTick();
    this.force.resume();
    var node = d3.select('#' + item.id)
    node.attr('pointer-events', 'all')
  },

  //_onMouseOverEdge : function(edge){
  //},

  //_onMouseOutEdge : function(edge){
  //},

  _onResize : function(control, width, height){
    var p = this.p;
    p.width = width;
    p.height = height;
    this.force.size([width, height]);
    this.vis.attr("width", p.width)
            .attr("height", p.height);
    this.update();
  },

  _onClickPin : function(item){
    d3.event.stopPropagation()
    if (!$user.contexts.include(item.id)){
      this.itemman.pin(item)
    } else{
      this.itemman.unPin(item)
    }
  }
})
