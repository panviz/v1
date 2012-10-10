Class.create("LinkMan", {
   
  all: {},
  links: [],

  format : function(item, link){
    if (link.direction == 'out'){
      return {source: item, target: $app.items.get(link.to)}
    } else{
      return {target: item, source: $app.items.get(link.to)}
    }
  },

  show : function(item, links){
    var self = this
    links.map(function(link){
      var saved = self.all[link.id]
      if (!saved){
        saved = self.all[link.id] = self.format(item, link)
      }
      if (!self.links.include(saved)) self.links.push(saved)
    })
  },

  hide : function(links){
    var self = this
    links.map(function(link){
      var saved = self.all[link.id]
      self.links = self.links.without(saved)
    })
  }
})

