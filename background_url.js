import utils from './utils.mjs';
//let url= "*://*/*njit.edu"; 
// working pattern *://*njit.edu

//The following function makes a new Dynamic Rule 
function makeNewRule(url) {
  //  console.log("The url from the parametre: "+ url);
  //  let url2= "\""+url+"\"";
  //  console.log("The url2 with strings "+ url2);
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
        "condition": { "urlFilter": "*://*/*", "resourceTypes": ["main_frame"] }
      },

    ],
    removeRuleIds: [1001]
  })
}

//Prints when a DNR rule matches
// let n = 0;
// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
//   (e) => console.log(e, ++n)
// );

// 
chrome.webRequest.onBeforeSendHeaders.addListener(
  onBeforeSendHeadersTest,
  // This url is set to all URLs because we want check all (cross-site) requests for cookies
  { urls: ["*://*/*"] },
  ["requestHeaders", "extraHeaders"]
);

let sourceURL;
let ruleURL=""; 

function makeGlobalChange(current_url)
{
  sourceURL=current_url;
}

function onBeforeSendHeadersTest(details){
  console.log(details.method);
}


// function for reading the header before sending i.e the request headers
function onBeforeSendHeaders(details) {
  
  // condition: check if request contains cookies
  if (utils.headerExists(details, "Cookie")) {

    //console.log("Request Id: "+ details.requestId + ": Contains Cookie.");
    //utils.printHeaders(details);

    //remove the following two lines
    // utils.headerValue(details.requestHeaders, "referer");
    // console.log("The source full url:" + sourceURL);

   getTab().then(current_url => {
      makeGlobalChange(current_url);
   })
    
   //console.log("The source full URL: "+ sourceURL);

   let sourceDomain = getDomainFromURl(sourceURL); 

   //console.log("The source domain:" + sourceDomain);

    let targetURL = details.url;
    //console.log("The target full url:" + targetURL);
    let targetDomain = getDomainFromURl(targetURL); 
    //console.log("The target domain:" + targetDomain);

    // The request is cross site with cookies
    if(utils.crossSite(sourceDomain, targetDomain))
    {
      console.log("Request Id: "+ details.requestId +" IS A CROSS SITE REQUEST AND CONTAINS COOKIE");
      console.log("The source domain:" + sourceDomain);
      console.log("The target domain:" + targetDomain);
      //ruleURL=targetURL;
      //pass the target url of the http request as the parametre to the makeNewRule() function 
      makeRequest(targetURL); 
      //makeNewRule(ruleURL);

    }

  }

  else {
   // console.log("Request Id: "+ details.requestId+ ": No Cookie.");
  }

}

//Forming the dommain from the full url in strict mode
// function getDomainFromURl(url)
// {
//   if(url=="undefined") return "undefined";
//   let domain = (new URL(url));
//   domain = domain.hostname;
//   return domain; 
// }

//
// //Webrequest to read responses
// chrome.webRequest.onHeadersReceived.addListener(
//   onHeadersReceived,
//   { urls: ["https://*/*njit.edu"] },
//   ['responseHeaders', 'extraHeaders']
// );


// function onHeadersReceived(details) {
//   for (let i = 0; i < details.responseHeaders.length; ++i) {
//     console.log("Response ID: " + details.responseId + " HEADER NAME: " + details.responseHeaders[i].name.toLowerCase() + ", HEADER VALUE: " + details.responseHeaders[i].value.toLowerCase());
//   }
// }



function makeRequest(url)
{
  // fetch("https://jsonplaceholder.typicode.com/posts/1")
  //   .then(response => {
  //       if (!response.ok) {
  //           throw new Error("Could not reach website.");
  //       }
  //       return response.json();
  //   })
  //   .then(json => console.log(json))
  //   .catch(err => console.error(err));

  // fetch('http://example.com/movies.json')
  // .then((response) => response.json())
  // .then((data) => console.log(data));
  //console.log("A second request to target url: ");
 
  console.log("Sending a new request using Fetch and printing the response: ");
  
  // // fetch(url)
  // //   .then(response => printResponseHeader(response));
  //   fetch(url, options)
  //   .then(response => printResponseHeader(response));

  
  // const request = new Request('https://www.njit.edu', {
  //   method: 'GET',
  //   credentials: 'include'
  // })

  const request = new Request(url, {
    method: 'GET',
    credentials: 'include'
  })

  
  
  fetch(request).then(res => {
  
    // get response headers
    console.log('content-encoding: '+ res.headers.get('content-encoding'))
    console.log('expires: '+ res.headers.get('expires'))
    console.log("accept: " + res.headers.get('accept'));
    console.log("content-range: " + res.headers.get('content-range'));
    console.log("host: " + res.headers.get('host'));
    console.log("etag: " + res.headers.get('etag'));


  // // HTTP response status code
  // console.log(res.status)

  // // shorthand for `status` between 200 and 299
  // console.log("response status: "+res.ok)

  // // status message of the response e.g. `OK`
  // console.log("response statusText: "+res.statusText)

  // // check if there was a redirect
  // console.log("response redirected: "+res.redirected)

  // // get the response type (e.g., `basic`, `cors`)
  // console.log("response type: "+ res.type)

  // // the full path of the resource
   console.log("response url: "+ res.url)
}).catch(err => {
  console.log("There has been an error: "+ err);
})
  
}



// function printResponseHeader(response)
// {
//     console.log("Response Headers from Second request using FETCH: ");
//     console.log("url: " + response.url);
//     console.log("status: "+ response.status);
//     //console.log("accept: "+ response.accept);
//     //console.log("content-encoding: "+ response.content);
//     // console.log("content-range: "+ response.content);
//     //console.log("host: "+ response.host);
//     //console.log("etag: "+ response.etag);

// }





//Function to get the current Tab()
// async function getTab() {
//   let queryOptions = { active: true, currentWindow: true };
//   let tabs = await chrome.tabs.query(queryOptions);
//   return tabs[0].url;
// }

// chrome.tabs.onUpdated.addListener(function () {
//   console.log("TAB UPDATED: SOURCE URL:")
//   getTab().then(url => {
//       console.log(url);
//   })
// })



