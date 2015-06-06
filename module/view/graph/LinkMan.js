Class.create("ViewGraphLinkMan", {
   
  // All created links
  all: {},
  // Shown links
  links: [],

  /**
   * Show all or specified links of Item
   * @param Item item source of the links
   * @param {Link|Link[]} [links]
   */
  show : function(item, links){
    var self = this
    if (!links) links = item.links()
    if (!Object.isArray(links)) links = [links]
    links.map(function(link){
      var saved
      if (link.id) saved = self.all[link.id]
      if (!saved){
        saved = self.all[link.id] = self._format(item, link)
      }
      if (!self.links.include(saved)) self.links.push(saved)
    })
  },
  /**
   * Hide all or specified links of Item
   * @param {Link[]|Item} linksOrItem
   */
  hide : function(linksOrItem){
    var self = this
    if (linksOrItem.man && linksOrItem.man == 'item'){
      var itemId = linksOrItem.id
      this.links = this.links.filter(function(link){ return link.source.id != itemId})
    } else {
      var links = Object.isArray(linksOrItem) ? linksOrItem : [linksOrItem]
      links.map(function(link){
        var saved = self.all[link.id]
        self.links = self.links.without(saved)
      })
    }
  },

  _format : function(item, link){
    if (link.direction == 'out'){
      return {source: item, target: $app.items.get(link.target)}
    } else{
      return {target: item, source: $app.items.get(link.target)}
    }
  }
})
