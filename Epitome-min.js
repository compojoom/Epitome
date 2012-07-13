(function(exports){var Epitome={};typeof define=="function"&&define.amd?define("epitome",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome})(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome,eq=Epitome.isEqual=function(a,b,stack){stack=stack||[];if(a===b)return a!==0||1/a==1/b;if(a==null||b==null)return a===b;var typeA=typeOf(a),typeB=typeOf(b);if(typeA!=typeB)return!1;switch(typeA){case"string":return a==String(b);case"number":return a!=+a?b!=+b:a==0?1/a==1/b:a==+b;case"date":case"boolean":return+a==+b;case"regexp":return a.source==b.source&&a.global==b.global&&a.multiline==b.multiline&&a.ignoreCase==b.ignoreCase}if(typeof a!="object"||typeof b!="object")return!1;var length=stack.length;while(length--)if(stack[length]==a)return!0;stack.push(a);var size=0,result=!0;if(typeA=="array"){size=a.length,result=size==b.length;if(result)while(size--)if(!(result=size in a==size in b&&eq(a[size],b[size],stack)))break}else{if("constructor"in a!="constructor"in b||a.constructor!=b.constructor)return!1;for(var key in a)if(a.hasOwnProperty(key)){size++;if(!(result=b.hasOwnProperty(key)&&eq(a[key],b[key],stack)))break}if(result){for(key in b)if(b.hasOwnProperty(key)&&!(size--))break;result=!size}}return stack.pop(),result};typeof define=="function"&&define.amd?define("epitome-isequal",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome;Epitome.Model=new Class({Implements:[Options,Events],_attributes:{},properties:{id:{get:function(){var id=this._attributes.id||(this._attributes.id=String.uniqueID());return this.cid||(this.cid=id),id}}},options:{defaults:{}},initialize:function(obj,options){return options&&options.defaults&&(this.options.defaults=Object.merge(this.options.defaults,options.defaults)),obj=obj&&typeOf(obj)==="object"?obj:{},this.set(Object.merge(this.options.defaults,obj)),this.setOptions(options),this.fireEvent("ready")},set:function(){this.propertiesChanged=[],this._set.apply(this,arguments),this.propertiesChanged.length&&this.fireEvent("change",this.get(this.propertiesChanged))},_set:function(key,value){return!key||typeof value=="undefined"?this:this.properties[key]&&this.properties[key].set?this.properties[key].set.call(this,value):this._attributes[key]&&Epitome.isEqual(this._attributes[key],value)?this:(value===null?delete this._attributes[key]:this._attributes[key]=value,this.fireEvent("change:"+key,value),this.propertiesChanged.push(key),this)}.overloadSetter(),get:function(key){return key&&this.properties[key]&&this.properties[key].get?this.properties[key].get.call(this):key&&typeof this._attributes[key]!="undefined"?this._attributes[key]:null}.overloadGetter(),unset:function(){var keys=Array.prototype.slice.apply(arguments),obj={},len=keys.length;return len?(Array.each(Array.flatten(keys),function(key){obj[key]=null}),this.set(obj),this):this},toJSON:function(){return Object.clone(this._attributes)},empty:function(){var keys=Object.keys(this.toJSON()),self=this;this.fireEvent("change",[keys]),Array.each(keys,function(key){self.fireEvent("change:"+key,null)},this),this._attributes={},this.fireEvent("empty")},destroy:function(){this._attributes={},this.fireEvent("destroy")}}),typeof define=="function"&&define.amd?define("epitome-model",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome-model"):exports.Epitome,Model=Epitome.Model,syncPseudo="sync:",methodMap={create:"POST",read:"GET",update:"PUT",delete_:"DELETE"};Model.Sync=new Class({Extends:Model,properties:{id:{get:function(){var id=this._attributes.id||(this._attributes.id=String.uniqueID());return this.cid||(this.cid=id),id}},urlRoot:{set:function(value){this.urlRoot=value,delete this._attributes.urlRoot},get:function(){var base=this.urlRoot||this.options.urlRoot||"no-urlRoot-set";return base.charAt(base.length-1)!="/"&&(base+="/"),base}}},options:{emulateREST:!1},initialize:function(obj,options){this.setupSync(),this.parent(obj,options)},sync:function(method,model){var options={};method=method&&methodMap[method]?methodMap[method]:methodMap.read,options.method=method;if(method==methodMap.create||method==methodMap.update)options.data=model||this.toJSON();return options.url=this.get("urlRoot")+this.get("id")+"/",this.request.setOptions(options),this.request[method](model),this},setupSync:function(){var self=this,rid=0,incrementRequestId=function(){rid++};return this.getRequestId=function(){return rid+1},this.request=new Request.JSON({link:"chain",url:this.get("urlRoot"),emulation:this.options.emulateREST,onRequest:incrementRequestId,onCancel:function(){this.removeEvents(syncPseudo+rid)},onSuccess:function(responseObj){responseObj=self.parse&&self.parse(responseObj),self.fireEvent(syncPseudo+rid,[responseObj]),self.fireEvent("sync",[responseObj,this.options.method,this.options.data])},onFailure:function(){self.fireEvent(syncPseudo+"error",[this.options.method,this.options.url,this.options.data])}}),Object.each(methodMap,function(requestMethod,protoMethod){self[protoMethod]=function(model){this.sync(protoMethod,model)}}),this},_throwAwaySyncEvent:function(eventName,callback){eventName=eventName||syncPseudo+this.getRequestId();var self=this,throwAway={};return throwAway[eventName]=function(responseObj){responseObj&&typeof responseObj=="object"&&(self.set(responseObj),callback&&callback.call(self,responseObj)),self.removeEvents(throwAway)},this.addEvents(throwAway)}.protect(),parse:function(resp){return resp},fetch:function(){return this._throwAwaySyncEvent(syncPseudo+this.getRequestId(),function(){this.fireEvent("fetch"),this.isNewModel=!1}),this.read(),this},save:function(key,value){var method=["update","create"][+this.isNew()];if(key){var ktype=typeOf(key),canSet=ktype=="object"||ktype=="string"&&typeof value!="undefined";canSet&&this._set.apply(this,arguments)}return this._throwAwaySyncEvent(syncPseudo+this.getRequestId(),function(){this.fireEvent("save"),this.fireEvent(method)}),this[method](),this.isNewModel=!1,this},destroy:function(){this._throwAwaySyncEvent(syncPseudo+this.getRequestId(),function(){this._attributes={},this.delete_(),this.fireEvent("destroy")})},isNew:function(){return typeof this.isNewModel=="undefined"&&(this.isNewModel=!0),this.isNewModel}}),typeof define=="function"&&define.amd?define("epitome-model-sync",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome;Epitome.Storage=function(){var hasNativeStorage=typeof exports.localStorage=="object"&&!!exports.localStorage.getItem,localStorage="localStorage",sessionStorage="sessionStorage",setStorage=function(storageMethod){var s,privateKey="epitome-"+storageMethod,storage={},storagePrefix="model";if(hasNativeStorage)try{storage=JSON.decode(exports[storageMethod].getItem(privateKey))||storage}catch(e){hasNativeStorage=!1}if(!hasNativeStorage)try{s=JSON.decode(exports.name),s&&typeof s=="object"&&s[privateKey]&&(storage=s[privateKey])}catch(e){serializeWindowName()}var Methods={store:function(model){model=model||this.toJSON(),setItem([storagePrefix,this.get("id")].join(":"),model),this.fireEvent("store",model)},eliminate:function(){return removeItem([storagePrefix,this.get("id")].join(":")),this.fireEvent("eliminate")},retrieve:function(){var model=getItem([storagePrefix,this.get("id")].join(":"))||null;return this.fireEvent("retrieve",model),model}},getItem=function(item){return storage[item]||null},setItem=function(item,value){storage=JSON.decode(exports[storageMethod].getItem(privateKey))||storage,storage[item]=value;if(hasNativeStorage)try{exports[storageMethod].setItem(privateKey,JSON.encode(storage))}catch(e){}else serializeWindowName();return this},removeItem=function(item){delete storage[item];if(hasNativeStorage)try{exports[storageMethod].setItem(privateKey,JSON.encode(storage))}catch(e){}else serializeWindowName()},serializeWindowName=function(){var obj={},s=JSON.decode(exports.name);obj[privateKey]=storage,exports.name=JSON.encode(Object.merge(obj,s))};return function(storageName){return storageName&&(storagePrefix=storageName),new Class(Object.clone(Methods))}};return{localStorage:setStorage(localStorage),sessionStorage:setStorage(sessionStorage)}}(),typeof define=="function"&&define.amd?define("epitome-storage",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome,methodMap=["forEach","each","invoke","filter","map","some","indexOf","contains","getRandom","getLast"];Function.extend({monitorModelEvents:function(listener,orig){var self=this;return orig=orig||this,!listener||!listener.fireEvent?this:function(type,args,delay){self.apply(orig,arguments),listener.getModelByCID(orig.cid)&&listener.fireEvent(type,Array.flatten([orig,args]),delay)}}});var Collection=Epitome.Collection=new Class({Implements:[Options,Events],model:Epitome.Model,_models:[],initialize:function(models,options){this.setOptions(options),models&&this.setUp(models),this.id=this.options.id||String.uniqueID()},setUp:function(models){return Array.each(models,this.addModel.bind(this)),this.addEvent("destroy",this.removeModel.bind(this)),this},addModel:function(model,replace){var exists;return typeOf(model)=="object"&&!instanceOf(model,this.model)&&(model=new this.model(model)),model.cid=model.cid||model.get("id")||String.uniqueID(),exists=this.getModelByCID(model.cid),exists&&replace!==!0?this.fireEvent("add:error",model):(exists&&replace===!0&&(this._models[this._models.indexOf(model)]=model),model.fireEvent=Function.monitorModelEvents.apply(model.fireEvent,[this,model]),this._models.push(model),this.length=this._models.length,this.fireEvent("add",[model,model.cid]).fireEvent("change",[model,model.cid]))},removeModel:function(models){var self=this;return models=Array.from(models),Array.each(models,function(model){delete model.fireEvent,Array.erase(self._models,model),self.length=self._models.length,self.fireEvent("remove",[model,model.cid])}),this},get:function(what){return this[what]},getModelByCID:function(cid){var last=null;return this.some(function(el){return el.cid==cid&&(last=el)}),last},getModelById:function(id){var last=null;return this.some(function(el){return el.get("id")==id&&(last=el)}),last},getModel:function(index){return this._models[index]},toJSON:function(){var getJSON=function(model){return model.toJSON()};return Array.map(this._models,getJSON)},empty:function(){return this._models=[],this.fireEvent("empty")},sort:function(how){if(!how)return this._models.sort(),this.fireEvent("sort");if(typeof how=="function")return this.model.sort(how),this.fireEvent("sort");var type="asc",pseudos=how.split(":"),key=pseudos[0],c=function(a,b){return a<b?-1:a>b?1:0};return pseudos[1]&&(type=pseudos[1]),this._models.sort(function(a,b){var ak=a.get(key),bk=b.get(key),cm=c(ak,bk),map={asc:cm,desc:-cm};return typeof map[type]=="undefined"&&(type="asc"),map[type]}),this.fireEvent("sort")},reverse:function(){return Array.reverse(this._models),this.fireEvent("sort")}});Array.each(methodMap,function(method){Collection.implement(method,function(){return Array.prototype[method].apply(this._models,arguments)})}),typeof define=="function"&&define.amd?define("epitome-collection",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome-collection"):exports.Epitome,noUrl="no-urlRoot-set",eventPseudo="fetch:";Epitome.Collection.Sync=new Class({Extends:Epitome.Collection,options:{urlRoot:noUrl},initialize:function(models,options){this.setupSync(),this.parent(models,options)},setupSync:function(){var self=this,rid=0,incrementRequestId=function(){rid++};return this.getRequestId=function(){return rid+1},this.request=new Request.JSON({link:"chain",url:this.options.urlRoot,emulation:this.options.emulateREST,onRequest:incrementRequestId,onCancel:function(){this.removeEvents(eventPseudo+rid)},onSuccess:function(responseObj){responseObj=self.parse&&self.parse(responseObj),self.fireEvent(eventPseudo+rid,[[responseObj]])},onFailure:function(){self.fireEvent(eventPseudo+"error",[this.options.method,this.options.url,this.options.data])}}),this},parse:function(resp){return resp},fetch:function(refresh){return this._throwAwayEvent(function(models){refresh?(this.empty(),Array.each(models,this.addModel.bind(this))):this.processModels(models),this.fireEvent("fetch",[models])}),this.request.get(),this},processModels:function(models){var self=this;Array.each(models,function(model){var exists=model.id&&self.getModelById(model.id);exists?exists.set(model):self.addModel(model)})},_throwAwayEvent:function(callback){var eventName=eventPseudo+this.getRequestId(),self=this,throwAway={};if(!callback||typeof callback!="function")return;return throwAway[eventName]=function(responseObj){callback.apply(self,responseObj),self.removeEvents(throwAway)},this.addEvents(throwAway)}.protect()}),typeof define=="function"&&define.amd?define("epitome-collection-sync",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome;Epitome.Template=new Class({options:{evaluate:/<%([\s\S]+?)%>/g,normal:/<%=([\s\S]+?)%>/g,noMatch:/.^/,escaper:/\\|'|\r|\n|\t|\u2028|\u2029/g,unescaper:/\\(\\|'|r|n|t|u2028|u2029)/g},Implements:[Options],initialize:function(options){this.setOptions(options);var unescaper=this.options.unescaper,escapes=this.escapes={"\\":"\\","'":"'",r:"\r",n:"\n",t:"	",u2028:"\u2028",u2029:"\u2029"};return Object.each(escapes,function(value,key){this[value]=key},escapes),this.unescape=function(code){return code.replace(unescaper,function(match,escape){return escapes[escape]})},this},template:function(str,data){var o=this.options,escapes=this.escapes,unescape=this.unescape,noMatch=o.noMatch,escaper=o.escaper,template,source=["var __p=[],print=function(){__p.push.apply(__p,arguments);};","with(obj||{}){__p.push('",str.replace(escaper,function(match){return"\\"+escapes[match]}).replace(o.normal||noMatch,function(match,code){return"',\nobj['"+unescape(code)+"'],\n'"}).replace(o.evaluate||noMatch,function(match,code){return"');\n"+unescape(code)+"\n;__p.push('"}),"');\n}\nreturn __p.join('');"].join(""),render=new Function("obj","_",source);return data?render(data):(template=function(data){return render.call(this,data)},template.source="function(obj){\n"+source+"\n}",template)}}),typeof define=="function"&&define.amd?define("epitome-template",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome-template"):exports.Epitome;Epitome.View=new Class({Implements:[Options,Events],element:null,collection:null,model:null,options:{template:"",events:{}},initialize:function(options){return options&&options.collection&&(this.setCollection(options.collection),delete options.collection),options&&options.model&&(this.setModel(options.model),delete options.model),this.setOptions(options),this.options.element&&(this.setElement(this.options.element,this.options.events),delete this.options.element),this.fireEvent("ready")},setElement:function(el,events){return this.element&&this.detachEvents()&&this.destroy(),this.element=document.id(el),events&&this.attachEvents(events),this},setCollection:function(collection){var self=this,eventProxy=function(type){return function(){self.fireEvent(type+":collection",arguments)}};return instanceOf(collection,Epitome.Collection)&&(this.collection=collection,this.collection.addEvents({change:eventProxy("change"),fetch:eventProxy("fetch"),add:eventProxy("add"),remove:eventProxy("remove"),sort:eventProxy("sort")})),this},setModel:function(model){var self=this,eventProxy=function(type){return function(){self.fireEvent(type+":model",arguments)}};return instanceOf(model,Epitome.Model)&&(this.model=model,this.model.addEvents({change:eventProxy("change"),destroy:eventProxy("destroy"),empty:eventProxy("empty")})),this},attachEvents:function(events){var self=this;return Object.each(events,function(method,type){self.element.addEvent(type,function(e){self.fireEvent(method,arguments)})}),this.element.store("attachedEvents",events),this},detachEvents:function(){var events=this.element.retrieve("attachedEvents");return events&&this.element.removeEvents(events).eliminate("attachedEvents"),this},template:function(data,template){template=template||this.options.template;var compiler=this.Template||(this.Template=new Epitome.Template);return compiler.template(template,data)},render:function(){return this.fireEvent("render")},empty:function(soft){return soft?this.element.empty():this.element.set("html",""),this.fireEvent("empty")},dispose:function(){return this.element.dispose(),this.fireEvent("dispose")},destroy:function(){return this.element.destroy(),this.fireEvent("destroy")}}),typeof define=="function"&&define.amd?define("epitome-view",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this),function(exports){var Epitome=typeof require=="function"?require("./epitome"):exports.Epitome,hc="hashchange",hcSupported="on"+hc in window,eventHosts=[window,document],timer,getQueryString=function(queryString){var result={},re=/([^&=]+)=([^&]*)/g,m;while(m=re.exec(queryString))result[decodeURIComponent(m[1])]=decodeURIComponent(m[2]);return result};Element.Events.hashchange={onAdd:function(){var hash=location.hash,check=function(){if(hash==location.hash)return;hash=location.hash,eventHosts.invoke("fireEvent",hc,hash.indexOf("#")==0?hash.substr(1):hash)};hcSupported&&(window.onhashchange=check)||(timer=check.periodical(100))},onRemove:function(){hcSupported&&(window.onhashchange=null)||clearInterval(timer)}},Epitome.Router=new Class({Implements:[Options,Events],options:{triggerOnLoad:!0},routes:{},boundEvents:{},initialize:function(options){var self=this;this.setOptions(options),this.options.routes&&(this.routes=this.options.routes),window.addEvent(hc,function(e){var hash=location.hash,path=hash.split("?")[0],query=hash.split("?")[1]||"",notfound=!0,route;for(route in self.routes){var keys=[],regex=self.normalize(route,keys,!0,!1),found=regex.exec(path),routeEvent=!1;if(found){notfound=!1,self.req=found[0];var args=found.slice(1),param={};Array.each(args,function(a,i){typeof keys[i]!="undefined"&&(param[keys[i].name]=a)}),self.route=route,self.param=param||{},self.query=query&&getQueryString(query),routeEvent=self.routes[route],self.fireEvent("before",routeEvent),routeEvent&&self.$events[routeEvent]?(self.fireEvent(routeEvent+":before"),self.fireEvent(routeEvent,Object.values(self.param))):self.fireEvent("error",["Route",routeEvent,"is undefined"].join(" ")),self.fireEvent("after",routeEvent),routeEvent&&self.fireEvent(routeEvent+":after");break}}notfound&&self.fireEvent("undefined")}),this.fireEvent("ready"),this.options.triggerOnLoad&&window.fireEvent(hc)},navigate:function(route,trigger){location.hash==route&&trigger?window.fireEvent(hc):location.hash=route},normalize:function(path,keys,sensitive,strict){return path instanceof RegExp?path:(path=path.concat(strict?"":"/?").replace(/\/\(/g,"(?:/").replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,function(_,slash,format,key,capture,optional){return keys.push({name:key,optional:!!optional}),slash=slash||"",[optional?"":slash,"(?:",optional?slash:"",(format||"")+(capture||format&&"([^/.]+?)"||"([^/]+?)")+")",optional||""].join("")}).replace(/([\/.])/g,"\\$1").replace(/\*/g,"(.*)"),new RegExp("^"+path+"$",sensitive?"":"i"))},addRoute:function(obj){return!obj||!obj.route||!obj.id||!obj.events?this.fireEvent("error","Please include route, id and events in the argument object when adding a route"):obj.id.length?this.routes[obj.route]?this.fireEvent("error",'Route "{route}" or id "{id}" already exists, aborting'.substitute(obj)):(this.routes[obj.route]=obj.id,this.addEvents(this.boundEvents[obj.route]=obj.events),this.fireEvent("route:add",obj)):this.fireEvent("error","Route id cannot be empty, aborting")},removeRoute:function(route){return!route||!this.routes[route]||!this.boundEvents[route]?this.fireEvent("error","Could not find route or route is not removable"):(this.removeEvents(this.boundEvents[route]),delete this.routes[route],delete this.boundEvents[route],this.fireEvent("route:remove",route))}}),typeof define=="function"&&define.amd?define("epitome-router",[],function(){return Epitome}):typeof module=="object"?module.exports=Epitome:exports.Epitome=Epitome}(this)