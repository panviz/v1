var Functional = {}
/*
 * Non tail recursion
 * @var children String name of Array container for elements inside
 * @var condition function decide wheather to process item
 * should return Boolean
 * @var process function to execute on item
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
