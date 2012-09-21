require('driver');

/**
 * Contacts Provider
 */
Class.create('ProviderVCard', Provider, {
		
	initialize : function(){
    this.driver = new DriverVCard();
	},

  /**
   * @param type String source of vCard
   */
  get : function(cb, path, type){
    // The only one type supported currently
    type = 'skype';
    var contacts = this.driver.readFile(path);
    cb(this[type](contacts));
  },

  skype : function(contacts){
    contacts.forEach(function(card){
      var pairs = {
        "N": "skype"
      , "FN": ""
      , "REV": ""
      , "X-SKYPE-NUMBER-OF-BUDDIES": "buddies"
      , "X-SKYPE-CITY": "city"
      , "X-SKYPE-COUNTRY": "country"
      , "X-SKYPE-LANGUAGE": "language"
      , "ADR": "address"
      , "X-SKYPE-AUTHCERTIFICATE;ENCODING=B": ""
      , "X-SKYPE-SEX": "sex"
      , "X-SKYPE-MOOD": "mood"
      , "X-SKYPE-DISPLAYNAME": ""
      , "X-SKYPE-USERNAME": ""
      }

      card.name = card["X-SKYPE-DISPLAYNAME"] || card["FN"] || card["N"];
      if (card["PHOTO"]) card.photo = true;
      vcf.extractBinary(card, '.');

      $H(card).keys().each(function(key){
        var newKey = pairs.hasOwnProperty(key) ? pairs[key] : key.toLowerCase();
        if (newKey) card[newKey] = card[key];
        if (newKey !== key) delete card[key];
      })
    })
    return contacts;
  }
})
