Class.create("ViewGraph", View, {
  // visible items
  items: [],
  // visible nodes
  nodes: [],
  // visible item links
  links: [],
  // visible node edges
  edges: [],
  //centered current item
  root: {},

  initialize : function($super, p){
    $super();
    var self = this;
    this.p = Object.extend(this.p, p);
    this.p.chargeBase = p.chargeBase || -200;
    this.p.chargeK = p.chargeK || -10;

    var control = Ext.create('Ext.panel.Panel', this.p);
    this.extControls.push(control);

    this.force = d3.layout.force()
      .on("tick", this._onTick.bind(this))
      .charge(function(d){ return d.children ? d.children.length * self.p.chargeK : self.p.chargeBase; })
      .linkDistance(function(d){ return d.target._children ? 150 : 75; })

    this.vis = d3.select("#desktop").append("svg");

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

  update : function(){
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
      .attr("style", "stroke: #9ecae1");

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
    this.nodes.exit().remove();
  },

  // Move nodes and lines on layout recalculation
  _onTick : function(e){
    this.edges.attr("x1", function(d){ return d.source.x; })
      .attr("y1", function(d){ return d.source.y; })
      .attr("x2", function(d){ return d.target.x; })
      .attr("y2", function(d){ return d.target.y; });

    this.nodes.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; });
  },

  // TODO nodes should have links to its lines (to delete lines by index, not full search)
  // Toggle children visibility on click
  _onClick : function(d){
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
      //this.links = 
      //TODO add/remove links
    }
    this.items = this.items.compact();
    this.links = this.links.compact();
    this.update();
  },

  _onResize : function(control, width, height){
    this.p.width = width;
    this.p.height = height;
    this.force.size([width, height]);
    this.vis.attr("width", this.p.width)
            .attr("height", this.p.height);
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
