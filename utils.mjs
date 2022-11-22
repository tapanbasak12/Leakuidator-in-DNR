//From Leakuidator Github
"use strict";

// chrome doesn't allow extensions to set unsafe headers for a request
// list of forbidden headers based on this spec: https://fetch.spec.whatwg.org/#forbidden-header-name
var unsafeHeaders = [ 'accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method',
                        'connection', 'content-length', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin',
                        'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'via' , 'proxy-', 'sec-', 'user-agent' ];
// User-Agent was not listed in ref page, but chrome doesn't allow it to be set by js.
var unsafeHeadersStart = [ 'Proxy-', 'Sec-' ];

class Utils {

    // TODO: re-evaluate necessity of this fucntion
    isEmpty(str) {
        if(str == undefined || str == null || str == "" || str == []) {
            return true;
        } else {
            return false;
        }
    }

    headerValue(array, key){
        for(let i = 0, l = array.length; i < l; i++)
        {
            if(array[i].name.toLowerCase() == key.toLowerCase())
            {
                return array[i].value.toLowerCase();
            }
        }
        return undefined;
    }
    // TODO: remove headerValue2 func if there is no use
    headerValue2(array, key){
        /*let value = array.get(key);
        if(value != undefined && value != null)
        {
            return value.toLowerCase();
        }*/
        for (let hdr of array) {
            if (hdr.name.toLowerCase() == key.toLowerCase()) {
                if(hdr.value != undefined && hdr.value != null) {
                    return hdr.value.toLowerCase();
                } else {
                    return undefined;
                }
            }
        }
        return undefined;
    }
    
    headerExists(details, key){
        /*for (let i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name.toLowerCase() == key.toLowerCase()) {
                return true;
            }
        }*/
        for (let hdr of details.requestHeaders) {
            if (hdr.name.toLowerCase() == key.toLowerCase()) {
                return true;
            }
        }
        return false;
    }
    
    // TODO: remove printHeaders func if there is no use
    printHeaders(details){
        for (let i = 0; i < details.requestHeaders.length; ++i) {
            console.log( details.requestId +  " header name : " + details.requestHeaders[i].name.toLowerCase() + " header value: " + details.requestHeaders[i].value.toLowerCase());
        }
    }
    
    // TODO: combine with removeResponseHeaders function
    removeRequestHeaders(details, key) {
        for (let i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name.toLowerCase() == key.toLowerCase()) {
                details.requestHeaders.splice(i, 1);
            }
        }
        return details.requestHeaders;
    }
    
    // TODO: combine with removeRequestHeaders function
    removeResponseHeaders(details, key) {
        for (let i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name.toLowerCase() == key.toLowerCase()) {
                details.responseHeaders.splice(i, 1);
            }
        }
        return details.responseHeaders;
    }
    
    combineOrigin(origin) {
        if(this.isEmpty(origin)) {
            return undefined;
        } else {
            var url = origin.hostname;
            if(!this.isEmpty(origin.protocol)) {
                url = origin.protocol + "//" + url;
            }
            if(!this.isEmpty(origin.port)) {
                url = url + ":" + origin.port;
            }
        }
        return url;
    }
    
    getOriginFromUrl(url){
        try {
            // TO-DO:
            // URL api may fail sometimes for webrequests with unnormal urls.
            // check if this affects the detection mechanism.
            let urlified = new URL(url);
            if(urlified !== undefined && urlified !== null)
            {
                return urlified;
            }else{
                return undefined;
            }
          } catch (e) {
              return undefined;
          }
    }
    
    // TODO: delete this code?!
    //startsWith(str1, str2) {
    //    return (str1.match("^"+str2)==str2);
    //}
    
    /**
     * copy request headers to a new array
     * @param {request details} details 
     */
    returnHeaders(details) {
        let copiedHeaders = [];
        /*for(let i = 0; i < details.requestHeaders.length; i++) {
            copiedHeaders.push(details.requestHeaders[i]);
        }*/
        for(let hdr of details.requestHeaders) {
            if(!unsafeHeaders.includes(hdr.name.toLowerCase())) {
                copiedHeaders.push(hdr);
            }
        }
        return copiedHeaders
    }
    
    /**
     * return headers that are not unsafe
     * @todo {improve complexity (hashmap and trie)}
     * @param {headers to evaluate} inputHeaders 
     */
    trimUnsafeHeaders(inputHeaders) {
        let trimmedHeaders = [];
        let flg = false;
        for (let i = 0; i < inputHeaders.length; ++i) {
            /*for(let j = 0; j < unsafeHeaders.length; ++j) {
                if(inputHeaders[i] != undefined) {
                    if (inputHeaders[i].name.toLowerCase() == unsafeHeaders[j].toLowerCase()) {
                        flg = true;
                        break;
                    }
                }
            }*/
    
            //if(!flg) {
            for(var j = 0; j < unsafeHeadersStart.length; ++j) {
                if (startsWith(inputHeaders[i].name.toLowerCase(), unsafeHeadersStart[j].toLowerCase()) == true) {
                    flg = true;
                    break;
                }
            }
            //}
    
            if(!flg) {
                trimmedHeaders.push(inputHeaders[i]);
            }
            flg = false;
        }
        return trimmedHeaders;
    }
    
    purgesuspiciousMapForTab(suspicious, excludeMap, ignoreMap) {
        
        if(suspicious == undefined || suspicious == null) {
            return suspicious;
        }
    
        for(let x = 0; x < suspicious.length; ++x) {
            if(suspicious[x] == [] || suspicious[x] == null || suspicious[x] == undefined || suspicious[x] == [,]) {
                    suspicious.splice(x,1);
            }
        }
    
        for(let i = 0; i < ignoreMap.length; ++i) {
            let ignore = ignoreMap[i];
            suspicious = suspicious.filter(function(e) {
                return e[0] != ignore[0] || e[1] != ignore[1];
            });
    
            if(ignore[0] == '*') {
                suspicious = suspicious.filter(function(e) {
                    return e[1] != ignore[1];
                }
                );
            }
        }
    
        for(let j = 0; j < excludeMap.length; ++j) {
            let exclude = excludeMap[j];
            suspicious = suspicious.filter(function(e) {
                return e[0] != exclude[0] || e[1] != exclude[1];
            }
            );
            
            if(exclude[0] == '*') {
                suspicious = suspicious.filter(function(e) {
                    return e[1] != exclude[1];
                }
                );
            }
        }
        return suspicious;
    }
    
    
    isSiteExcluded(sourceSite, destinationSite, excludeMap) {
        for(let i = 0; i < excludeMap.length; ++i) {
            let exclude = excludeMap[i];
            if(exclude[0] == '*') {
                if(!this.crossSite(exclude[1], destinationSite))
                    return true;
            } else {
                if(!this.crossSite(exclude[0], sourceSite) && !this.crossSite(exclude[1], destinationSite))
                    return true;
            }
        }
        return false;
    }
    
    isSiteIgnored(sourceSite, destinationSite, ignoreMap) {
        for(let i = 0; i < ignoreMap.length; ++i) {
            let ignore = ignoreMap[i];
            if(ignore[0] == '*') {
                if(!this.crossSite(ignore[1], destinationSite))
                    return true;
            } else {
                if(!this.crossSite(ignore[0], sourceSite) && !this.crossSite(ignore[1], destinationSite))
                    return true;
            }
        }
        return false;
    }
    
    isOriginExcluded(sourceOrigin, destinationOrigin, excludeMap) {
        for(let i = 0; i < excludeMap.length; ++i) {
            let exclude = excludeMap[i];
            if(exclude[0] == '*') {
                if(!this.crossOrigin(exclude[1], destinationOrigin))
                    return true;
            } else {
                if(!this.crossOrigin(exclude[0], sourceOrigin) && !this.crossOrigin(exclude[1], destinationOrigin))
                    return true;
            }
        }
        return false;
    }
    
    isOriginIgnored(sourceOrigin, destinationOrigin, ignoreMap) {
        for(let i = 0; i < ignoreMap.length; ++i) {
            let ignore = ignoreMap[i];
            if(ignore[0] == '*') {
                if(!this.crossOrigin(ignore[1], destinationOrigin))
                    return true;
            } else {
                if(!this.crossOrigin(ignore[0], sourceOrigin) && !this.crossOrigin(ignore[1], destinationOrigin))
                    return true;
            }
        }
        return false;
    }
    
    crossSite(sourceSite, destinationSite) {
        if(sourceSite != destinationSite)
            return true;
        else
            return false;
    }
    
    crossOrigin(sourceOrigin, destinationOrigin) {
        let src = this.getOriginFromUrl(sourceOrigin);
        let dst = this.getOriginFromUrl(destinationOrigin);
        let protocolFlag = (src.protocol == undefined || src.protocol == null ? false : true);
        let hostnameFlag = (src.hostname == undefined || src.hostname == null ? false : true);
        let portFlag = (src.port == undefined || src.port == null ? false : true);
        if((protocolFlag && src.protocol != dst.protocol) ||
            (hostnameFlag && src.hostname != dst.hostname) ||
            (portFlag && src.port != dst.port)) {
                return true;
            } else {
                return false;
            }
    }
    
    headersEqual(headersOne, headersTwo) {
    
        if(headersOne['status'] != headersTwo['status']) {
            //console.log("diff in status: " + headersOne['status'] + " vs " + headersTwo['status']);
            return false;
        } else if(headersOne['accept'] != headersTwo['accept']) {
            //console.log("diff in accept: " + headersOne['accept'] + " vs " + headersTwo['accept']);
            return false;
        } else if(headersOne['content-encoding'] != headersTwo['content-encoding']) {
            //console.log("diff in content-encoding: " + headersOne['content-encoding'] + " vs " + headersTwo['content-encoding']);
            return false;
        } else if(headersOne['content-range'] != headersTwo['content-range']) {
            //console.log("diff in content-range: " + headersOne['content-range'] + " vs " + headersTwo['content-range']);
            return false;
        } else if(headersOne['content-length'] != headersTwo['content-length']) {
            //console.log("diff in content-length: " + headersOne['content-length'] + " vs " + headersTwo['content-length']);
            return false;
        } else if(headersOne['host'] != headersTwo['host']) {
            //console.log("diff in host: " + headersOne['host'] + " vs " + headersTwo['host']);
            return false;
        } else if (headersOne['etag'] != headersTwo['etag']) {
            //console.log("diff in etag: " + headersOne['etag'] + " vs " + headersTwo['etag']);
            return false;
        } else {
            return true;
        }
    }
    
    
    getHeaderMap(str) {
        
        // Convert the header string into an array
        // of individual headers
        str = str.trim().split(/[\r\n]+/);
    
        // Create a map of header names to values
        let headerMap = {};
        str.forEach((line) => {
            let parts = line.split(': ');
            let header = parts.shift();
            let value = parts.join(': ');
            headerMap[header.toLowerCase()] = value.toLowerCase();
        });
        return headerMap;
    }
    
    /**
     * extract Site of a URL using
     * public suffix list library
     * @param {full URL} fullUrl 
     */
     getSiteFromUrl(fullUrl) {
        if(this.isEmpty(fullUrl))
            return undefined;
        if(fullUrl.indexOf("//") != -1) {
            fullUrl = fullUrl.split('//')[1];
        }
        fullUrl = fullUrl.split('/')[0];
        let line = punycode.toASCII(fullUrl.toLowerCase());
        let domain = publicSuffixList.getDomain(line);
        return domain;    
    };
    
    getFullDomainFromUrl(fullUrl) {
        let currURL;
        if(this.isEmpty(fullUrl))
            return undefined;
        if (fullUrl.indexOf("//") != -1) {
            currURL = fullUrl.split('//')[1];
        }
        let fullDomain = currURL.split('/')[0];
        let hname = punycode.toASCII(fullDomain.toLowerCase());
        return this.isEmpty(hname) ? fullUrl.toLowerCase() : hname;
    };
    
    // source: https://opensource.apple.com/source/CFNetwork/CFNetwork-128/PACSupport.js.auto.html
    shExpMatch(str, shexp) {
        if(typeof str != "string" || typeof shexp != "string") return false;
        if(shexp == "*") return true;
        if(str == "" && shexp == "") return true;
        str = str.toLowerCase();
        shexp = shexp.toLowerCase();
        var len = str.length;
        var pieces = shexp.split('*');
        var start = 0;
        let i;
        for(i = 0; i < pieces.length; i++) {
            if (pieces[i] == "") continue;
            if (start > len) return false;
            start = str.indexOf(pieces[i]);
            if (start == -1) return false;
            start += pieces[i].length;
            str = str.substring(start, len);
            len = str.length;
        }
        i--;
        if((pieces[i] == "") || (str == "")) return true;
        return false;
    }
    
    findProxyForURL(list, url) {
        let currURL = this.getFullDomainFromUrl(url);
        for(let i = 0; i < list.length; i++) {
            if(this.shExpMatch(currURL, list[i])) return true;
        }
        return false;
    }
}

export default new Utils();