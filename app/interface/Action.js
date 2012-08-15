/**
 * Description : Action interface
 */
Interface.create("Action", {
  execute : function(){}

//@returns Boolean if Action is in enabled state
, isEnabled : function(){}

//execute will be performed
, enable : function(){}

//execute will throw Exception
, disable : function(){}

//@returns Boolean if Action is undo capable
, canUndo : function(){}

//Implement if possible
//, undo : function(){}

//, addDependency(command)

//@param reciever Object on which to execute the command
//, setValue : function(reciever){}

//@returns reciever
//, getValue : function(){}
});
