#Ambusher实现了观察者模式，用于不同模块／不同UI区域之间，有串联关系的数据通讯的业务场景中。

使用方式如下:
	##1)先触发，后监听
```
var oamEventHub = OAMEvent.create();
oamEventHub.trigger("loadDocumentCount", {age: 10}, {name: "enforceway"});

oamEventHub.listen("loadDocumentCount", function(data1, data2) {
	console.log("param1:", data1, ", param2:", data2);
});
```

	##2)先监听，后触发
```
var oamEventHub = OAMEvent.create();

oamEventHub.listen("loadDocumentCount", function(data1, data2) {
	console.log("param1:", data1, ", param2:", data2);
});
oamEventHub.trigger("loadDocumentCount", {age: 10}, {name: "enforceway"});
```

使用在了自己公司的实际项目中。