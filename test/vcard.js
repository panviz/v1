var assert = require("assert");
var wrench = require('wrench');
fs = require('fs');
require(__dirname + '/../app/lib/prototypeJS/prototype');

require('../module/provider/vcard/driver')
describe('vCard', function(){
  var driver = new DriverVCard();
  var img = './photo/TestRecord.jpeg'
  var vcard = __dirname + '/data/vcard.vcf'

  after(function(){
    wrench.rmdirSyncRecursive('./photo');
  });

  it('should extract image', function(){
    var json = driver.readFile(vcard);
    json.forEach(function(card){
      driver.extractBinary(card);
    })
    assert(fs.existsSync(img))
  })

  it('should set name', function(){
    var json = driver.readFile(vcard);
    assert.equal(json[0].TEL.value, "+381234567890")
  })
})
