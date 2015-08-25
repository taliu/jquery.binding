# jquery.binding
#本插件只有一个方法bindData
$(selector).bindData(modelObj,mapping);
###功能：
	将jquery对象$element与指定的对象modelObj绑定
	使得当element属性改变时，其对应的modelObj属性也改变，当modelObj属性改变时，其对应的 element属性也改变。
###参数：
 modelObj：
    要绑定的模型对象
 mapping：
   元素属性和modelObj对象属性的映射关系，它是可选的，如果没传入mapping，则从元素的mapping属性获取。
   从参数传入的mapping和从元素的mapping属性获取的mapping会进行合并。
####mapping的形式如下：
mapping={"key":"value",...}
key为元素的属性名称，可以为
	value--表示元素的值，适用于input,textarea,select
	text--表示元素的innerText,适用于div，p，label等
	html--表示元素的innerHTML，适用于div，p，label等
	css.xxx--表示元素的css样式属性名称，由前缀"css."加上css属性名称构成，如：css.width,css.color
	attr.xxx（或者prop.xxx）--表示元素的属性节点名称，由前缀"attr."加上属性名称构成，如 attr.href ,attr.name ,attr.src
 除了value，text，html这三个值外，如果还有没加前缀的值，那么默认前缀为css
####value为js对象属性名称:
	value直接为对象属性，也可以为对象属性的属性名称，如一个对象{username:"xxx",birthday:{year:1,mouth:1,day:1}},那么
	如果要表示用户名称，那value就为username，如果要绑定生日的年份，那么value就为birthday.year
##例子1：
   html:
```
	   用户名:<input id="username"><br/>
		 生日:<input id="b_year"><input id="b_mouth"><input id="b_day">
```		 

   js:
```
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		$("#username").bindData(userInfo,{"value":"username"});
		$("#b_year").bindData(userInfo,{"value":"birthday.year"});
		$("#b_mouth").bindData(userInfo,{"value":"birthday.mouth"});
		$("#b_day").bindData(userInfo,{"value":"birthday.day"});
	   })
```
	通过绑定input元素值的改变就自动更新到userInfo中，而userInfo的属性通过绑定方式的改变也会更新到input元素上。
	
上面的例子1也可以用另外一种方法实现，也就是把mapping写在html中。这样只要绑定父元素，则它的后代元素就继承绑定的对象
##例子2：
   html:
```
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
```	

   js:
```
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		 $("#content").bindData(userInfo);
	   })
```	   
	例子二比例子多添加了一个显示userInfo变化的功能，它的js写起来很干净。
	
##例子3:
   html:
```
	<div id="content">
	   输入1:<input mapping='{"value":"description"}'><br/>
	   输入2:<input mapping='{"value":"description"}'><br/>
	   显示：<div mapping='{"text":"description"}'></div>
	</div>
```
   js:
```
	   var boxInfo={name:"blue box",description:"I am a blue box"};
	   $(function(){
		 $("#content").bindData(boxInfo);
	   })
```
	这个例子中的三个元素显示的内容一样，其同步变化。
