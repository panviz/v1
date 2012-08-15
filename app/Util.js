/**
 * Singleton class to be in Global scope
 */
Class.create("Util", {

  initialize : function(){
    if (isServer){
      this.fs = require('fs'),
      this.Path = require('path');
    }
  },

  /* @server
   * Require Json file or all files in dir
   * @returns Json key - filename, value - Json Object
   */
  requireAll : function(path){
    var result = {};
    if (isServer){
      var names = this.fs.readdirSync(path);
      names.forEach(function(name){
        var item = path+'/'+name;
        if (this.fs.statSync(item).isFile()){
          var ns = name.split('.');
          var key = ns[0];
          var extension = ns.without(key)[ns.length-1];
          key = ns.without(extension).join('.');
          result[key] = require(item);
        } else {
          result[key] = $util.requireAll(item);
        }
      })
      return result;
    }
  },

  include_tag : function(file){
    return this.insertFile(file, '<script language="javascript" type="text/javascript" src="%path%"></script>');
  },

  link_tag : function(file){
    return this.insertFile(file, '<link rel="stylesheet" type="text/css" href="%path%">');
  },

  //translations
  //TODO add %s substitution
  t: function(message){
     if (settings.currentLanguage == 'en'){
       return message;
     } else {
       settings.i18n[settings.currentLanguage][message];
     }
  },

  // @server
  insertFile : function(path, code){
    if (path.indexOf('list') != -1){
      var list = this.loadList(path);
      for (var i = 0; i < list.length; i++){
        list[i] = code.replace('%path%', list[i]);
      }
    }
    return list.join('\n');
  },

  /* @server
   * TODO use global root variable for path
   */
  loadList : function(path){
    var filepath = ROOT_PATH + path;
    var list = [];
    var resultList = [];
    if (!this.Path.existsSync(filepath)){
      filepath = ROOT_PATH + '/app' + path;
    };
    if (this.Path.existsSync(filepath)){
      list = this.fs.readFileSync(filepath, 'binary').split('\n');
    }
    list.forEach(function(name) {
      if (!name) return;
      //if list.txt is not in /config, it has paths relative to its path
      name = name.replace('\r', '');
      if (path.indexOf('config') == -1){
        name = this.Path.dirname(path) + '/' + name;
      } else{
        name = '/app/' + name;
      }
      resultList.push(name+'.js');
    })
    return resultList;
  },

  resolveImageSource : function(src, defaultPath, size){
    if(!src) return "";
    if(!window.ImageLibraries || src.indexOf("/")==-1){
      return THEME.path + (defaultPath?(size?defaultPath.replace("ICON_SIZE", size): defaultPath): '')+ '/' +  src;
    }
    var radic = src.substring(0,src.indexOf("/"));
    if(window.ImageLibraries[radic]){
      var src = src.replace(radic, window.ImageLibraries[radic]);
          if(bootstrap.p.get("SERVER_PREFIX_URI")){
              src = bootstrap.p.get("SERVER_PREFIX_URI") + src;
          }
      return (size ? src.replace("ICON_SIZE", size) : src);
    }else{
      return THEME.path + (defaultPath ? (size ? defaultPath.replace("ICON_SIZE", size) : defaultPath) : '')+ '/' +  src;
    }
  },

  roundSize : function(filesize, size_unit){
    if (filesize >= 1073741824) {filesize = Math.round(filesize / 1073741824 * 100) / 100 + " G"+size_unit;}
    else if (filesize >= 1048576) {filesize = Math.round(filesize / 1048576 * 100) / 100 + " M"+size_unit;}
    else if (filesize >= 1024) {filesize = Math.round(filesize / 1024 * 100) / 100 + " K"+size_unit;}
    else {filesize = filesize + " "+size_unit;}
    return filesize;
  },

  formatDate : function(dateObject, format){
    if(!format) format = I18N["date_format"];
    format = format.replace("d", (dateObject.getDate()<10 ? '0'+dateObject.getDate() : dateObject.getDate()));
    format = format.replace("D", dateObject.getDay());
    format = format.replace("Y", dateObject.getFullYear());
    format = format.replace("y", dateObject.getYear());
    var month = dateObject.getMonth() + 1;
    format = format.replace("m", (month<10 ? '0'+month: month));
    format = format.replace("H", (dateObject.getHours()<10 ? '0' : '')+dateObject.getHours());
    // Support 12 hour format compatibility
    format = format.replace("h", (dateObject.getHours() % 12 || 12));
    format = format.replace("p", (dateObject.getHours() < 12 ? "am" : "pm"));
    format = format.replace("P", (dateObject.getHours() < 12 ? "AM" : "PM")); 
    format = format.replace("i", (dateObject.getMinutes()<10 ? '0' : '')+dateObject.getMinutes());
    format = format.replace("s", (dateObject.getSeconds()<10 ? '0' : '')+dateObject.getSeconds());
    return format;
  },

  parseUrl : function(data){
    var matches = $A();
      //var e=/((http|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+\.[^#?\s]+)(#[\w\-]+)?/;
      var detect=/(((\w+)):\/)?\/?([^:\/\s]+)((\/\w+)*\/)(.*)(#[\w\-]+)?/g;
      var results = data.match(detect);
      if(results && results.length){
        var e=/^((.(\w+)):\/)?\/?([^:\/\s]+)((\/\w+)*\/)(.*)(#[\w\-]+)?$/;
        for(var i=0;i<results.length;i++){
          if(results[i].match(e)){
              matches.push({url: RegExp['$&'],
                      protocol: RegExp.$2,
                      host: RegExp.$4,
                      path: RegExp.$5,
                      file: RegExp.$7,
                      hash: RegExp.$8});    
          }
        }
      }
      return  matches;
  },

  storeRememberData : function(user, pass){
    this.setCookie('remember', {user: user,pass: pass});
  },

  retrieveRememberData : function(){
    return this.getCookie('remember');
  },

  clearRememberData : function(){
    this.deleteCookie('remember');
  },

  setCookie : function(name, value){
    var cookieJar = new CookieJar({
      expires: 3600*24*10,
      path: '/',
      secure: true
    });
    cookieJar.put(name, value); 
  },

  getCookie : function(name){
    var cookieJar = new CookieJar({path: '/',secure: true});
    return cookieJar.get(name); 
  },

  deleteCookie : function(name){
    var cookieJar = new CookieJar({path: '/',secure: true});
    cookieJar.remove(name); 
  },

  disableTextSelection : function(target){
    if(!target) return;
    if (typeof target.onselectstart!="undefined")
    { //IE route
      target.onselectstart=function(){return false;};
    }
    else if (target.style && typeof target.style.MozUserSelect!="undefined")
    { //Firefox route
      var defaultValue = target.style.MozUserSelect;
      target.style.MozUserSelect="none";
      $(target).addClassName("no_select_bg");
    }
    $(target).addClassName("no_select_bg");
    if($(target).getElementsBySelector('input[type="text"]').length)
    {
      $(target).getElementsBySelector('input[type="text"]').each(function(element)
      {
        if (typeof element.onselectstart!="undefined")
        { //IE route        
          element.onselectstart=function(){return true;};
        }
        else if (typeof element.style.MozUserSelect!="undefined")
        { //Firefox route
          element.style.MozUserSelect=defaultValue;
        }
      });
    }
  },

  enableTextSelection : function(element){
      if (typeof element.onselectstart!="undefined")
      { //IE route
          element.onselectstart=function(){return true;};
      }
      else if (typeof element.style.MozUserSelect!="undefined")
      { //Firefox route
          element.style.MozUserSelect="text";
      }
  },

  testStringWidth : function(text){
    if(!$('string_tester')){
      $$('body')[0].insert(new Element('div',{id: 'string_tester'}));
      $('string_tester').setStyle({fontFamily: 'Trebuchet MS',fontSize: '11px',position: 'absolute',visibility: 'hidden',height: 'auto',width: 'auto',whiteSpace: 'nowrap'});
    }
    $('string_tester').update(text);
    return $('string_tester').getWidth() + (Prototype.Browser.IE ? 20 : 0);
  },

  fitRectangleToDimension : function(rectDim, targetDim){
      var defaultMarginTop = (targetDim.marginTop ? targetDim.marginTop : (targetDim.margin ? targetDim.margin : 0));
      var defaultMarginBottom = (targetDim.marginBottom ? targetDim.marginBottom : (targetDim.margin ? targetDim.margin : 0));
    //var defaultMargin = targetDim.margin || 0;
    if(rectDim.width >= rectDim.height)
    {       
      tW = targetDim.width;
      tH = parseInt(rectDim.height / rectDim.width * tW);
      if(targetDim.maxHeight && tH > targetDim.maxHeight){
        tH = targetDim.maxHeight;
        tW = parseInt(rectDim.width / rectDim.height * tH);
        mT = defaultMarginTop;
              mB = defaultMarginBottom;
      }else{
        mT = parseInt((tW - tH)/2) + defaultMarginTop;
        mB = tW+(defaultMarginTop + defaultMarginBottom)-tH-mT-1;
      }
    }
    else
    {
      tH = targetDim.height;
      if(targetDim.maxHeight) tH = Math.min(targetDim.maxHeight, tH);
      tW = parseInt(rectDim.width / rectDim.height * tH);
          mT = defaultMarginTop;
          mB = defaultMarginBottom;
    }
    return styleObj = {width: tW+'px', height: tH+'px', marginTop: mT+'px', marginBottom: mB+'px'}; 
  },

  fitHeightToBottom : function(element, parentElement, addMarginBottom, listen){
    element = $(element);
    if(!element) return;
    if(typeof(parentElement) == "undefined" || parentElement == null){
      parentElement = Position.offsetParent($(element));
    }else{
      parentElement = $(parentElement);
    }
    if(typeof(addMarginBottom) == "undefined" || addMarginBottom == null){
      addMarginBottom = 0;
    }
      
    var observer = function(){  
      if(!element) return;  
      var top =0;
      if(parentElement == window){
        offset = element.cumulativeOffset();
        top = offset.top;
      }else{
        offset1 = parentElement.cumulativeOffset();
        offset2 = element.cumulativeOffset();
        top = offset2.top - offset1.top;
      }
      var wh;
      if(parentElement == window){
        wh = getViewPortHeight();
      }else{
        wh = parentElement.getHeight();
        if(Prototype.Browser.IE && parentElement.getStyle('height')){       
          wh = parseInt(parentElement.getStyle('height'));
        }
      }
      var mrg = parseInt(element.getStyle('marginBottom')) ||0;   
      var brd = parseInt(element.getStyle('borderWidth'))||0;
      var pad = (parseInt((parentElement!=window ? parentElement.getStyle('paddingBottom') : 0))||0);   
      var margin=0;
      if(parentElement!=window){
        margin = parseInt(parentElement.getStyle('borderBottomWidth')||0) + parseInt(parentElement.getStyle('borderTopWidth')||0);
      }
      if(!Prototype.Browser.IE){
        var childPadding = parseInt(element.getStyle('paddingBottom')||0) + parseInt(element.getStyle('paddingTop')||0);
        margin += childPadding;
      }
      if(!margin) margin = 0;
      element.setStyle({height: (Math.max(0,wh-top-mrg-brd-pad-margin-addMarginBottom))+'px'});
      if(element.paneObject && listen){
        element.paneObject.resize();
      }
      element.fire("resize");
    };
    
    observer();
    if(listen){
      Event.observe(window, 'resize', observer);
    }
    return observer;
  },

  getViewPortHeight : function(){
    var wh;
    if( typeof( window.innerHeight ) == 'number' ) {
      //Non-IE
      wh = window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      //IE 6+ in 'standards compliant mode'
      wh = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
      //IE 4 compatible
      wh = document.body.clientHeight;
    }
    return wh;
  },

  /**
   * Track event in Google Analytics
   */
  gaTrackEvent : function(eventCateg, eventName, eventData, eventValue){
    if(window._gaq && window._gaTrackEvents){
      _gaq.push(['_trackEvent', eventCateg, eventName, eventData, eventValue]);
    }
  },

  getDomNodeText : function(node){
    if(!node || !node.nodeType) {
      return null;
    }

    switch(node.nodeType)
    {
      case 1: // NODE_ELEMENT
      var i, a=[], nodes = node.childNodes, length = nodes.length;
      for (i=0; i<length; i++) {
        a[i] = getDomNodeText(nodes[i]);
      };

      return a.join("");

      case 2: // NODE_ATTRIBUTE
      return node.nodeValue;
      break;

      case 3: // NODE_TEXT
      return node.nodeValue;
      break;
    }

    return null;
  },

  base64_encode : function( data ) {
      // http://kevin.vanzonneveld.net
      // +   original by: Tyler Akins (http://rumkin.com)
      // +   improved by: Bayron Guevara
      // +   improved by: Thunder.m
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Pellentesque Malesuada
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // -    depends on: utf8_encode
      // *     example 1: base64_encode('Kevin van Zonneveld');
      // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
   
      // mozilla has this native
      // - but breaks in 2.0.0.12!
      //if (typeof window['atob'] == 'function') {
      //    return atob(data);
      //}
          
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];
   
      if (!data) {
          return data;
      }
   
      data = utf8_encode(data+'');
      
      do { // pack three octets into four hexets
          o1 = data.charCodeAt(i++);
          o2 = data.charCodeAt(i++);
          o3 = data.charCodeAt(i++);
   
          bits = o1<<16 | o2<<8 | o3;
   
          h1 = bits>>18 & 0x3f;
          h2 = bits>>12 & 0x3f;
          h3 = bits>>6 & 0x3f;
          h4 = bits & 0x3f;
   
          // use hexets to index into b64, and append result to encoded string
          tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);
      
      enc = tmp_arr.join('');
      
      switch( data.length % 3 ){
          case 1:
              enc = enc.slice(0, -2) + '==';
          break;
          case 2:
              enc = enc.slice(0, -1) + '=';
          break;
      }
   
      return enc;
  },

  utf8_encode : function(string){
      // http://kevin.vanzonneveld.net
      // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: sowberry
      // +    tweaked by: Jack
      // +   bugfixed by: Onno Marsman
      // +   improved by: Yves Sucaet
      // +   bugfixed by: Onno Marsman
      // *     example 1: utf8_encode('Kevin van Zonneveld');
      // *     returns 1: 'Kevin van Zonneveld'
   
      string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");
   
      var utftext = "";
      var start, end;
      var stringl = 0;
   
      start = end = 0;
      stringl = string.length;
      for (var n = 0; n < stringl; n++) {
          var c1 = string.charCodeAt(n);
          var enc = null;
   
          if (c1 < 128) {
              end++;
          } else if((c1 > 127) && (c1 < 2048)) {
              enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
          } else {
              enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
          }
          if (enc != null) {
              if (end > start) {
                  utftext += string.substring(start, end);
              }
              utftext += enc;
              start = end = n+1;
          }
      }
   
      if (end > start) {
          utftext += string.substring(start, string.length);
      }
   
      return utftext;
  },

  scrollByTouch : function(event, direction, targetId){
    var touchData = event.changedTouches[0];
    var type = event.type;
    if(!$(touchData.target) || ! $(touchData.target).up ) return;
    var target = $(touchData.target).up('#'+targetId);
    if(!target) return;
    if(direction != "both"){
      if(direction == "vertical"){
        var eventPropName = "clientY";
        var targetPropName = "scrollTop";
      }else{
        var eventPropName = "clientX";
        var targetPropName = "scrollLeft";          
      }
      
      if(type == "touchstart"){
        target.originalTouchPos = touchData[eventPropName];
        target.originalScroll = target[targetPropName];
      }else if(type == "touchend"){
        if(target.originalTouchPos){
          event.preventDefault();
        }
        target.originalTouchPos = null;
        target.originalScroll = null;
      }else if(type == "touchmove"){
        event.preventDefault();
        if(!target.originalTouchPos == null) return;
        var delta = touchData[eventPropName] - target.originalTouchPos;
        target[targetPropName] = target.originalScroll - delta;
      }
    }else{
      if(type == "touchstart"){
        target.originalTouchPosY = touchData["clientY"];
        target.originalScrollTop = target["scrollTop"];
        target.originalTouchPosX = touchData["clientX"];
        target.originalScrollLeft = target["scrollLeft"];
      }else if(type == "touchend"){
        if(target.originalTouchPosY){
          event.preventDefault();
        }
        target.originalTouchPosY = null;
        target.originalScrollTop = null;
        target.originalTouchPosX = null;
        target.originalScrollLeft = null;
      }else if(type == "touchmove"){
        event.preventDefault();
        if(!target.originalTouchPosY == null) return;
        var delta = touchData["clientY"] - target.originalTouchPosY;
        target["scrollTop"] = target.originalScrollTop - delta;
        var delta = touchData["clientX"] - target.originalTouchPosX;
        target["scrollLeft"] = target.originalScrollLeft - delta;
      }
    }
  },

  attachMobileScroll : function(targetId, direction){
    if(!window.mobile) return;
    if(typeof (targetId) == "string"){
      var target = $(targetId);
    }else{
      var target = targetId;
      targetId = target.id;
    }
    if(!target) return;
    target.addEventListener("touchmove", function(event){ scrollByTouch(event, direction, targetId); });
    target.addEventListener("touchstart", function(event){ scrollByTouch(event, direction, targetId); });
    target.addEventListener("touchend", function(event){ scrollByTouch(event, direction, targetId); });
  },
  /**
   */
  loaderXTemplateRenderer: function(loader, response, active) {
    var tpl = new Ext.XTemplate(response.responseText);
    var targetComponent = loader.getTarget();
    targetComponent.update( tpl.apply(targetComponent.data) );
    return true;
  }
})
