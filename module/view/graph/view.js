Class.create("ViewGraph", View, {
  
  items: [],    // visible items
  nodes: [],    // visible nodes
  links: [],    // visible item links
  edges: [],    // visible node edges
  root: {},     //centered current item

  initialize : function($super, options){
    $super(options);
    var self = this;
    var p = this.p;
    this.element = $(p.contentEl);

    var control = Ext.create('Ext.panel.Panel', p);
    this.extControls.push(control);

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d.children ? d.children.length * self.p.graph.chargeK : self.p.graph.chargeBase; })
      .linkDistance(function(d){ return d.target._children ? 150 : 75; })

    this.vis = d3.select("#"+p.contentEl).append("svg");
    d3.select('#desktop').on("click", function(d){self.add(d)})
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
    document.observe("app:context_changed", this.setRoot.bind(this));
    if ($user) this.setRoot({memo: $user});
  },

  setRoot : function(e){
    if (this.root.name == e.memo.name) return
    this.root.fixed = false;
    var root = this.root = e.memo;
    root.fixed = true;
    root.x = this.p.width / 2;
    root.y = this.p.height / 2;
    this.items = this.flatten(root);
    this.links = d3.layout.tree().links(this.items);

    this.update();
  },

  add : function(d){
    var point = d3.mouse(this.element);
    this.items.push({name: 'new Node', fixed: true, x: point[0], y: point[1]})
    this.update()
  },

  update : function(){
    var self = this;
    // Restart the force layout.
    this.force
      .gravity(0)     //no gravity to center
      .nodes(this.items)
      .links(this.links)
      .start();

    // Update the links…
    this.edges = this.vis.selectAll("line.link")
      .data(this.links, function(d){ return d.target.id; });

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
      .data(this.items, function(d){ return d.id; })

    // Enter any new nodes.
    g = this.nodes.enter().append("g")
      .attr("class", "node")
      .on("click", this._onClick.bind(this))
      .on("mouseup", this._fix)
      .call(this.force.drag)
    g.append("circle")
      .attr("r", function(d) { return d.children ? 15 : self.p.graph.nodeRadius; })
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
      .text(function(d){ return d.name });

    // Exit any old nodes.
    this.nodes.exit().remove();
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

  // TODO nodes should have links to its lines (to delete lines by index, not full search)
  // Toggle children visibility on click
  _onClick : function(d){
    d3.event.stopPropagation()
    var self = this;
    if (d.children) {
      d.children.each(function(item){
        if (item.index >= 0){
          delete self.items[item.index];
          delete item.index;
          self.links.each(function(link, index){
            if (link.source == item || link.target == item) delete self.links[index]
          })
        } else {
          self.items.push(item);
          self.links.push({source: d, target: item})
        }
      })
    }
    this.items = this.items.compact();
    this.links = this.links.compact();
    this.update();
  },

  _onResize : function(control, width, height){
    var p = this.p;
    p.width = width;
    p.height = height;
    this.force.size([width, height]);
    this.vis.attr("width", p.width)
            .attr("height", p.height);
    this.update();
  },

  // Color leaf nodes orange, and packages white or blue.
  _color : function(d){
    return d._children ? "#3182bd" : d.children ?  "#fd8d3c" : "#c6dbef";
  },

  _fix : function(d, i){
    d.fixed = true;
  },

  // TODO use library func for Tree flattening
  // Returns a list of all nodes under the root.
  flatten : function(root){
    var nodes = [], i = 0;

    function recurse(node){
      if (node.children) node.size = node.children.reduce(function(p, v){ return p + recurse(v); }, 0);
      if (!node.id) node.id = ++i;
      nodes.push(node);
      return node.size;
    }

    root.size = recurse(root);
    return nodes;
  }
})
