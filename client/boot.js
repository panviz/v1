ROOT_PATH = '/';
isServer = false;
function require(filename){
  return {};
}

$util = new Util();

Event.observe(document, 'dom:loaded', function(){
  //START_URL - Global constant passed from server in html
  $proxy = new Proxy($set);

  // Proxy should be ready to answer subscribers started in Application
  document.observe("proxy:connected", function(){
    //TODO rename to $app
    app = new Application();
  })
})
