var OAMEvent = (function(){
    function each(ary, fn){
        var ret;
        for(var i = 0, l = ary.length; i < l; i++){
            var n = ary[i];
            ret = fn.call(global,i,n);
        }
        return ret;
    };
    var _slice = Array.prototype.slice,
        _shift = Array.prototype.shift,
        _unshift = Array.prototype.unshift;

    var global = this, Event, _default = 'default';
    Event = (function(){
        var _listen,
            _remove,
            namespaceCache = {},
            
            _listen = function(key,fn,cache){
                // 初始化调用次数
                if(!fn.ifTriggered && fn.ifTriggered != 0) {
                    // 0代表该监听function在trigger之后加入的
                    fn.ifTriggered = 0;
                }
                if(!cache[key]){
                    cache[key] = [];
                }
                cache[key].push(fn);
            };
            _remove = function(key,cache,fn){
                if(cache[key]){
                    if(fn){
                        for(var i = cache[key].length; i >= 0; i--){
                            if(cache[key][i] === fn){
                                cache[key].splice(i,1);
                            }
                        }
                    }else{
                        cache[key] = [];
                    }
                }
            };
            function _loopTrigger() {
                var cache = _shift.call(arguments),
                    offlineStack = _shift.call(arguments),
                    key = _shift.call(arguments);
                /*
                    _loopExecute在listen中才会被调用, 且只会去执行那些在任何trigger执行之后才开始监听的function
                 */
                //取得离线事件对应计次器, 如果该计次器不存在，则trigger从未执行过
                var namespaceDesc = offlineStack[key];
                if(namespaceDesc) {
                    each(cache[key],function(index, itemFn){
                        if(itemFn.ifTriggered == 0) {
                            itemFn.apply(global, namespaceDesc.value);
                            // 该监听function已经执行过，只有在再次触发trigger的时候才会执行
                            itemFn.ifTriggered = 1;
                        }
                    });
                }
            };
            function _call(_self, args) {
                var _trigger = function(){
                    var cache = _shift.call(arguments),
                        key = _shift.call(arguments),
                        args = arguments,
                        _self = this,
                        ret,
                        stack = cache[key];
                    if(!stack || !stack.length){
                        // 事件没有任何监听，所有直接退出
                        return;
                    }
                    each(stack,function(index, itemFn){
                        itemFn.apply(_self,args);
                    });
                };
                _trigger.apply(_self, args);
            };
            function _create(namespace){
                var namespace = namespace || _default;
                var cache = {},
                    offlineStack = {},  //离线事件
                    ret = {
                        _promoteCallerCount: function(key, value) {
                            // 给该事件添加计次器
                            if(!offlineStack[key]) {
                                offlineStack[key] = {value: null, triggerCount: 0};
                            }
                            // 可以知道该event handler被trigger了多少次
                            offlineStack[key].triggerCount++;
                            offlineStack[key].value = value;
                        },
                        
                        listen: function(key,fn){
                            // 注册监听function
                            _listen(key,fn,cache);
                            // loopTrigger只去执行在trigger之后开始监听
                            _loopTrigger(cache, offlineStack, key);
                        },
                        remove: function(key,fn){
                            _remove(key,cache,fn);
                        },
                        
                        trigger: function(key, value) {
                            var args = _slice.call(arguments, 0);
                            var argsOffline = _slice.call(arguments, 1);
                            // 给该事件添加计次器
                            this._promoteCallerCount(key, argsOffline);
                            _unshift.call(args, cache);
                            _call(this, args);
                        }
                    };
                    return namespace ?
                        (namespaceCache[namespace] ? namespaceCache[namespace] :
                            namespaceCache[namespace] = ret)
                                : ret;
            };
        return {
            create: _create,
        };
    })();
    return Event;
})();