function makeNewRule() {
  chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
      
      /*  
      {
        'id': 1001,
        'priority': 1,
        'action': {
          'type': 'redirect',
          'redirect': {
            url: 'https://www.medium.com'
          }
        },
        'condition': {'urlFilter': 'reddit', 'resourceTypes': [ 'main_frame']
        }
      },
      */

      {
        "id": 1001,
        "priority": 5,
        "action": {
          "type": "modifyHeaders",
          "requestHeaders": [
            { "header": "cookie", "operation": "set", "value":"MODIFIED COOKIE HEADER VALUE"}        
          ]
        },
        "condition": { "urlFilter": "*://*/*njit.edu", "resourceTypes": ["main_frame"] }
      },

      ],
      removeRuleIds: [1001] //When is this removed? 
    })
}

// Prints when a DNR rule matches
let n = 0;
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
  (e) => console.log(e, ++n)
);



chrome.webRequest.onBeforeSendHeaders.addListener(
  readCookieHeader,
  { urls: ["*://*/*njit.edu"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onHeadersReceived.addListener(
  onHeadersReceived,
  {urls: ["https://*/*njit.edu"]},
  ['responseHeaders', 'extraHeaders']
);

  // function for reading the header before sending i.e the request headers
  function readCookieHeader(details) {
  // condition: check if request contains cookies
   
        if(headerExists(details, "Cookie")) {
          console.log("Found a request with a cookie: ");
          printHeaders(details);
          makeNewRule(); // pass the url to the parametre
        }

        else {
          console.log("Cookie not found"); 
        }

        let trgt = details.url;
        let targetSite = getSiteFromUrl(trgt);
        console.log(trgt);
        console.log(targetSite);
}


function onHeadersReceived(details) {
  for (let i = 0; i < details.responseHeaders.length; ++i) {
    console.log( "Response ID: "+ details.responseId +  " HEADER NAME: " + details.responseHeaders[i].name.toLowerCase() + ", HEADER VALUE: " + details.responseHeaders[i].value.toLowerCase());
  }
}
      
  


function headerExists(details, key){
  
  for (let hdr of details.requestHeaders) {
      if (hdr.name.toLowerCase() == key.toLowerCase()) {
          return true;
      }
  }
  return false;

}


function printHeaders(details){
    for (let i = 0; i < details.requestHeaders.length; ++i) {
        console.log( "Request ID: "+ details.requestId +  " HEADER NAME: " + details.requestHeaders[i].name.toLowerCase() + ", HEADER VALUE: " + details.requestHeaders[i].value.toLowerCase());
    }
}

/*

function headerValue(array, key){
  for(let i = 0, l = array.length; i < l; i++)
  {
      if(array[i].name.toLowerCase() == key.toLowerCase())
      {
          return array[i].value.toLowerCase();
      }
  }
  return undefined;
}

*/

function getSiteFromUrl(fullUrl) {
  
  if(fullUrl.indexOf("//") != -1) {
      fullUrl = fullUrl.split('//')[1];
  }
  fullUrl = fullUrl.split('/')[0];
  //let line = punycode.toASCII(fullUrl.toLowerCase());
  //let domain = publicSuffixList.getDomain(line);
  return fullUrl;    
};








