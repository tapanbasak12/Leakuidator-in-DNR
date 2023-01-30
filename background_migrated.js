import utils from './utils.mjs';


Array.prototype.inArray = function(comparer) { 
    for(let i=0; i < this.length; i++) { 
        if(comparer(this[i])) return true; 
    }
    return false;
}; 

Array.prototype.pushIfNotExist = function(element, comparer) { 
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};

Array.prototype.remove = function(element, comparer) {
    if(this.inArray(comparer)) {
        this.splice(element, 1);
    }
}

var tabUrl = []; // current url of each tab
var navigation = [];
var tabPendingUrl = []; // is the tab in a pending state?
var corwc = []; // check if the request is cross origin/site with cookie
var firstResponseHeaders = []; // response headers for the first requests with cookies removed
var xhrData = []; // data related to second request with cookies included //XmlHTTPRequest Data
var tabrelations = []; // used to track relations between tabs/windows
var occured = []; // tracks whether a request ID has been observed before

// extension mode (Relaxed or Exact)
var extensionMode = "Relaxed"; // Relaxed is default

// name of storage vars
var keys = ["excludeSite", "excludeOrigin", "ignoreSite", "ignoreOrigin", "mode"];

// headers to be checked for observable difference
var suspiciousHeaders = [ 'status', 'accept', 'content-encoding', 'content-range', 'content-length', 'host',  'etag' ];

var tqf = ["forward_back", "from_address_bar"]; // exclude user initiated navigations


var ignoreSiteMap = []; // based on URL Site
var ignoreOriginMap = []; // based on URL Origin

// map of user decisions for excluded requests
// (excluded requests do not have the protection and user doesn't get notified)
var excludeSiteMap = []; // based on URL Site
var excludeOriginMap = []; // based on URL Origin


var dangerousMapPerTab = [];


var psl;
let ruleIds = [];  


init();

function init() {
    
    chrome.tabs.onCreated.addListener(onTabCreatedListener);
    chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
    chrome.tabs.onRemoved.addListener(onTabRemovedListener);

    chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders,
        {urls: ["https://*/*"]}, ['requestHeaders', 'extraHeaders']);    
    
    chrome.webRequest.onSendHeaders.addListener(onSendHeaders,
            {urls: ["https://*/*"]}, ['requestHeaders', 'extraHeaders']);  

    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived,
        {urls: ["https://*/*"]}, ['responseHeaders', 'extraHeaders']);

    chrome.webRequest.onCompleted.addListener(onCompleted,
        {urls: ["https://*/*"]}, ['responseHeaders', 'extraHeaders']);


};


function onTabCreatedListener(tab) {
    if(utils.isEmpty(tabrelations[tab.id])) {
       tabrelations[tab.id] = [];
    }
    
    if(utils.isEmpty(tabrelations[tab.openerTabId])) {
       tabrelations[tab.openerTabId] = [];
    }
   
   tabUrl[tab.id] = tab.url;
   
   tabrelations[tab.id].push(tab.openerTabId);
   tabrelations[tab.openerTabId].push(tab.id);
};


function onTabUpdatedListener(tabId, changeInfo, tab) {
   if(!utils.isEmpty(changeInfo.url)) {dangerousMapPerTab[tabId] = [];}
   tabUrl[tabId] = tab.url;
   tabPendingUrl[tabId] = tab.pendingUrl;
};


function onTabRemovedListener(tabId) {
   delete tabUrl[tabId];
   delete tabPendingUrl[tabId];
   delete tabrelations[tabId];
};


