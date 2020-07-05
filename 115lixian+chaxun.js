// ==UserScript==
// @name         115lixian+chaxun
// @namespace    pinef.115lixian
// @version      0.5
// @description  alt单击 添加115离线任务 单击查询115里是否存在 不存在跳转btclub查询
// @author       pinef
// @match        http://*/*
// @match        https://*/*
// @require      https://cdn.bootcss.com/jquery/2.2.1/jquery.min.js
// @require      https://cdn.bootcss.com/toastr.js/latest/js/toastr.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      115.com

// v0.5 修改btsow.fun为btsow.space，增加了延时函数，每隔5s访问一次btsow，减少被墙概率
// v0.4 访问次数过多被403了，增加一个flag BtSearch判断是否开启btsow查询
// v0.3 增加了打开FC2网页后，会在title后自动显示id号，同时查询115中是否含有该番号的内容，若没有则继续查询btsow中是否有相关资源，若有则标记为金黄色
// V0.2 增加了查询115内不存在后跳转btsow
// v0.1 实现了按住alt键，点击磁力链接能自动115离线，点击选中的文本内容自动查询115内是否存在相关内容
// ==/UserScript==

(function() {
    'use strict';

    var uidkey = '115-uid';
    var sign115 = '115-sign';
    var sign_url = 'http://115.com/?ct=offline&ac=space';
    var add_task_url = 'http://115.com/web/lixian/?ct=lixian&ac=add_task_url';
    var toastr_css = '.toast-title{font-weight:700}.toast-message{-ms-word-wrap:break-word;word-wrap:break-word}.toast-message a,.toast-message label{color:#fff}.toast-message a:hover{color:#ccc;text-decoration:none}.toast-close-button{position:relative;right:-.3em;top:-.3em;float:right;font-size:20px;font-weight:700;color:#fff;-webkit-text-shadow:0 1px 0 #fff;text-shadow:0 1px 0 #fff;opacity:.8;-ms-filter:alpha(Opacity=80);filter:alpha(opacity=80)}.toast-close-button:focus,.toast-close-button:hover{color:#000;text-decoration:none;cursor:pointer;opacity:.4;-ms-filter:alpha(Opacity=40);filter:alpha(opacity=40)}button.toast-close-button{padding:0;cursor:pointer;background:0 0;border:0;-webkit-appearance:none}.toast-top-center{top:0;right:0;width:100%}.toast-bottom-center{bottom:0;right:0;width:100%}.toast-top-full-width{top:0;right:0;width:100%}.toast-bottom-full-width{bottom:0;right:0;width:100%}.toast-top-left{top:12px;left:12px}.toast-top-right{top:12px;right:12px}.toast-bottom-right{right:12px;bottom:12px}.toast-bottom-left{bottom:12px;left:12px}#toast-container{position:fixed;z-index:999999}#toast-container *{-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box}#toast-container>div{position:relative;overflow:hidden;margin:0 0 6px;padding:15px 15px 15px 50px;width:300px;-moz-border-radius:3px;-webkit-border-radius:3px;border-radius:3px;background-position:15px center;background-repeat:no-repeat;-moz-box-shadow:0 0 12px #999;-webkit-box-shadow:0 0 12px #999;box-shadow:0 0 12px #999;color:#fff;opacity:.8;-ms-filter:alpha(Opacity=80);filter:alpha(opacity=80)}#toast-container>:hover{-moz-box-shadow:0 0 12px #000;-webkit-box-shadow:0 0 12px #000;box-shadow:0 0 12px #000;opacity:1;-ms-filter:alpha(Opacity=100);filter:alpha(opacity=100);cursor:pointer}#toast-container>.toast-info{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGwSURBVEhLtZa9SgNBEMc9sUxxRcoUKSzSWIhXpFMhhYWFhaBg4yPYiWCXZxBLERsLRS3EQkEfwCKdjWJAwSKCgoKCcudv4O5YLrt7EzgXhiU3/4+b2ckmwVjJSpKkQ6wAi4gwhT+z3wRBcEz0yjSseUTrcRyfsHsXmD0AmbHOC9Ii8VImnuXBPglHpQ5wwSVM7sNnTG7Za4JwDdCjxyAiH3nyA2mtaTJufiDZ5dCaqlItILh1NHatfN5skvjx9Z38m69CgzuXmZgVrPIGE763Jx9qKsRozWYw6xOHdER+nn2KkO+Bb+UV5CBN6WC6QtBgbRVozrahAbmm6HtUsgtPC19tFdxXZYBOfkbmFJ1VaHA1VAHjd0pp70oTZzvR+EVrx2Ygfdsq6eu55BHYR8hlcki+n+kERUFG8BrA0BwjeAv2M8WLQBtcy+SD6fNsmnB3AlBLrgTtVW1c2QN4bVWLATaIS60J2Du5y1TiJgjSBvFVZgTmwCU+dAZFoPxGEEs8nyHC9Bwe2GvEJv2WXZb0vjdyFT4Cxk3e/kIqlOGoVLwwPevpYHT+00T+hWwXDf4AJAOUqWcDhbwAAAAASUVORK5CYII=)!important}#toast-container>.toast-error{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHOSURBVEhLrZa/SgNBEMZzh0WKCClSCKaIYOED+AAKeQQLG8HWztLCImBrYadgIdY+gIKNYkBFSwu7CAoqCgkkoGBI/E28PdbLZmeDLgzZzcx83/zZ2SSXC1j9fr+I1Hq93g2yxH4iwM1vkoBWAdxCmpzTxfkN2RcyZNaHFIkSo10+8kgxkXIURV5HGxTmFuc75B2RfQkpxHG8aAgaAFa0tAHqYFfQ7Iwe2yhODk8+J4C7yAoRTWI3w/4klGRgR4lO7Rpn9+gvMyWp+uxFh8+H+ARlgN1nJuJuQAYvNkEnwGFck18Er4q3egEc/oO+mhLdKgRyhdNFiacC0rlOCbhNVz4H9FnAYgDBvU3QIioZlJFLJtsoHYRDfiZoUyIxqCtRpVlANq0EU4dApjrtgezPFad5S19Wgjkc0hNVnuF4HjVA6C7QrSIbylB+oZe3aHgBsqlNqKYH48jXyJKMuAbiyVJ8KzaB3eRc0pg9VwQ4niFryI68qiOi3AbjwdsfnAtk0bCjTLJKr6mrD9g8iq/S/B81hguOMlQTnVyG40wAcjnmgsCNESDrjme7wfftP4P7SP4N3CJZdvzoNyGq2c/HWOXJGsvVg+RA/k2MC/wN6I2YA2Pt8GkAAAAASUVORK5CYII=)!important}#toast-container>.toast-success{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADsSURBVEhLY2AYBfQMgf///3P8+/evAIgvA/FsIF+BavYDDWMBGroaSMMBiE8VC7AZDrIFaMFnii3AZTjUgsUUWUDA8OdAH6iQbQEhw4HyGsPEcKBXBIC4ARhex4G4BsjmweU1soIFaGg/WtoFZRIZdEvIMhxkCCjXIVsATV6gFGACs4Rsw0EGgIIH3QJYJgHSARQZDrWAB+jawzgs+Q2UO49D7jnRSRGoEFRILcdmEMWGI0cm0JJ2QpYA1RDvcmzJEWhABhD/pqrL0S0CWuABKgnRki9lLseS7g2AlqwHWQSKH4oKLrILpRGhEQCw2LiRUIa4lwAAAABJRU5ErkJggg==)!important}#toast-container>.toast-warning{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGYSURBVEhL5ZSvTsNQFMbXZGICMYGYmJhAQIJAICYQPAACiSDB8AiICQQJT4CqQEwgJvYASAQCiZiYmJhAIBATCARJy+9rTsldd8sKu1M0+dLb057v6/lbq/2rK0mS/TRNj9cWNAKPYIJII7gIxCcQ51cvqID+GIEX8ASG4B1bK5gIZFeQfoJdEXOfgX4QAQg7kH2A65yQ87lyxb27sggkAzAuFhbbg1K2kgCkB1bVwyIR9m2L7PRPIhDUIXgGtyKw575yz3lTNs6X4JXnjV+LKM/m3MydnTbtOKIjtz6VhCBq4vSm3ncdrD2lk0VgUXSVKjVDJXJzijW1RQdsU7F77He8u68koNZTz8Oz5yGa6J3H3lZ0xYgXBK2QymlWWA+RWnYhskLBv2vmE+hBMCtbA7KX5drWyRT/2JsqZ2IvfB9Y4bWDNMFbJRFmC9E74SoS0CqulwjkC0+5bpcV1CZ8NMej4pjy0U+doDQsGyo1hzVJttIjhQ7GnBtRFN1UarUlH8F3xict+HY07rEzoUGPlWcjRFRr4/gChZgc3ZL2d8oAAAAASUVORK5CYII=)!important}#toast-container.toast-bottom-center>div,#toast-container.toast-top-center>div{width:300px;margin:auto}#toast-container.toast-bottom-full-width>div,#toast-container.toast-top-full-width>div{width:96%;margin:auto}.toast{background-color:#030303}.toast-success{background-color:#51a351}.toast-error{background-color:#bd362f}.toast-info{background-color:#2f96b4}.toast-warning{background-color:#f89406}.toast-progress{position:absolute;left:0;bottom:0;height:4px;background-color:#000;opacity:.4;-ms-filter:alpha(Opacity=40);filter:alpha(opacity=40)}@media all and (max-width:240px){#toast-container>div{padding:8px 8px 8px 50px;width:11em}#toast-container .toast-close-button{right:-.2em;top:-.2em}}@media all and (min-width:241px) and (max-width:480px){#toast-container>div{padding:8px 8px 8px 50px;width:18em}#toast-container .toast-close-button{right:-.2em;top:-.2em}}@media all and (min-width:481px) and (max-width:768px){#toast-container>div{padding:15px 15px 15px 50px;width:25em}}';

    (function setUserID() {
        if(location.hostname.indexOf('115.com') != -1) {
            if(unsafeWindow.USER_ID) {
                GM_setValue(uidkey, unsafeWindow.USER_ID);
            }
        }
    })();

    function getUserID() {
        return GM_getValue(uidkey);
    }

    function get115Sign() {
        return new Promise(function(resolve, reject){
            var time = Date.now();
            GM_xmlhttpRequest({
                method: 'GET',
                url: sign_url,
                onload: function(response) {
                    var json = JSON.parse(response.responseText);
                    resolve(json);
                },
                onerror: function(err) {
                    reject(err);
                },
            });
        });
    }

    function param(data) {
        var res = '';
        for(var key in data){
            var value = data[key];
            res += '&' + encodeURIComponent( key ) + "=" + encodeURIComponent( value );
        }
        return res.slice(1);
    }

    var css_ok = false;
    function addUrlTask(url) {
        return get115Sign().then(function(json){
            if(!css_ok) {
                GM_addStyle(toastr_css);
                css_ok = true;
            }
            return new Promise(function(resolve, reject){
                var data = {
                    uid: getUserID(),
                    sign: json.sign,
                    time: json.time,
                    url: url
                };
                GM_xmlhttpRequest({
                    method: 'POST',
                    data: param(data),
                    url: add_task_url,
                    headers:    {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Accept": "application/json, text/javascript, */*; q=0.01",
                        Origin: "http://115.com",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    onload: function(response) {
                        var json = JSON.parse(response.responseText);
                        resolve(json);
                    },
                    onerror: function(err) {
                        reject(err);
                    },
                });

            });
        });
    }

    function getValidUrl(e) {
      var target = e.target;
        while (target) {
            if (target.href) {
              return target.href;
            }
            target = target.parentNode;
        }
    }

    function request(url) {  //++
        return new Promise(resolve => {
            //let time1 = new Date();
            GM_xmlhttpRequest({
                url,
                method: 'GET',
                headers:  {
                    "Cache-Control": "no-cache"
                },
                timeout: 30000,
                onload: response => { //console.log(url + " reqTime:" + (new Date() - time1));
                    resolve(response);
                },
                onabort: (e) =>{
                    console.log(url + " abort");
                    resolve("wrong");
                },
                onerror: (e) =>{
                    console.log(url + " error");
                    console.log(e);
                    resolve("wrong");
                },
                ontimeout: (e) =>{
                    console.log(url + " timeout");
                    resolve("wrong");
                },
            });
        });
    }
	/**
	 * 查询115网盘是否拥有番号
	 * @param javId 番号
	 * @param callback 回调函数
	 */
	//function search115Data(javId, callback) {  //++
	function search115Data(javId) {  //++
		//请求搜索115番号 //115查询
		let javId2 = javId.replace(/(-)./g, "");
		let promise1 = request(`https://webapi.115.com/files/search?search_value=${javId}%20${javId2}&format=json`);
		promise1.then((result) => {
			let resultJson = JSON.parse(result.responseText);
			if(resultJson.count > 0) {
				let pickcode = '';
				for (let i = 0; i < resultJson.data.length; i++) {
					let row = resultJson.data[i];
					if(row.vdi){//iv vdi ico
						pickcode = row.pc;
						toastr.warning(`${resultJson.data[0].n.replace(/\\/g, "%")}存在,路径${resultJson.data[0].dp.replace(/\\/g, "%")}`,`http://120.78.32.31/play.html?pickcode=${pickcode}`);
						break;
					}
				}
			}
			else{
				toastr.error(`网盘中不存在该片:${javId}`);
				var btclub_url = "https://btsow.space/search/" + javId2 ;
				window.open(btclub_url,"_blank");
			}
			//callback(false,null);
		});
	}

    function search115DataForFC2(javId, callback) {
            //异步请求搜索115番号 //115查询
            //console.log("进入异步请求搜索115番号");
            let javId2 = javId.replace(/(-)/g, "");
            let promise1 = request(`https://webapi.115.com/files/search?search_value=${javId}%20${javId2}&format=json`);
            promise1.then((result) => {
                let resultJson = JSON.parse(result.responseText);
                if(resultJson.count > 0) {
                    let pickcode = '';
                    for (let i = 0; i < resultJson.data.length; i++) {
                        let row = resultJson.data[i];
                        if(row.vdi){//iv vdi ico
                            pickcode = row.pc;
                            callback(true,`http://120.78.32.31/play.html?pickcode=${pickcode}`);
                            return;
                        }
                    }
                }
                callback(false,null);
            });
        }

        function searchBtForFC2(javId, callback) {
            //异步请求搜索BT番号 //115查询
            //增加睡眠时间,单位ms
            sleep(5000);
            console.log("进入异步请求搜索btsow"+ Date.now());
            let javId2 = javId.replace(/(-)/g, "");
            let promise1 = request(`https://btsow.space/search/${javId2}`);
            promise1.then((result) => {
                //let resultJson = JSON.parse(result.responseText);
                let resultTag = /Torrent Description/.test(result.responseText);
                if(resultTag){
                    console.log("存在资源");
                    callback(true);
                }else{
                    console.log("不存在资源");
                    callback(false);
                }
            });
        }

    document.body.addEventListener('click', function(e){
        if(e.altKey) {
			e.preventDefault();
			var url = getValidUrl(e);
			console.log(url);
			if (url){
				console.log("进入url");
				if(/magnet/i.test(url)) {
					console.log("进入magenet");
					e.preventDefault();
					addUrlTask(url).then(function(json){
						if(json.state) {
							toastr.success(url, "任务添加成功");
						} else {
							toastr.warning(url, json.error_msg || "任务添加出错");
						}
					}, function(err) {
						toastr.error(url, "网络出错");
					});
				}else if(/id=(\d+)/i.exec(url)) {     //针对FC2中的查询
					console.log("进入FC2查询");
					if(!css_ok) {
						GM_addStyle(toastr_css);
						css_ok = true;
					}
					e.preventDefault();
					search115Data(/id=(\d+)/i.exec(url)[1]);
				}else if(/fc2-ppv-(\d+)/i.exec(url)) {     //针对FC2中的查询
					console.log("进入FC2fan查询");
					if(!css_ok) {
						GM_addStyle(toastr_css);
						css_ok = true;
					}
					e.preventDefault();
					search115Data(/fc2-ppv-(\d+)/i.exec(url)[1]);
				}else if(window.getSelection?window.getSelection():document.selection.createRange().text.toString() !== undefined){
					e.preventDefault();
					console.log("进入url选取查询");
					if(!css_ok) {
						GM_addStyle(toastr_css);
						css_ok = true;
					}
					var txt = window.getSelection?window.getSelection():document.selection.createRange().text;
					console.log("查询关键字为："+txt.toString().length.typeof+"xx");
					search115Data(txt.toString());

					}
				else{toastr.error("链接有误",url);}
			}

			else if(window.getSelection?window.getSelection():document.selection.createRange().text != null){
				e.preventDefault();
				console.log("进入选取查询");
				if(!css_ok) {
					GM_addStyle(toastr_css);
					css_ok = true;
				}
				var txt2 = window.getSelection?window.getSelection():document.selection.createRange().text;
				search115Data(txt2.toString());

			}
        }
    }, true);

    //粗暴的睡眠函数，减少请求btsow频率
    function sleep(d){
        for(var t = Date.now();Date.now() - t <= d;);
    }

    //增加了打开FC2网页后，会在title后自动显示id号
    function Run(){
        console.log("进入run");
        var elements= document.getElementsByClassName("title");
        var patt = /id=(\d+)/;
        for(var i = 0;i<elements.length;i++){
            var result = patt.exec(elements[i].childNodes[0].href);
            if (result != null){
                //console.log(result[0]);
                var para = document.createElement("tr");
                var node = document.createTextNode(result[1]);
                var att=document.createAttribute("id");
                att.value=result[1];
                para.setAttributeNode(att);
                para.appendChild(node);
                elements[i].appendChild(para);
                let avid = result[1];
                //let BtSearch = false;
                let BtSearch = true;


                search115DataForFC2(avid, function (BOOLEAN_TYPE, playUrl) {
                    console.log("进入BOOLEAN_TYPE判断"+BOOLEAN_TYPE);
                    var fontColor=document.createAttribute("style");
                    if (BOOLEAN_TYPE) {
                        document.getElementById(avid).innerHTML =avid+" 网盘有";
                        fontColor.value="color:green";

                    }else{
                        document.getElementById(avid).innerHTML =avid+" 网盘没有";
                        fontColor.value="color:red";
                        if(BtSearch){
                            searchBtForFC2(avid, function (BOOLEAN_TYPE) {
                                console.log("进入searchBtForFC2判断"+BOOLEAN_TYPE);
                                var fontColor=document.createAttribute("style");
                                if (BOOLEAN_TYPE) {
                                    document.getElementById(avid).innerHTML =document.getElementById(avid).innerHTML + " BT有";
                                    if(document.getElementById(avid).style.color == "red"){
                                        fontColor.value="color:Gold";
                                        document.getElementById(avid).setAttributeNode(fontColor);
                                    }
                                }else{
                                    document.getElementById(avid).innerHTML =document.getElementById(avid).innerHTML + " BT没有";
                                }
                            });
                        }
                    }
                    document.getElementById(avid).setAttributeNode(fontColor);
                });
                //setTimeout(function(){ console.log(document.getElementById(avid).innerHTML); }, 3000);
                console.log(document.getElementById(avid).innerHTML);
            }
        }
    }

    if(/fc2/i.test(location.href)) {
        Run();
    }

})();