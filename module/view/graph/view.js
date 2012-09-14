Class.create("ViewGraph", View, {

  render : function(p){
    var self = this;
    this.p = Object.extend(this.p, p);
    this.p.chargeBase = p.chargeBase || -200;
    this.p.chargeK = p.chargeK || -10;

    var control = Ext.create('Ext.panel.Panel', this.p);
    this.extControls.push(control);

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d._children ? d.children.length * self.p.chargeK : self.p.chargeBase; })
      .linkDistance(function(d){ return d.target._children ? 150 : 75; })
      .size([this.p.width, this.p.height]);

    this.vis = d3.select("#desktop").append("svg")
      .attr("width", this.p.width)
      .attr("height", this.p.height);

    d3.json("/client/tree.json", function(json){
      self.root = json;
      self.root.fixed = true;
      self.root.x = self.p.width / 2;
      self.root.y = self.p.height / 2;
      self.update();
    });
  },

  update : function(){
    var nodes = this.flatten(this.root),
        links = d3.layout.tree().links(nodes);

    // Restart the force layout.
    this.force
      .gravity(0)     //no gravity to center
      .nodes(nodes)
      .links(links)
      .start();

    // Update the links…
    this.link = this.vis.selectAll("line.link")
      .data(links, function(d){ return d.target.id; });

    // Enter any new links.
    this.link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; })
      .attr("style", "stroke: #9ecae1");

    // Exit any old links.
    this.link.exit().remove();

    // Update the nodes…
    this.node = this.vis.selectAll(".node")
      .data(nodes, function(d){ return d.id; })

    // Enter any new nodes.
    g = this.node.enter().append("g")
      .attr("class", "node")
      .on("click", this._onClick)
      .on("mouseup", this._fix)
      .call(this.force.drag)
    g.append("circle")
      .attr("r", function(d) { return d.children ? 15 : 10; })
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
    this.node.exit().remove();
  },

  _onTick : function(e){
    this.link.attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; });

    this.node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  },

  // Toggle children on click.
  _onClick : function(d){
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
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
