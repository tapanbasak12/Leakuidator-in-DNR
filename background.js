import utils from './utils.mjs';

function makeNewRule() {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        "id": 1001,
        "priority": 5,
        "action": {
          "type": "modifyHeaders",
          "requestHeaders": [
            { "header": "cookie", "operation": "set", "value": "MODIFIED COOKIE HEADER VALUE" }
          ]
        },
        "condition": { "urlFilter": "*://*/*njit.edu", "resourceTypes": ["main_frame"] }
      },

    ],
    removeRuleIds: [1001]
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
  { urls: ["https://*/*njit.edu"] },
  ['responseHeaders', 'extraHeaders']
);

// function for reading the header before sending i.e the request headers
function readCookieHeader(details) {
  
  // condition: check if request contains cookies
  if (utils.headerExists(details, "Cookie")) {
    console.log("Found a request with a cookie: ");
    utils.printHeaders(details);
    makeNewRule(); // pass the url to the parametre
  }

  else {
    console.log("Cookie not found");
  }

}


function onHeadersReceived(details) {
  for (let i = 0; i < details.responseHeaders.length; ++i) {
    console.log("Response ID: " + details.responseId + " HEADER NAME: " + details.responseHeaders[i].name.toLowerCase() + ", HEADER VALUE: " + details.responseHeaders[i].value.toLowerCase());
  }
}












