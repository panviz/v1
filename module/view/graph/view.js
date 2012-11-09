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
    this.contextMenu = new ViewGraphContextMenu()
    this.search = new ViewGraphSearch()
    var control = this.control = Ext.create('Ext.panel.Panel', p);
    this.extControls.push(control)

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d.out ? d.out.length * self.p.graph.chargeK : self.p.graph.chargeBase; })
      .linkDistance(function(d){ return d.target._children ? 150 : 75; })
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
    // Select context if view is loaded after user login
    if ($user) this.itemman.select($user.context);
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
    this.edges.enter().append("line")
      .attr("class", "link")
      .attr("id", function(d){return d.id})
      //.on("mouseover", this._onMouseOverEdge.bind(this))
      //.on("mouseout", this._onMouseOutEdge.bind(this))
      .attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; })
      .style("stroke", "#9ecae1")
      .attr("marker-end", "url(#type)")

    // Remove old links.
    this.edges.exit().remove();

    // Update the nodes
    this.nodes = this.vis.selectAll(".node")
      .data(this.itemman.items, function(d){ return d.id; })

    //TODO add transition for adding nodes
    // Add new nodes
    var g = this.nodes.enter().append("g")
      .attr("class", 'node')
      .attr("id", function(d){return d.id})
      .on("click", this._onClickNode.bind(this))
      .on("mousedown", this._onMouseDown.bind(this))
      .on("mousemove", this._onMouseMove.bind(this))
      .on("contextmenu", this._onRightClickNode.bind(this))
      .on("mouseup", this._onMouseUp.bind(this))
      .on("mouseover", this._onMouseOver.bind(this))
      .on("mouseout", this._onMouseOut.bind(this))
      .call(this.drag)
    g.append("circle")
      .attr("r", function(d){ return d.out ? 15 : self.p.graph.nodeRadius })
      .style("fill", "#fff")
      .style("stroke", function(d){return d.out().isEmpty() ? "#aaf" : "#faa"})
      .style(":hover", "opacity: 0.5")
    g.append("image")
      .attr("xlink:href", function(d){ return d.icon})
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16)
    var stateGroup = g.append("g", function(d){debugger;})
    stateGroup.append("image")
      .attr("xlink:href", function(d){ return d.fixed ? '/client/image/pin.ico' : '/client/image/no.ico'})
      .attr("x", 5)
      .attr("y", -15)
      .attr("width", 10)
      .attr("height", 12)
    //Text should be on top
    g.append("text")
      .attr("dx", 10)
      .attr("dy", "10pt")
      .text(function(d){ return d.label || d.id});

    // Remove old nodes
    this.nodes.exit()
      .transition()
        .duration(750)
        .attr("y", 60)
        .style("fill-opacity", 1e-6)
      .remove()
  },

  _onContextChanged : function(e){
    this.itemman.select(e.memo);
  },

  _onSelectionChanged : function(e){
    this.itemman.select(e.memo)
  },

  // Update visual node on graph
  _onItem : function(e){
    var item = e.memo
    if (this.itemman.isShown(item)){
      //TODO remove only updated nodes
      this.nodes.remove();
      this.itemman.show(item)
    }
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
      .attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; });
  },

  _onClickNode : function(item){
    d3.event.stopPropagation()
    if (d3.event.ctrlKey) this.itemman.hide(item)
    if (d3.event.ctrlKey && d3.event.shiftKey) this.itemman.remove(item)
    // Load on click
    this.itemman.toggle(item);
  },

  // Show search string
  _onClickBase : function(){
    var point = d3.event
    var coords = d3.mouse(this.element);
    this.search.show(point, {x: coords[0], y: coords[1]})
  },

  _onDblClickBase : function(){
  },

  _onMouseDown : function(item){
    // if selection changed by other view do not fire own event
    if (this.itemman.select(item)) document.fire('app:context_changed', item);
  },

  _onMouseMove : function(item){
  },

  _onMouseOut : function(item){
    delete this.hover
    d3.select('#'+item.id+' circle').style('stroke-width', 1)
    d3.select('#'+item.id+' text').style('font-weight', 'normal')
    if (item.tempFix){
      item.fixed = false
      delete item.tempFix
    }
  },

  _onMouseOver : function(item){
    this.hover = item
    if (!item.fixed){
      item.tempFix = true
      item.fixed = true
    }
    d3.select('#'+item.id+' circle').style('stroke-width', 2)
    d3.select('#'+item.id+' text').style('font-weight', 'bold')
  },

  _onMouseUp : function(item){
  },

  _onDragstart : function(d){
    // auto positioning is off while dragging
    this.force.stop()
  },

  _onDragmove : function(d){
    //TODO do once
    var node = d3.select('#'+d.id)
    node.attr('pointer-events', 'none')
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy; 
    this._onTick(); // this is the key to make it work together with updating both px,py,x,y on d !
  },

  _onDragend : function(item){
    if (!item.changed) item.changed = true
    if (this.hover && item != this.hover){
      var link = item.link(this.hover)
      this.linkman.show(item, link)
      console.log(item.name + ' -> '+this.hover.name);
      //TODO dragged item should be put to drag start position if link created?
      item.fixed = false
      this.update()
    }
    this.itemman.fix(item)
    this._onTick();
    this.force.resume();
    var node = d3.select('#' + item.id)
    node.attr('pointer-events', 'all')
  },

  _onRightClickNode : function(item){
    d3.event.stopPropagation()
    var point = d3.event
    this.contextMenu.show(point, item)
  },

  _onRightClickBase : function(){
    var point = d3.event
    this.contextMenu.show(point)
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
  }
})
