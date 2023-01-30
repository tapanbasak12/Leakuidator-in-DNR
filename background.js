import utils from './utils.mjs';
//"resourceTypes": ["main_frame", "sub_frame"],
//"domainType": "thirdParty", 
//"urlFilter": "*://*"


let sourceURL;


chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders,
  { urls: ["https://*/*"] }, ["requestHeaders", "extraHeaders"]
);


function onBeforeSendHeaders(details) {


  if (details.method == 'HEAD') {
    return { requestHeaders: details.requestHeaders };
  }

  // condition: if the request header does not contain cookie return the request as it is

  if (!utils.headerExists(details, "Cookie")) {
    return { requestHeaders: details.requestHeaders };
  }

 
  

  if (utils.headerExists(details, "Cookie")) {

    //TODO: Understand the get tab()
    getTab().then( current_url => {
      makeGlobalChange(current_url);
    })

    if (sourceURL.toLowerCase().startsWith("chrome://newtab/") || 
       sourceURL.toLowerCase().startsWith("chrome-extension://") ) {
      
       return { requestHeaders: details.requestHeaders };
    }
    
    let sourceDomain = utils.getDomainFromURl(sourceURL);
    let targetURL = details.url;
    let targetDomain = utils.getDomainFromURl(targetURL);

    if (utils.crossSite(sourceDomain, targetDomain)) {

      
      printLogDetails(details.requestId, sourceDomain, targetDomain);
      
      makeNewRule();

      //makeSecondRequest(targetURL);
    }
  }

  // else {
  //   //console.log("Request Id: "+ details.requestId+ ": No Cookie.");
  // }

}

async function getTab() {
  let queryOptions = { active: true, currentWindow: true };
  let tabs = await chrome.tabs.query(queryOptions);
  return tabs[0].url;
}


function makeSecondRequest(url) {
    console.log("Sending a new request using Fetch and printing the response: ");

    const request = new Request(url, {
      method: 'HEAD',
      credentials: 'include'
    })

    fetch(request).then(res => {
      console.log('content-encoding: ' + res.headers.get('content-encoding'))
      console.log('expires: ' + res.headers.get('expires'))
      console.log("accept: " + res.headers.get('accept'));
      console.log("content-range: " + res.headers.get('content-range'));
      console.log("host: " + res.headers.get('host'));
      console.log("etag: " + res.headers.get('etag'));
      console.log("response url: " + res.url)
    }).catch(err => {
      console.log("There has been an error: " + err);
    })
}




function makeNewRule(url) {

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        "id": 1001,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "requestHeaders": [
            { "header": "cookie", "operation": "set", "value": "MODIFIED COOKIE HEADER VALUE" }
          ]
        },
        "condition": {
          "resourceTypes": ["main_frame", "sub_frame"],
          "domainType": "thirdParty",
        }
      },

    ],
    removeRuleIds: [1001]
  })
}


let n = 0;
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
  (e) => console.log(e, ++n)
);



function printLogDetails(rId, sourceDomain, targetDomain)
{
    console.log("CORWC Request Id: " + rId);
    console.log("Source: " + sourceDomain);
    console.log("Target: " + targetDomain);
}
      
function makeGlobalChange(current_url) {
  sourceURL = current_url;
}