function onBeforeSendHeaders(details) {

    console.log("Inside OnBeforeSendHeaders(): ");
    console.log(details);
    if(details.tabId == -1) {
        return { requestHeaders: details.requestHeaders };
    }
    
    if(details.method == undefined){
        return { requestHeaders: details.requestHeaders};
    }

    if(!utils.headerExists(details, "Cookie")) {
        return { requestHeaders: details.requestHeaders };
    }

    if (tabUrl[details.tabId].toLowerCase().startsWith("chrome://newtab/") ||
        tabUrl[details.tabId].toLowerCase().startsWith("chrome-extension://") ||
        tabUrl[details.tabId].toLowerCase().startsWith("edge://newtab/")) 
    {
        return { requestHeaders: details.requestHeaders };
    }


    let modeConditions = false;

 

    //TODO: update the getDomainFromURL function to use public suffix list

    let src = tabUrl[details.tabId];
    let sourceDomain = utils.getDomainFromURl(src);

    let trgt = details.url;
    let targetDomain = utils.getDomainFromURl(trgt);

    if(!utils.isEmpty(sourceDomain) && !utils.isEmpty(targetDomain)) {
        modeConditions = (utils.crossSite(sourceDomain, targetDomain) ? true : false);
    }

    if(!modeConditions) {
        return { requestHeaders: details.requestHeaders };
    }


    if (modeConditions) {
       printCrossSiteRequestDetails(details.requestId, sourceDomain, targetDomain);
    }
    
    
    // if survived all the conditions, mark the request as suspicious, corwc is the array for storing suspicious requests
    if(!corwc[details.requestId]) {
        
        corwc[details.requestId] = true;
        
        xhrData[details.requestId] = [];
        xhrData[details.requestId].id = details.requestId;
        xhrData[details.requestId].tabId = details.tabId;
        xhrData[details.requestId].source = src;
        xhrData[details.requestId].target = trgt;  
        //urlsThatNeedCookieModifications.push(trgt); 
        //console.log(trgt);
        
        makeNewRule(trgt, details.requestId);
    } 
    
    else  occured[details.requestId] = true;

    //return { requestHeaders: utils.removeRequestHeaders(details, 'Cookie') };
            
}


function onSendHeaders(details)
{
    console.log("Inside OnSendHeaders(): ");
    ruleIds.forEach(ruleId => console.log(ruleId));
    ruleIds.forEach(ruleId =>
        chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds : [ruleId ]
    }))

    ruleIds.forEach(ruleId =>
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds : [ruleId ]
    }))

    

    console.log(details);
}


function onHeadersReceived(details) {
    console.log("Inside On Headers Received(): ");
    console.log(details);
    if(corwc[details.requestId]) {
        if(!occured[details.requestId]) {
            
            // store response headers into memory for later use by @xhRequest
            firstResponseHeaders[details.requestId] = [];
            for(var i = 0, l = details.responseHeaders.length; i < l; i++) {
                let hdr = details.responseHeaders[i].name.toLowerCase();
                if(suspiciousHeaders.includes(hdr)) {
                    firstResponseHeaders[details.requestId][hdr] = details.responseHeaders[i].value.toLowerCase();
                }
            }

            // make the second request, with cookies
            let trgt= xhrData[details.requestId].target;
            //makeSecondRequest(trgt);
        }
        // return response to first request, with Set-Cookie header removed
        //return { responseHeaders: utils.removeResponseHeaders(details, 'Set-Cookie') };
    }

    // ruleIds.forEach(ruleId =>
    //     chrome.declarativeNetRequest.updateDynamicRules({
    //         removeRuleIds : [ruleId ]
    //     }))


};


function onCompleted(details)
{
    console.log("Inside OnCompleted(): ");

    

    chrome.declarativeNetRequest.getDynamicRules(
        e => {
            console.log("The rules active now: ");
            console.log(e);
        }
    );

    ruleIds.length = 0;
    console.log(details);
}

  
function makeSecondRequest(url) {
    
    fetch(url, {
        method: 'HEAD'
      })
      .then(response => response.headers)
      .then(headers => console.log(headers))
      .catch(error => console.error(error));

  }

function printCrossSiteRequestDetails(rId, sourceDomain, targetDomain)
{
    console.log("CORWC Request Id: " + rId);
    console.log("Source: " + sourceDomain);
    console.log("Target: " + targetDomain);
}
      
function makeNewRule(trgt, rId) {
    rId++; 
    ruleIds.push(rId);
    console.log(trgt);
    chrome.declarativeNetRequest.updateSessionRules(
        { 
            addRules:
            [
                {
                    "id": rId,
                    "priority": 1,
                    
                    "action": {
                        "type": "modifyHeaders",
                        "requestHeaders": [
                            {
                            "header": "cookie",
                            "operation": "set",
                            "value": "Brand new COOKIE"
                            }
                        ]
                    },
                
                    "condition": {
                        "urlFilter" : trgt,
                        "resourceTypes": 
                         ["csp_report", "font", "image", 
                            "main_frame", "media", "object", 
                            "other", "ping", "script", 
                            "stylesheet", "sub_frame", 
                            "webbundle", "websocket", 
                            "webtransport"],
                        "domainType" : "thirdParty"
                        
                    }
                }
            ],

            removeRuleIds: [rId]
  
        });
    
}




// let n = 0;
// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
//   e => console.log(e, ++n)
// );


// chrome.declarativeNetRequest.updateSessionRules(
// { 
//     removeRuleIds: [1000]
// });

// chrome.declarativeNetRequest.getDynamicRules(
//     e => console.log(e)
// );
  


