Class.create("ViewGraphLinkMan", {
   
  // All created links
  all: {},
  // Shown links
  links: [],

  format : function(item, link){
    if (link.direction == 'out'){
      return {source: item, target: $app.items.get(link.target)}
    } else{
      return {target: item, source: $app.items.get(link.target)}
    }
  },
  /**
   * @param Item item source of the links
   * @param {Link|Link[]} links
   */
  show : function(item, links){
    var self = this
    if (!Object.isArray(links)) links = [links]
    links.map(function(link){
      var saved = self.all[link.id]
      if (!saved){
        saved = self.all[link.id] = self.format(item, link)
      }
      if (!self.links.include(saved)) self.links.push(saved)
    })
  },
  /**
   * @param Link[] links
   */
  hide : function(links){
    var self = this
    links.map(function(link){
      var saved = self.all[link.id]
      self.links = self.links.without(saved)
    })
  }
})

