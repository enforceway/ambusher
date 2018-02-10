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

	private _listen: Function = function(key: any, fn: Function, ifMultiEvt = false, thisArg: any): void {
		let fnLodge: CallbackFnLodge = {fn: fn, ifMultiCall: ifMultiEvt, thisArg: thisArg};//new CallbackFnLodge(fn, ifMultiEvt);
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
			}
		);
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
		this._runCallback(key);
		return handlerId;
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
		let newEvt = new EventLodge(namespace);
		this.instanceLodge[namespace] = newEvt;
		return newEvt;
	}
}

export default new Instanstializer().create("oaisys");