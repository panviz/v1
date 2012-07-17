var Functional = Functional || {}

/*
 * Linear recursion
 */
Functional.linearRecursion = function(condition, then, before, after){
  var condition   = condition.lambda()
    , then   = then.lambda()
    , before = before.lambda()
    , after  = after.lambda();
  return function(){
    if(condition(arguments[0])){
        return then(arguments[0]);
    }
    var args = before(arguments[0]);
    var result  = arguments.callee(args);
    return after(result, arguments[0]);
  };
};

/*
 * Self call is the last operation
 */
Functional.tailLinearRecursion = function(condition, then, before, after){
  var condition   = condition.lambda()
    , then   = then.lambda()
    , before = before.lambda()
    //, after  = after.lambda();
  return function(){
    var args = arguments;
    if(condition(args)){
        return then(args);
    }
    var args = before(args);
    return arguments.callee(args);
  };
};

/*
 * Tail recursion replacement with "for" loop
 */
Functional.loop = function(condition, then, before, after){
  var condition   = condition.lambda()
    , then   = then.lambda()
    , before = before.lambda()
    //, after  = after.lambda();
  return function(){
    var args = arguments[0];
    while(!condition(args)){
      args = before(args);
    }
    return then(args);
  };
};

/*
 * Parallel recursion
 * Same as linear but for nodes which can be an array (former tree)
 */
Functional.treeRecursion = function(condition, then, before, after){
  var condition   = condition.lambda()
    , then   = then.lambda()
    , before = before.lambda()
    , after  = after.lambda();
  return function(){
    debugger
    if(condition(arguments[0])){
        return then(arguments[0]);
    }
    var args = before(arguments[0])
      , result  = new Array(args.length);
    for(var i = 0; i < args.length; ++i){
        result[i] = arguments.callee(args[i]);
    }
    return after(result, arguments[0]);
  };
};

/*
 * Parallel recursion without lambdas
 *
 * @param children String name of Array container for elements inside
 * @function condition function decide wheather to process item
 * should return Boolean
 * @function process function to execute on item
 * should return item
 * @returns changed tree
 */
Functional.processTree = function(children, condition, process){
  return function(item){
    var items = item[children];
    if(items){
      for(var i = 0; i < items.length; i++){
        items[i] = arguments.callee(items[i]);
      }
    }
    if (condition(item)){
      return process(item);
    }else{
      return(item)
    }
  };
};
