/**
 * Stores Items in Browser
 */
Class.create("StoreClient", Store, {

  initialize : function($super){
    $super();
    if (!localStorage.s) localStorage.s = "{}";
    this._local = JSON.parse(localStorage.s);
    this._store = window.localStorage.s;
  },
  /**
   * Browser localStorage can save String only
   */
  save : function($super, onSave, type, name, diff){
    $super(onSave, type, name, diff);
    // TODO remove after debug
    this._local.module = [];
    localStorage.s = JSON.stringify(this._local);
  },
  /**
   *  @param Hash first to compare
   *  @param Hash second to compare
   *  @returns Object without properties shared with callee
   * or false if no difference
   */
  _diff : function(first, second){
    var result = {};
    var diff = false;
    // Links are the same by ID
    var compareLinks = function(a,b){return a.id == b.id}

    second.keys().forEach(function(key){
      var before = first.get(key)
      var after = second.get(key)
      if (before != after){
        if (Object.isArray(before) && Object.isArray(after)){
          result[key] = after.diff(before, compareLinks)
        } else {
          result[key] = after
        }
        diff = true;
      }
    })
    if (!diff) result = false;
    return result;
  },
  /**
   * @param Hash first
   * @param Json diff
   */
  _update : function(first, diff){
    $H(diff).keys().forEach(function(key){
      var before = first.get(key)
      var after = diff[key]
      if (before != after){
        if (Object.isArray(before) && Object.isArray(after)){
          first.set(key, before.diffMerge(after))
        } else {
          first.set(key, after)
        }
      }
    })
    return first
  }
})
