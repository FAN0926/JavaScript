// ==UserScript==
// @name         Btsow_Change
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  将btsow搜索出的标题栏换为磁力链接，不用再点进去了，配套115lixian+chaxun使用!
// @author       Pinef
// @match        https://btsow.fun/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var elements= document.getElementsByClassName("data-list");
    var patt = /hash\/(.*)/;
    for(let i = 0;i<elements[0].children.length;i++){
        //console.log(elements[0].children[i].children[0].href);
        var result = patt.exec(elements[0].children[i].children[0].href);
        if (result != null){
            elements[0].children[i].children[0].href="magnet:?xt=urn:btih:"+result[1];
        }
    }
})();