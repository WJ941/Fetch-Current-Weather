function Router() {
  this.routes = {};
  this.currentUrl = '';
}
Router.prototype.route = function(path, callback) {
  this.routes[path] = callback || function(){};
};
Router.prototype.refresh = function() {
  this.currentUrl = location.hash.slice(1) || '/';
  this.routes[this.currentUrl]();
};
Router.prototype.init = function() {
  window.addEventListener('load', this.refresh.bind(this), false);
  window.addEventListener('hashchange', this.refresh.bind(this), false);
}
window.Router = new Router();
window.Router.init();
Router.route('/', function() {
  // changeBgColor('white');
  log('index')
  // index()
  _main()
});
Router.route('/findmycity', async function() {
  observer(model.allCitys)
  var citys = await getCity('中国')
  log('findmycity', citys)
  model.allCitys.data.citys = citys
});
async function getCity(dis) {
  var key = 'e333ca7a1fa1ff21aaa482010edcba5b'
  var url = `https://restapi.amap.com/v3/config/district?keywords=${dis}&subdistrict=1&key=${key}&extensions=base`
  var res = await AjaxGet(url)
  res = JSON.parse(res).districts[0].districts
  return res
}