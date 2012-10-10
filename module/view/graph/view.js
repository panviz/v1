Class.create("ViewGraph", View, {
  
  nodes: [],    // svg nodes for visible items
  edges: [],    // svg lines for visible links
  root: {},     // centered item

  initialize : function($super, options){
    $super(options);
    var self = this;
    this.linkman = new LinkMan(this)
    this.itemman = new ItemMan(this)
    var p = this.p;
    this.element = $(p.contentEl);

    var control = Ext.create('Ext.panel.Panel', p);
    this.extControls.push(control);

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d.out ? d.out.length * self.p.graph.chargeK : self.p.graph.chargeBase; })
      .linkDistance(function(d){ return d.target._children ? 150 : 75; })

    this.vis = d3.select("#"+p.contentEl).append("svg");
    d3.select('#desktop').on("click", function(){self._onClickBase()})
    this.vis.append("svg:defs")
      .append("svg:marker")
        .attr("id", 'type')
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    control.on('resize', this._onResize.bind(this));
    document.observe("app:selection_changed", this._onSelectionChanged.bind(this));
    document.observe("item:updated", this._onItem.bind(this));
    if ($user) this.itemman.select($user);
  },

  // update graph accordingly to registries of items and links
  update : function(){
    var self = this;
    // Restart the force layout.
    this.force
      .gravity(0)     //no gravity to center
      .nodes(this.itemman.items)
      .links(this.linkman.links)
      .start();

    // Update the links…
    this.edges = this.vis.selectAll("line.link")
      .data(this.linkman.links, function(d){ return d.target.id; });

    // Enter any new links.
    this.edges.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; })
      .attr("style", "stroke: #9ecae1")
      .attr("marker-end", "url(#type)");

    // Exit any old links.
    this.edges.exit().remove();

    // Update the nodes…
    this.nodes = this.vis.selectAll(".node")
      .data(this.itemman.items, function(d){ return d.id; })

    // Enter any new nodes.
    g = this.nodes.enter().append("g")
      .attr("class", "node")
      .on("click", this._onClickNode.bind(this))
      .on("mousedown", this._onMouseDown.bind(this))
      .on("mousemove", function(d){d.changed = true; console.log('CHANGED');})
      .call(this.force.drag)
    g.append("circle")
      .attr("r", function(d) { return d.out ? 15 : self.p.graph.nodeRadius; })
      .style("fill", this._color)
    g.append("image")
      .attr("xlink:href", "http://dmitra.com/favicon.ico")
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16);
    // Text should be on top
    g.append("text")
      .attr("dx", 10)
      .attr("dy", "10pt")
      .text(function(d){ return d.label || d.id});

    // Exit any old nodes.
    this.nodes.exit().remove();
  },

  _onContextChanged : function(e){
    this.itemman.select(e.memo);
  },

  _onSelectionChanged : function(e){
    this.itemman.select(e.memo)
  },

  // Color leaf nodes orange, and packages white or blue.
  _color : function(d){
    return d._children ? "#3182bd" : d.out ?  "#fd8d3c" : "#c6dbef";
  },

  // Update visual node on graph
  _onItem : function(e){
    var item = e.memo
    if (this.itemman.isShown(item)){
      this.itemman.show(item)
      //TODO remove only updated nodes
      this.nodes.remove();
      this.update();
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

  // Load on click
  _onClickNode : function(item){
    d3.event.stopPropagation()
    this.itemman.toggle(item);
  },

  _onClickBase : function(){
    var point = d3.mouse(this.element);
    this.itemman.add(point)
  },

  _onMouseDown : function(item){
    // if selection changed by other view do not fire own event
    if (this.itemman.select(item)) document.fire('app:context_changed', item);
  },

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
