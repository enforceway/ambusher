class IdGenerator {
	private _index: number;
	constructor() {
		this._index = +new Date();
	}
	uid() {
		return this._index++;
	}
}

class CallbackFnLodge {

	private _id: number;
	private _fn: Function;
	private _ifMultiCall: boolean;
	private _thisArg: Object;
	private _ifTriggered: any;

	constructor(fnValue, ifMuticallValue, ifTriggered = 0, thisArg = window) {
		this.fn = fnValue;
		this.ifMultiCall = ifMuticallValue;
		this.ifTriggered = ifTriggered;
		this.thisArg = thisArg;
	}

	get id() {
		return this._id;
	}
	set id(newId) {
		this._id = newId;
	}

	get fn() {
		return this._fn;
	}
	set fn(newFn) {
		this._fn = newFn;
	}

	get ifMultiCall() {
		return this._ifMultiCall;
	}
	set ifMultiCall(newValue) {
		this._ifMultiCall = newValue;
	}

	get thisArg() {
		return this._thisArg;
	}
	set thisArg(newValue) {
		this._thisArg = newValue;
	}

	get ifTriggered() {
		return this._ifTriggered;
	}
	set ifTriggered(newValue) {
		this._ifTriggered = newValue;
	}

}


class EventLodge extends IdGenerator {
	private _id: any;
	private cache: Object = {};
	private callbackCache: Object = {};
	private _keyOfValue: string;
	// private evtCache: Object = {};
	constructor(evtId: any) {
		super();
		this._id = evtId;
		this._keyOfValue = this.uid() + '';
	}
	get id() {
		return this._id;
	}
	set id(evtId: any) {
		this._id = evtId;
	}

	// public remove: Function = function(key, fn) {
	// 	this._remove(key, fn);
	// }

	// private _remove: Function = function(key: string, cache: Object, fn: Function) {
	// 	if(cache[key]) {
	// 		if(fn) {
	// 			for(var i = cache[key].length; i >= 0; i--) {
	// 				if(cache[key][i] === fn) {
	// 					cache[key].splice(i,1)
	// 				}
	// 			}
	// 		} else {
	// 			cache[key] = []
	// 		}
	// 	}
	// }

	private _promoteCallerCount: Function = function(key: string, values: any[]): void {
		// this.cache[key].push(uid);
		this.callbackCache[key][this._keyOfValue] = values;
		// this.callbackCache[key].value = value;
	}

	private _listen: Function = function(key: any, fn: Function, ifMultiEvt = false): void {
		let fnLodge: CallbackFnLodge = new CallbackFnLodge(fn, ifMultiEvt);
		let uid = this.uid();
		if(ifMultiEvt == false) {
			this.cache[key].push(uid);
			this.callbackCache[key][uid] = {
				fnLodge: fnLodge,
				evtName: key	
			};
		} else {
			// uid = this.uid();
			key.forEach((keyItm) => {
				this.cache[keyItm].push(uid);
				this.callbackCache[keyItm][uid] = {
					fnLodge: fnLodge,
					evtName: key.toString()
				};
			});
		}
	}
	private _runCallback: Function = function(keys: any, values: any[]): void {
		if(typeof(keys) == 'string') {
			keys = [keys];	
		}
		let self = this;
		let fnLodgeIds;
		let fnLodge;
		keys.forEach((key) => {
			// 如果没有数值
			if(!self.callbackCache[key][self._keyOfValue]) {
				return;
			}
			let fnLodgeIds = self.cache[key];
			let callbackArgs = [];
			fnLodgeIds.forEach((fnId, index) => {
				//= self.callbackCache[key][fnId];
				for(let fnId in self.callbackCache[key]) {
					if(fnId == self._keyOfValue) {
						// 遇到回调数值保存的属性，则进入下次循环
						continue;
					}

					if(key.toString() == self.callbackCache[key][fnId]['evtName']) {
						callbackArgs.push(self.callbackCache[key][self._keyOfValue]);
					} else if(self.callbackCache[key][fnId]['evtName'].indexOf(key.toString()) > 0) {
						self.callbackCache[key][fnId]['evtName'].split(',').forEach((keyName, index, self) => {
							callbackArgs[index] = self.callbackCache[keyName][self._keyOfValue];
						});
					} else {
						console.warn("执行出现错误，无法构建回调参数.");
					}
					fnLodge = self.callbackCache[key][fnId]['fnLodge'];
					fnLodge.fn.apply(fnLodge.thisArg, callbackArgs);
				}				
			});
		});
	}

	private _addListen: Function = function(key: string | Array<string>, fn: Function): boolean {
		if(typeof(key) == 'string') {
			this._listen(key, fn, false);
			return true;
		} else if(Object.prototype.toString.call(key) == '[object Array]') {
			let distinctKey = [], hash = {};
			key.forEach(function(keyItem) {
				if (!hash[keyItem]) {
					distinctKey.push(keyItem);
				}
			});
			this._listen(distinctKey, fn, true);
			return true;
		}
		return false;
	}

	private _initEvtCache: Function = function(key: string): void {
		if(!this.cache[key]) {
			this.cache[key] = [];
			this.callbackCache[key] = {};
			// this.evtNameCache[key]
		}
	}

	public listen: Function = function(key: string | Array<string>, fn: Function): void {
		// 初始化存储结构
		this._initEvtCache(key);
		// 保存回调函数
		let ifAddSuccc = this._addListen(key, fn);
		if(ifAddSuccc) {
			// 检查热模式是否有需要执行的回调函数
			this._runCallback(key);
		}
		
	}

	// public listenArray: Function = function(keys: Array<string>, fn: Function): void {
	// 	keys.forEach((key: string) => {
	// 		this._initEvtCache(key);
	// 	});
	// }

	public trigger: Function = function(key: string, ...values: any[]): void {
		this._initEvtCache(key);
		this._promoteCallerCount(key, values);
		this._runCallback(key, values);
	}

}

class InstanceUID {
	indexer: number;
	constructor() {
		this.indexer = +new Date();
	}
	uid: Function = function(): number {
		return this.indexer++;
	}
}

class Instanstializer {
	constructor() {
		
	}
	private instanceLodge : Object = {};
	public create: Function = function(namespace: string = "_default") {
		let newEvt = new EventLodge(namespace);
		this.instanceLodge[namespace] = newEvt;
		return newEvt;
	}
}

export default new Instanstializer().create("oaisys");