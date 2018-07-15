class IdGenerator {
	private _index: number;
	constructor() {
		this._index = +new Date();
	}
	uid() {
		return this._index++;
	}
}
interface CallbackFnLodge {
	fn: Function;
	ifMultiCall?: boolean;
	thisArg?: Object;
	ifTriggered?: any;
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

	public remove: Function = function(key, handlerId) {
		this._remove(key, handlerId);
	}

	private _remove: Function = function(key: string, handlerId: any) {
		if(!this.cache[key]) {
			return;
		}
		if(this.cache[key].indexOf(handlerId)) {
			this.cache[key].splice(this.cache[key].indexOf(handlerId), 1);
			delete this.callbackCache[key][handlerId];
		}
	}

	private _promoteCallerCount: Function = function(key: string, values: any[]): void {
		// this.cache[key].push(uid);
		this.callbackCache[key][this._keyOfValue] = values;
		// this.callbackCache[key].value = value;
	}


	private _ifExistListen: Function = function(key: any, fn: Function, targetKey?: any): boolean {
		if(typeof(key) == 'string') {
			key = [key];
		}
		let self = this;
		let exists = false;

		let fullName = key.join(',');
		if(targetKey) {
			key = key.filter(function(tmpKeyItem) {
				return tmpKeyItem == targetKey;
			});
		}
		key.forEach(function(keyItem) {
			for(var tmpKey in self.callbackCache[keyItem]) {
				if(tmpKey == self._keyOfValue) {
					continue;
				}
				let fnEq = self.callbackCache[keyItem][tmpKey].fnLodge.fn.toString() == fn.toString();
				if(exists == false && (self.callbackCache[keyItem][tmpKey].evtName == fullName) && fnEq) {
					exists = true;
				}
			}
		});
		return exists;
	}


	private _listen: Function = function(key: any, fn: Function, ifMultiEvt = false, thisArg: any): void {
		let fnLodge: CallbackFnLodge = {fn: fn, ifMultiCall: ifMultiEvt, thisArg: thisArg};//new CallbackFnLodge(fn, ifMultiEvt);
		let uid = this.uid();
		// 去除已存在
		let tmpResult = null;
		if(ifMultiEvt == false) {
			tmpResult = this._ifExistsListen(key. fn);
			if(!tmpResult) {
				this.cache[key].push(uid);
				this.callbackCache[key][uid] = {
					fnLodge: fnLodge,
					evtName: key
				};
			}
		} else {
			// uid = this.uid();
			key.forEach((keyItm) => {
				tmpResult = this._ifExistsListen(key, fn, keyItm);
				if(!tmpResult) {
					this.cache[keyItm].push(uid);
					this.callbackCache[keyItm][uid] = {
						fnLodge: fnLodge,
						evtName: key.toString()
					};
				}
			});
		}
		if(tmpResult) {
			return null;
		}
		return uid;
	}

	private _runCallbackAtListen: Function = function(keys: any, callback: Function, thisArg: any): void {
		let callbackArgs = [];
		let self = this;
		if(typeof(keys) == 'string' && this.callbackCache[keys][this._keyOfValue]) {
			callbackArgs = callbackArgs.concat(this.callbackCache[keys][this._keyOfValue]);
		} else if(Object.prototype.toString.call(keys) == '[object Array]') {
			let noneInititated = false;
			keys.forEach((key, index) => {
				if(!self.callbackCache[key][self._keyOfValue]) {
					return;
				}
				callbackArgs[index] = self.callbackCache[key][self._keyOfValue];
			});
		}
		if(callbackArgs.length == 0) {
			// 如果事件都没有数值，则退出
			return;
		}
		try {
			callback.apply(thisArg, callbackArgs);
		} catch(err) {
			console.log(err);
		}
	}

	private _runCallback: Function = function(keys: any, values: any[]): void {
		if(typeof(keys) == 'string') {
			keys = [keys];	
		}
		let self = this;
		let fnLodge;
		try {
			keys.forEach((key) => {
				// 如果没有数值
				if(!self.callbackCache[key][self._keyOfValue]) {
					return;
				}
				let callbackArgs = [];
				let cachArray = webix.copy(self.cache[key]);
				cachArray.forEach((fnId, index) => {
					callbackArgs = [];
					if(key.toString() == self.callbackCache[key][fnId]['evtName']) {
						callbackArgs = callbackArgs.concat(self.callbackCache[key][self._keyOfValue]);
					} else if(self.callbackCache[key][fnId]['evtName'].indexOf(key.toString()) > -1) {
						// 多事件调用
						self.callbackCache[key][fnId]['evtName'].split(',').forEach((keyName, indexx) => {
							callbackArgs[indexx] = self.callbackCache[keyName][self._keyOfValue];
						});
					} else {
						console.warn('执行出现错误,无法构建回调参数');
					}
					fnLodge = self.callbackCache[key][fnId]['fnLodge'];
					fnLodge.fn.apply(fnLodge.thisArg, callbackArgs);
				});
			});
		} catch(err) {
			console.log(err);
		}
	}

	private _addListen: Function = function(key: string | Array<string>, fn: Function, thisArg: any): boolean {
		let handlerId = null;
		if(typeof(key) == 'string') {
			handlerId = this._listen(key, fn, false, thisArg);
		} else if(Object.prototype.toString.call(key) == '[object Array]') {
			let distinctKey = [], hash = {};
			key.forEach(function(keyItem) {
				if (!hash[keyItem]) {
					distinctKey.push(keyItem);
				}
			});
			handlerId = this._listen(distinctKey, fn, true, thisArg);
		}
		return handlerId;
	}

	private _initEvtCache: Function = function(keys: any): void {
		if(typeof(keys) == 'string') {
			keys = [keys];
		}
		keys.forEach((key) => {
			if(!this.cache[key]) {
					this.cache[key] = [];
				this.callbackCache[key] = {};
				// this.evtNameCache[key]
			}
		});
	}

	public listen: Function = function(key: string | Array<string>, fn: Function, thisArg?: Object): void {
		if(!(typeof(key) == 'string' || Object.prototype.toString.call(key) == '[object Array]')) {
			return null;
		}
		thisArg?'':(thisArg = window);
		// 初始化存储结构
		this._initEvtCache(key);
		// 保存回调函数
		let handlerId = this._addListen(key, fn, thisArg);
		// 检查热模式是否有需要执行的回调函数
		if(handlerId) {
			this._runCallbackAtListen(key, fn, thisArg);
		}
		return handlerId;
	}

	public clearAll: Function = function() {
		this.cache = {};
		this.callbackCache = {};
	}

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
		if(this.instanceLodge[namespace]) {
			return this.instanceLodge[namespace];
		}
		let newEvt = new EventLodge(namespace);
		this.instanceLodge[namespace] = newEvt;
		return newEvt;
	}
}
// export new Instanstializer();
export default new Instanstializer().create("oaisys");

