class InstanceUID {
	indexer: number;
	constructor() {
		this.indexer = +new Date();
	}
	uid: Function = function(): number {
		return this.indexer++;
	}
}

class EventLodge {
	private _id: number;
	private cache: Object = {};
	private offlineStack: Object = {};
	constructor(evtId: number) {
		this._id = evtId;
	}
	get id() {
		return this._id;
	}
	set id(evtId: number) {
		this._id = evtId;
	}
	private _remove: Function = function(key: string, cache: Object, fn: Function) {
		if(cache[key]) {
			if(fn) {
				for(var i = cache[key].length; i >= 0; i--) {
					if(cache[key][i] === fn) {
						cache[key].splice(i,1)
					}
				}
			} else {
				cache[key] = []
			}
		}
	}

	private _call: Function = function(_self: Object, key: string, values: any[]) {
		let stack = this.cache[key];
		stack.forEach(function(itemFn) {
			itemFn.ifTriggered = 1;
			itemFn.apply(_self, values.concat(key));
		});
	}

	private _promoteCallerCount: Function = function(key: string, value: Function) {
		this.offlineStack[key].triggerCount++;
		this.offlineStack[key].value = value;
	}

	private _listen: Function = function(key: string | Array<string>, fn: Function) {
		if(!fn.ifTriggered && fn.ifTriggered != 0) {
			fn.ifTriggered = 0;
		}

		if(typeof(key) == 'string') {
			this.cache[key].push(fn);
		} else if(typeof(key) == 'object') {
			fn.callbackSeq = [];
			key.forEach((item) => {
				fn.callbackSeq.push(item);
				this.cache[item].push(fn);
			});
		}
	}


	private _loopTrigger: Function = function(key: string) {
		if(this.offlineStack[key].value) {
			let self = this;
			this.cache[key].forEach(function(itemFn, index) {
				if(itemFn.ifTriggered == 0) {
					itemFn.apply(self, self.offlineStack[key].value.concat(key));
					itemFn.ifTriggered = 1;
				}
			});
		}
	}

	private _ifFnExists: Function = function(key: string, fn: Function): boolean {
		let fnStr = fn.toString();
		for(let indexer = 0; indexer < this.cache[key].length; indexer ++) {
			if(this.cache[key][indexer].toString() == fnStr) {
				return true;
			}
		}
		return false;
	}

	public listen: Function = function(key: string, fn: Function): void {
		if(!this.cache[key]) {
			this.cache[key] = [];
			this.offlineStack[key] = [];
		}
		if(this._ifFnExists(key, fn) == true) {
			return;
		}
		this._listen(key, fn);
		this._loopTrigger(key);


	}

	public listenArray: Function = function(keys: Array<string>, fn: Function): void {
		keys.forEach((key: string) => {
			if(!this.cache[key]) {
				this.cache[key] = [];
				this.offlineStack[key] = [];
			}
		});
	}

	public trigger: Function = function(key: string, ...values: any[]) {
		if(!this.cache[key]) {
			this.cache[key] = [];
			this.offlineStack[key] = [];
		}
		this._promoteCallerCount(key, values);
		this._call(this, key, values);
	}

	public remove: Function = function(key, fn) {
		this._remove(key, fn);
	}
}

class Instanstializer extends InstanceUID {
	constructor() {
		super()
	}
	private instanceLodge : Object = {};
	public create: Function = function(namespace: string = "_default") {
		let evtId: number = this.uid();
		let newEvt = new EventLodge(evtId);
		this.instanceLodge[evtId] = newEvt;
		return newEvt;
	}
}

export default new Instanstializer().create("oam-system");