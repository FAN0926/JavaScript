// ==UserScript==
// @name                115Rename_pinef
// @namespace           http://tampermonkey.net/
// @version             0.8
// @description         115改名称(根据现有的文件名<番号>查询、翻译并修改文件名)+javbest +FC2 -avsox
// @0.5                 原始版本
// @0.6                 2020.3.18 FC2支持
// @0.7                 2020.3.19百度翻译文件名支持
// @0.8          		2020.3.19javbest支持，暂时去除avsox
// @author              pinef
// @include             https://115.com/*
// @domain              javbus.com
// @domain              avmask.com
// @domain              avsox.host
// @domain              adult.contents.fc2.com
// @domain              fanyi-api.baidu.com
// @domain              javbest.net
// @grant               GM_notification
// @grant               GM_xmlhttpRequest
// ==/UserScript==

(function () {
    // 按钮
    let rename_list = `
            <li id="rename_list">
                <a id="rename_all_javbus" class="mark" href="javascript:;">改名javbus</a>
                <a id="rename_all_javbest" class="mark" href="javascript:;">改名javbest</a>
				<a id="rename_all_Fc2" class="mark" href="javascript:;">改名FC2</a>
            </li>
        `;
    /**
     * 添加按钮的定时任务
     */
    let interval = setInterval(buttonInterval, 1000);

	//FC2
	let Fc2Search = "https://adult.contents.fc2.com/article/";
	let javbestSearch = "http://javbest.net/?s=";

    // javbus
    let javbusBase = "https://www.javbus.com/";
    // 有码
    let javbusSearch = javbusBase + "search/";
    // 无码
    let javbusUncensoredSearch = javbusBase + "uncensored/search/";

    // avmoo
    // 有码
    let avmooSearch = "https://avmask.com/cn/search/";
    // 无码
    let avmooUncensoredSearch = "https://avsox.host/cn/search/";
	var result;
    'use strict';


    /**
     * 添加按钮定时任务(检测到可以添加时添加按钮)
     */
    function buttonInterval() {
        let open_dir = $("div#js_float_content li[val='open_dir']");
        if (open_dir.length !== 0 && $("li#rename_list").length === 0) {
            open_dir.before(rename_list);
            $("a#rename_all_javbus").click(
                function () {
                    rename(rename_javbus);
                });
            // $("a#rename_all_avmoo").click(
                // function () {
                    // rename(rename_avmoo);
                // });
			$("a#rename_all_Fc2").click(
                function () {
                    rename(rename_Fc2);
                });
			$("a#rename_all_javbest").click(
                function () {
                    rename(rename_javbest);
                });
            console.log("添加按钮");
            // 结束定时任务
            clearInterval(interval);
        }
    }

    /**
     * 执行改名方法
     * @param call 回调函数
     */
    function rename(call) {
        // 获取所有已选择的文件
        let list = $("iframe[rel='wangpan']")
            .contents()
            .find("li.selected")
            .each(function (index, v) {
                let $item = $(v);
                // 原文件名称
                let file_name = $item.attr("title");
                // 文件类型
                let file_type = $item.attr("file_type");

                // 文件id
                let fid;
                // 后缀名
                let suffix;
                if (file_type === "0") {
                    // 文件夹
                    fid = $item.attr("cate_id");
                } else {
                    // 文件
                    fid = $item.attr("file_id");
                    // 处理后缀
                    let lastIndexOf = file_name.lastIndexOf('.');
                    if (lastIndexOf !== -1) {
                        suffix = file_name.substr(lastIndexOf, file_name.length);
                    }
                }

                if (fid && file_name) {
                    let fh = getVideoCode(file_name);
                    if (fh) {
                        // 校验是否是中文字幕
                        let chineseCaptions = checkChineseCaptions(fh, file_name);
                        // 执行查询
                        call(fid, fh, suffix, chineseCaptions);
                    }
					else{
						GM_notification(getDetails(file_name, "文件名中未发现车牌",0));
					}
                }
            });

    }

	/**
     * 通过FC2进行查询
     */
    function rename_Fc2(fid, fh, suffix, chineseCaptions) {
        requestFC2(fid, fh, suffix, chineseCaptions, Fc2Search);
    }

    /**
     * 请求FC2,并请求115进行改名
     * @param fid               文件id
     * @param fh                番号
     * @param suffix            后缀
     * @param chineseCaptions   是否有中文字幕
     * @param url               请求地址
     */
    function requestFC2(fid, fh, suffix, chineseCaptions, url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url + fh +"/",
            onload: xhr => {
                // 匹配标题
                let response = $(xhr.responseText);
                let title = response
                    .find("div.items_article_MainitemThumb img")
                    .attr("title");
				fh = "FC2-PPV-" + fh
                if (title) {
                    // 构建新名称
                    let newName = buildNewName(fh, suffix, chineseCaptions, title);
					console.log("获取到的newname为："+newName);
                    if (newName) {
                        // 修改名称
						getTranslate(newName,fid,fh);
                    }
                } else {
                    // 未查询到结果
					GM_notification(getDetails(fh, "FC2未查询到结果",0));                    
                }
            }
        })
    }
	
	/**
     * 通过javbest进行查询
     */
    function rename_javbest(fid, fh, suffix, chineseCaptions) {
        requestJavbest(fid, fh, suffix, chineseCaptions, javbestSearch);
    }

    /**
     * 请求javbest,并请求115进行改名
     * @param fid               文件id
     * @param fh                番号
     * @param suffix            后缀
     * @param chineseCaptions   是否有中文字幕
     * @param url               请求地址
     */
    function requestJavbest(fid, fh, suffix, chineseCaptions, url) {
        GM_xmlhttpRequest({
            method: "GET",
			url: url + fh +"+",
            onload: xhr => {
                // 匹配标题
                let response = $(xhr.responseText);
                let title = response
                    .find("header.single-entry-header a.h1")
					.text();
                if (title) {
                    // 构建新名称
					fh = "";
                    let newName = buildNewName(fh, suffix, chineseCaptions, title);
					//console.log("获取到的newname为："+newName);
                    if (newName) {
                        // 修改名称
						getTranslate(newName,fid,fh);
                    }
                } else {
                    // 未查询到结果
					GM_notification(getDetails(fh, "javbest未查询到结果",0));                    
                }
            }
        })
    }

    /**
     * 通过javbus进行查询
     */
    function rename_javbus(fid, fh, suffix, chineseCaptions) {
        requestJavbus(fid, fh, suffix, chineseCaptions, javbusSearch);
    }

    /**
     * 请求javbus,并请求115进行改名
     * @param fid               文件id
     * @param fh                番号
     * @param suffix            后缀
     * @param chineseCaptions   是否有中文字幕
     * @param url               请求地址
     */
    function requestJavbus(fid, fh, suffix, chineseCaptions, url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url + fh,
            onload: xhr => {
                // 匹配标题
                let response = $(xhr.responseText);

                let title = response
                    .find("div.photo-frame img")
                    .attr("title");

                if (title) {
                    // 构建新名称
                    let newName = buildNewName(fh, suffix, chineseCaptions, title);
                    if (newName) {
                        // 修改名称
                        getTranslate(newName,fid,fh);
                    }
                } else if (url !== javbusUncensoredSearch) {
                    // 进行无码重查询
                    requestJavbus(fid, fh, suffix, chineseCaptions, javbusUncensoredSearch);
                }
            }
        })
    }

    /**
     * 通过avmoo进行查询
     */
    function rename_avmoo(fid, fh, suffix, chineseCaptions) {
        requestAvmoo(fid, fh, suffix, chineseCaptions, avmooSearch);
    }

    /**
     * 请求avmoo,并请求115进行改名
     * @param fid               文件id
     * @param fh                番号
     * @param suffix            后缀
     * @param chineseCaptions   是否有中文字幕
     * @param url               请求地址
     */
    function requestAvmoo(fid, fh, suffix, chineseCaptions, url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url + fh,
            onload: xhr => {
                // 匹配标题
                let response = $(xhr.responseText);
                if (!(response.find("div.alert").length)) {
                    let title = response
                        .find("div.photo-frame img")
                        .attr("title");

                    // 构建新名称
                    let newName = buildNewName(fh, suffix, chineseCaptions, title);
                    if (newName) {
                        // 修改名称
                        //send_115(fid, newName, fh);
						getTranslate(newName,fid,fh);
                    }
                } else if (url !== avmooUncensoredSearch) {
                    // 进行无码查询
                    requestAvmoo(fid, fh, suffix, chineseCaptions, avmooUncensoredSearch);
                }
            }
        })
    }

    /**
     * 构建新名称
     * @param fh                番号
     * @param suffix            后缀
     * @param chineseCaptions   是否有中文字幕
     * @param title             番号标题
     * @returns {string}        新名称
     */
    function buildNewName(fh, suffix, chineseCaptions, title) {
        if (title) {
			var newName = ""
            //let newName = String(fh);
            // 有中文字幕
            if (chineseCaptions) {
                newName = "【中文字幕】";
            }
            // 拼接标题
            newName = newName + " " + title + " " + String(fh);
            if (suffix) {
                // 文件保存后缀名
                newName = newName + suffix;
            }
            return newName;
        }
    }

    /**
     * 请求115接口
     * @param id 文件id
     * @param name 要修改的名称
     * @param fh 番号
     */
    function send_115(id, name, fh) {

        let file_name = stringStandard(name);
		//console.log("标准处理后的name："+file_name);
        $.post("https://webapi.115.com/files/edit", {
                fid: id,
                file_name: file_name
            },
            function (data, status) {
                let result = JSON.parse(data);
                if (!result.state) {
                    GM_notification(getDetails(fh, "修改失败",0));
                    console.log("请求115接口异常: " + unescape(result.error
                        .replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1')));
                } else {
                    GM_notification(getDetails(fh, "修改成功"+file_name,3000));
                    console.log("修改文件名称,fh:" + fh, "name:" + file_name);
                }
            }
        );
    }

    /**
     * 通知参数
     * @param text 内容
     * @param title 标题
     * @returns {{text: *, title: *, timeout: number}}
     */
    function getDetails(text, title,timeout) {
        return {
            text: text,
            title: title,
            timeout: timeout
        };
    }

    /**
     * 115名称不接受(\/:*?\"<>|)
     * @param name
     */
    function stringStandard(name) {
        return name.replace(/\\/g, "")
            .replace(/\//g, " ")
            .replace(/:/g, " ")
            .replace(/\?/g, " ")
            .replace(/"/g, " ")
            .replace(/</g, " ")
            .replace(/>/g, " ")
            .replace(/\|/g, "")
            .replace(/\*/g, " ");
    }

    /**
     * 校验是否为中文字幕
     * @param fh    番号
     * @param title 标题
     */
    function checkChineseCaptions(fh, title) {
        if (title.indexOf("中文字幕") !== -1) {
            return true;
        }
        let regExp = new RegExp(fh + "[_-]C");
        let match = title.toUpperCase().match(regExp);
        if (match) {
            return true;
        }
    }

    /**
     * 获取番号
     * @param title         源标题
     * @returns {string}    提取的番号
     */
    function getVideoCode(title) {
        title = title.toUpperCase().replace("SIS001", "")
            .replace("1080P", "")
            .replace("720P", "")
			.replace("[JAV] [UNCENSORED]","")
			.replace("[THZU.CC]","")
			.replace("[22SHT.ME]","")
			.replace("[7SHT.ME]","")
			.replace("-HD","");

        let t = title.match(/T28[\-_]\d{3,4}/);
        // 一本道
        if (!t) {
            t = title.match(/1PONDO[\-_]\d{6}[\-_]\d{2,4}/);
            if (t) {
                t = t.toString().replace("1PONDO_", "")
                    .replace("1PONDO-", "");
            }
        }
        if (!t) {
            t = title.match(/HEYZO[\-_]?\d{4}/);
        }
        if (!t) {
            // 加勒比
            t = title.match(/CARIB[\-_]\d{6}[\-_]\d{3}/);
            if (t) {
                t = t.toString().replace("CARIB-", "")
                    .replace("CARIB_", "");
            }
        }
        if (!t) {
            // 东京热
            t = title.match(/N[-_]\d{4}/);
        }
        if (!t) {
            // Jukujo-Club | 熟女俱乐部
            t = title.match(/JUKUJO[-_]\d{4}/);
        }
		if (!t) {
            // FC2 PPV
            t = title.match(/FC2[-_ ]{0,2}PPV[-_ ]{0,2}(\d{6,7})/);
			if(t){
				console.log("找到番号:" + t[0]);
				//console.log("返回番号:" + t[1]);
				return t[1];
			}
        }
		if (!t) {
			//FC2
			t = title.match(/FC(\d{6,7})/);
			if(t){
				console.log("找到番号:" + t[0].replace("FC","FC2-PPV-"));
				//console.log("返回番号:" + t[1]);
				return t[1];
			}
		}
		if (!t) {
            // 东京热
            t = title.match(/\d{3}[A-Z]{4}[-_ ]*\d{3,4}/);
        }
        // 通用
        if (!t) {
            t = title.match(/[A-Z]{2,5}[-_]\d{3,5}/);
        }
        if (!t) {
            t = title.match(/\d{6}[\-_]\d{2,4}/);
        }
        if (!t) {
            t = title.match(/[A-Z]+\d{3,5}/);
        }
        if (!t) {
            t = title.match(/[A-Za-z]+[-_]?\d+/);
        }
        if (!t) {
            t = title.match(/\d+[-_]?\d+/);
        }
        if (!t) {
            //t = title;
			return null;
        }
        if (t) {
            t = t.toString().replace("_", "-");
            console.log("找到番号:" + t);
            return t;
        }
    }


	/**
	 * 翻译文件名
     * @param title         源标题
     * @returns String    翻译后的标题
	*/
	function translate(title){
		return new Promise(function(resolve, reject){
			var appid = '20200319000401000';
			var key = 'P0oG_zQRKD7lqoGEKNcL';
			var salt = (new Date).getTime();
			var query = title.replace(/\s/g,"");
			//console.log("translate函数获得的query:"+query);
			//console.log("translate函数获得的query的类型为:"+typeof(query));
			// 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
			var fromlan = 'jp';
			var to = 'zh';
			var str1 = appid + query + salt +key;
			//console.log("str1:"+str1);
			var sign = MD5(str1);
			var result;
			GM_xmlhttpRequest({
				method: "GET",
				url: 'https://fanyi-api.baidu.com/api/trans/vip/translate?'
				+ "q=" + query + "&appid=" + appid + "&salt=" + salt
				+ "&from=" + fromlan + "&to=" + to + "&sign=" + sign,
				onload: xhr1 => {
					// 匹配标题
					var jsonobj = JSON.parse(xhr1.response)
					//console.log(jsonobj);
					//console.log(jsonobj['trans_result'][0]['dst']);
					result = jsonobj['trans_result'][0]['dst'];
					resolve(result);
				},
				onerror: function(err) {
                    reject(err);
                },
			});
		// $.ajax({
			// url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
			// type: 'get',
			// dataType: 'jsonp',
			// data: {
                // async: false,
				// q: query,
				// appid: appid,
				// salt: salt,
				// from: from,
				// to: to,
				// sign: sign
			// },
			// success: function (data) {
				//console.log(data);
				// console.log(data['trans_result'][0]['dst']);
				// result = data['trans_result'][0]['dst'];
			// }
		// });
        });
	}
	
	function getTranslate(title,fid,fh){
		//console.log("getTranslate函数获得的name:"+title);
		//console.log("getTranslate函数获得的name的类型为:"+typeof(title));
		translate(title).then(function(json){
			if (json){
				//console.log("翻译出来的name:"+json);
				//json.replace("FC ","FC");
				send_115(fid, json.replace("FC ","FC"), fh);
			}
		});
	}
	var MD5 = function (string) {

    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };

    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    };

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
}


})();