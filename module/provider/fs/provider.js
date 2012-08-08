/**
 * File System access
 */
Class.create('ProviderFs', Provider, {
		
	initialize : function(){
	},
	
  download : function(selection){
    if(selection.isUnique()){
      if(is_dir(this.urlBase.$selection.getUniqueFile())){
        $zip = true;
      }else{
        if(!file_exists(selection)){
          throw new Exception("Cannot find file!");
        }
      }
    }
    fs.readFile();
  },

  stat : function(){
  },
			
  get : function(fileName){
    fs.readFile();
  },
			
  put: function(fileName){},

  upload : function(){},
  
  // get item of type 'dir'
  ls : function(path){},
	
  // put item with new path attr
	move : function(oldPath, newPath){},

  // put item of type 'file'
  mkfile : function(name){},

  // put item of type 'dir'
	mkDir : function(path, name){},
	
  // put item with id and null content
	remove : function(selectedFiles, logMessages){},
	
  // get item and put it without id
	copy : function(name, dest){},
	
	isWriteable : function(dir){
		return is_writable($dir);
	}
})
