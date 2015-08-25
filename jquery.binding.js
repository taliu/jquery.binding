/** 
* @fileOverview jquery.binding.js ��DOMԪ����JS����󶨵�jquery���
* @author taliu
* @version 0.1 
*/ 
(function($){
	/**
	 * �¼�������
	 * @class EventArgs
	 */
	function EventArgs(propertyName,newValue,oldValue){
		this.propertyName=propertyName;
		this.newValue=newValue;
		this.oldValue=oldValue;
	  }
	  
	/**
	 * �󶨵�����������
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
				if(/\.|\[/.test(propertyName)){//����� . [ ��ʾpropertyName�Ǳ��ʽ��Ҫ���ж�̬����
				   var funBody= "model."+propertyName+"=val";
				   ((new Function("model","val",funBody))(this.Model,value));
				}else{
				   this.Model[propertyName]=value;
				}
				this.fire(this.Model,new EventArgs(propertyName,value,oldValue));
			}
		},
		getProperty:function(propertyName){
				if(/\.|\[|\(/.test(propertyName)){//����� . [ ��ʾpropertyName�Ǳ��ʽ��Ҫ���ж�̬����
				   var funBody= "return model."+propertyName;
				   return ((new Function("model",funBody))(this.Model));
				}else{
				  return this.Model[propertyName];
				}
		},
		fire:function(sender,eventArgs){//����ģ�Ͷ������Ըı��¼�
			this.callbacks.fire(sender,eventArgs);
		},
		onFire:function(callback){//����ģ�Ͷ������Ըı��¼�
			this.callbacks.add(callback);
		}
	};
	
	//������������
	var DependencyObjectMgr=(new function(){
		var dependencyObjectList=[];
		//����ģ�Ͷ���modelObj���Ҳ�����һ��������������������򷵻�null
		this.find=function(modelObj){
			for(var i=dependencyObjectList.length;i--;){
				if(dependencyObjectList[i].Model===modelObj){
					return dependencyObjectList[i];
				}
			}
			return null;
		}
		//����ģ�Ͷ���modelObj��ȡһ����������
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
	 * ��$element��ָ���Ķ���modelObj�󶨣�
	 * ʹ�õ�element���Ըı�ʱ�����Ӧ��modelObj����Ҳ�ı䣬
	 * ʹ�õ�modelObj���Ըı�ʱ�����Ӧ�� element����Ҳ�ı䡣
	 * @method binding
	 * @param {jQueryObject} element Ҫ�󶨵�jQuery����
	 * @param {Oject} modelObj Ҫʹ�õ�����ģ�Ͷ���
	 * @param {Object} mapping elementԪ�����Ժ�modelObj�������Ե�ӳ���ϵ
	 * @return {void} ��
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
						if(arr[1]){//������Ԫ��
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
		//�󶨵�ǰԪ��
		var mappingStr=this.attr("mapping");
		if(mappingStr){
			var mapJson=$.extend(parseJSON(mappingStr),mapping);
			 $.isEmptyObject(mapJson)||binding(this,modelObj,mapJson);
		}else{
			$.isEmptyObject(mapping)||binding(this,modelObj,mapping);
		}
		//�󶨺��Ԫ��
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
�����ֻ��һ������bindData
$(selector).bindData(modelObj,mapping);
���ܣ�
	��jquery����$element��ָ���Ķ���modelObj��
	ʹ�õ�element���Ըı�ʱ�����Ӧ��modelObj����Ҳ�ı䣬��modelObj���Ըı�ʱ�����Ӧ�� element����Ҳ�ı䡣
������
 modelObj��
    Ҫ�󶨵�ģ�Ͷ���
 mapping��
   Ԫ�����Ժ�modelObj�������Ե�ӳ���ϵ�����ǿ�ѡ�ģ����û����mapping�����Ԫ�ص�mapping���Ի�ȡ��
   �Ӳ��������mapping�ʹ�Ԫ�ص�mapping���Ի�ȡ��mapping����кϲ���

mapping����ʽ���£�
mapping={"key":"value",...}
keyΪԪ�ص��������ƣ�����Ϊ
	value--��ʾԪ�ص�ֵ��������input,textarea,select
	text--��ʾԪ�ص�innerText,������div��p��label��
	html--��ʾԪ�ص�innerHTML��������div��p��label��
	css.xxx--��ʾԪ�ص�css��ʽ�������ƣ���ǰ׺"css."����css�������ƹ��ɣ��磺css.width,css.color
	attr.xxx������prop.xxx��--��ʾԪ�ص����Խڵ����ƣ���ǰ׺"attr."�����������ƹ��ɣ��� attr.href ,attr.name ,attr.src
 ����value��text��html������ֵ�⣬�������û��ǰ׺��ֵ����ôĬ��ǰ׺Ϊcss
valueΪjs������������:
	valueֱ��Ϊ�������ԣ�Ҳ����Ϊ�������Ե��������ƣ���һ������{username:"xxx",birthday:{year:1,mouth:1,day:1}},��ô
	���Ҫ��ʾ�û����ƣ���value��Ϊusername�����Ҫ�����յ���ݣ���ôvalue��Ϊbirthday.year

����1��
   html:
	   �û���:<input id="username"><br/>
		 ����:<input id="b_year"><input id="b_mouth"><input id="b_day">
   js:
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		$("#username").bindData(userInfo,{"value":"username"});
		$("#b_year").bindData(userInfo,{"value":"birthday.year"});
		$("#b_mouth").bindData(userInfo,{"value":"birthday.mouth"});
		$("#b_day").bindData(userInfo,{"value":"birthday.day"});
	   })
	ͨ����inputԪ��ֵ�ĸı���Զ����µ�userInfo�У���userInfo������ͨ���󶨷�ʽ�ĸı�Ҳ����µ�inputԪ���ϡ�
	
���������1Ҳ����������һ�ַ���ʵ�֣�Ҳ���ǰ�mappingд��html�С�����ֻҪ�󶨸�Ԫ�أ������ĺ��Ԫ�ؾͼ̳а󶨵Ķ���
����2��
   html:
	<div id="content">
	   �û���:<input mapping='{"value":"username"}'><br/>
		 ����:<input mapping='{"value":"birthday.year"}'>
		      <input mapping='{"value":"birthday.mouth"}'>
			  <input mapping='{"value":"birthday.day"}'>
	    
		<p>
		  <b>��������</b><br/><br/>
		  �û���Ϊ<label mapping='{"text":"username"}'></label>,
		  ������<label mapping='{"text":"birthday.year"}'></label>��
		  <label mapping='{"text":"birthday.mouth"}'></label>��
		  <label mapping='{"text":"birthday.day"}'></label>�ա�
		</p>
	 </div>
	
   js:
	   var userInfo={username:"xxx",birthday:{year:1771,mouth:1,day:1}};
	   $(function(){
		 $("#content").bindData(userInfo);
	   })
	   
	���Ӷ������Ӷ������һ����ʾuserInfo�仯�Ĺ��ܣ�����jsд�����ܸɾ���
	
����3:
   html:
	<div id="content">
	   ����1:<input mapping='{"value":"description"}'><br/>
	   ����2:<input mapping='{"value":"description"}'><br/>
	   ��ʾ��<div mapping='{"text":"description"}'></div>
	</div>
	
   js:
	   var boxInfo={name:"blue box",description:"I am a blue box"};
	   $(function(){
		 $("#content").bindData(boxInfo);
	   })
	��������е�����Ԫ����ʾ������һ������ͬ���仯��
*/