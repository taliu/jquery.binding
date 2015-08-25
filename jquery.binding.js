/** 
* @fileOverview jquery.binding.js 将DOM元素与JS对象绑定的jquery插件
* @author taliu
* @version 0.1 
*/ 
(function($){
	/**
	 * 事件参数类
	 * @class EventArgs
	 */
	function EventArgs(propertyName,newValue,oldValue){
		this.propertyName=propertyName;
		this.newValue=newValue;
		this.oldValue=oldValue;
	  }
	  
	/**
	 * 绑定的依赖对象类
	 * @class DependencyObject
	 */
	function DependencyObject(modelObj){
		this.Model=modelObj;
		this.callbacks=$.Callbacks();
	}
	DependencyObject.prototype={
		setProperty:function(propertyName,value){
			var oldValue=this.getProperty(propertyName);
			if(oldValue!==value){
				if(/\.|\[/.test(propertyName)){//如果有 . [ 表示propertyName是表达式，要进行动态解析
				   var funBody= "model."+propertyName+"=val";
				   ((new Function("model","val",funBody))(this.Model,value));
				}else{
				   this.Model[propertyName]=value;
				}
				this.fire(this.Model,new EventArgs(propertyName,value,oldValue));
			}
		},
		getProperty:function(propertyName){
				if(/\.|\[|\(/.test(propertyName)){//如果有 . [ 表示propertyName是表达式，要进行动态解析
				   var funBody= "return model."+propertyName;
				   return ((new Function("model",funBody))(this.Model));
				}else{
				  return this.Model[propertyName];
				}
		},
		fire:function(sender,eventArgs){//触发模型对象属性改变事件
			this.callbacks.fire(sender,eventArgs);
		},
		onFire:function(callback){//订阅模型对象属性改变事件
			this.callbacks.add(callback);
		}
	};
	
	//管理依赖对象
	var DependencyObjectMgr=(new function(){
		var dependencyObjectList=[];
		//根据模型对象modelObj查找并返回一个依赖对象，如果不存在则返回null
		this.find=function(modelObj){
			for(var i=dependencyObjectList.length;i--;){
				if(dependencyObjectList[i].Model===modelObj){
					return dependencyObjectList[i];
				}
			}
			return null;
		}
		//根据模型对象modelObj获取一个依赖对象。
		this.get=function(modelObj){
			var depObj= this.find(modelObj);
			if(!depObj){
				depObj=new DependencyObject(modelObj);
				dependencyObjectList.push(depObj);
			}
			return depObj;
		}
	}());
	
	function onPropertyChange($element,dependObj,proName,elementPro,funcName){
			  dependObj.onFire(function(sender,eventArgs){
				 if(eventArgs.propertyName==proName){
					 if(funcName=="val"){
						 ($element.val()!=eventArgs.newValue)&&$element.val(eventArgs.newValue);
					 }else if(funcName=="html"||funcName=="text"){
						$element[funcName](eventArgs.newValue);
					 }else{
						$element[funcName](elementPro,eventArgs.newValue);
					 }
				 }
			   });
	}
	/**
	 * 将$element与指定的对象modelObj绑定，
	 * 使得当element属性改变时，其对应的modelObj属性也改变，
	 * 使得当modelObj属性改变时，其对应的 element属性也改变。
	 * @method binding
	 * @param {jQueryObject} element 要绑定的jQuery对象
	 * @param {Oject} modelObj 要使用的数据模型对象
	 * @param {Object} mapping element元素属性和modelObj对象属性的映射关系
	 * @return {void} 无
	 */
	function binding($element,modelObj,mapping){
		//var $element=$(selector);
		var dependObj=DependencyObjectMgr.get(modelObj);
		for(var elementPro in  mapping){
			if(mapping.hasOwnProperty(elementPro)){
				var proName=mapping[elementPro];
				switch(elementPro.toLowerCase()){
					case "value":
							var data={dependObj:dependObj,proName:proName};
							$element.on("keyup mouseup change",data,function(event){
								var value=$(this).val();
								event.data.dependObj.setProperty(event.data.proName,value);
							});
							onPropertyChange($element,dependObj,proName,elementPro,"val");
							break;
					case "html":				
					case "text":
						onPropertyChange($element,dependObj,proName,elementPro,elementPro);
						break;
					default:
						var arr=elementPro.split(".");
						var funcName="css";
						if(arr[1]){//有两个元素
							funcName=arr[0];
							elementPro=arr[1];
						}
						onPropertyChange($element,dependObj,proName,elementPro,funcName);
					   break;
						
				}
				dependObj.fire(modelObj,new EventArgs(proName,dependObj.getProperty(proName)));
			}
		}
	}
	function parseJSON(jsonStr){
		return new Function("return "+jsonStr)();
	}
	$.fn.bindData=function(modelObj,mapping){
		//绑定当前元素
		var mappingStr=this.attr("mapping");
		if(mappingStr){
			var mapJson=$.extend(parseJSON(mappingStr),mapping);
			 $.isEmptyObject(mapJson)||binding(this,modelObj,mapJson);
		}else{
			$.isEmptyObject(mapping)||binding(this,modelObj,mapping);
		}
		//绑定后代元素
		this.find("[mapping]").each(function(){
			var $el=$(this);
			var mappingStr=$el.attr("mapping");
			if(mappingStr){
			    var mapJson=parseJSON(mappingStr);
				$.isEmptyObject(mapJson)||binding($el,modelObj,mapJson);
			}
		});
		return this;
	}
}(jQuery));
/*
本插件只有一个方法bindData
$(selector).bindData(modelObj,mapping);
功能：
	将jquery对象$element与指定的对象modelObj绑定
	使得当element属性改变时，其对应的modelObj属性也改变，当modelObj属性改变时，其对应的 element属性也改变。
参数：
 modelObj：
    要绑定的模型对象
 mapping：
   元素属性和modelObj对象属性的映射关系，它是可选的，如果没传入mapping，则从元素的mapping属性获取。
   从参数传入的mapping和从元素的mapping属性获取的mapping会进行合并。

mapping的形式如下：
mapping={"key":"value",...}
key为元素的属性名称，可以为
	value--表示元素的值，适用于input,textarea,select
	text--表示元素的innerText,适用于div，p，label等
	html--表示元素的innerHTML，适用于div，p，label等
	css.xxx--表示元素的css样式属性名称，由前缀"css."加上css属性名称构成，如：css.width,css.color
	attr.xxx（或者prop.xxx）--表示元素的属性节点名称，由前缀"attr."加上属性名称构成，如 attr.href ,attr.name ,attr.src
 除了value，text，html这三个值外，如果还有没加前缀的值，那么默认前缀为css
value为js对象属性名称:
	value直接为对象属性，也可以为对象属性的属性名称，如一个对象{username:"xxx",birthday:{year:1,mouth:1,day:1}},那么
	如果要表示用户名称，那value就为username，如果要绑定生日的年份，那么value就为birthday.year

例子1：
   html:
	   用户名:<input id="username"><br/>
		 生日:<input id="b_year"><input id="b_mouth"><input id="b_day">
   js:
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		$("#username").bindData(userInfo,{"value":"username"});
		$("#b_year").bindData(userInfo,{"value":"birthday.year"});
		$("#b_mouth").bindData(userInfo,{"value":"birthday.mouth"});
		$("#b_day").bindData(userInfo,{"value":"birthday.day"});
	   })
	通过绑定input元素值的改变就自动更新到userInfo中，而userInfo的属性通过绑定方式的改变也会更新到input元素上。
	
上面的例子1也可以用另外一种方法实现，也就是把mapping写在html中。这样只要绑定父元素，则它的后代元素就继承绑定的对象
例子2：
   html:
	<div id="content">
	   用户名:<input mapping='{"value":"username"}'><br/>
		 生日:<input mapping='{"value":"birthday.year"}'>
		      <input mapping='{"value":"birthday.mouth"}'>
			  <input mapping='{"value":"birthday.day"}'>
	    
		<p>
		  <b>输入结果：</b><br/><br/>
		  用户名为<label mapping='{"text":"username"}'></label>,
		  生日是<label mapping='{"text":"birthday.year"}'></label>年
		  <label mapping='{"text":"birthday.mouth"}'></label>月
		  <label mapping='{"text":"birthday.day"}'></label>日。
		</p>
	 </div>
	
   js:
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		 $("#content").bindData(userInfo);
	   })
	   
	例子二比例子多添加了一个显示userInfo变化的功能，它的js写起来很干净。
	
例子3:
   html:
	<div id="content">
	   输入1:<input mapping='{"value":"description"}'><br/>
	   输入2:<input mapping='{"value":"description"}'><br/>
	   显示：<div mapping='{"text":"description"}'></div>
	</div>
	
   js:
	   var boxInfo={name:"blue box",description:"I am a blue box"};
	   $(function(){
		 $("#content").bindData(boxInfo);
	   })
	这个例子中的三个元素显示的内容一样，其同步变化。
*/