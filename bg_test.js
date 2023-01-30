chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Cookie') {
          details.requestHeaders.splice(i, 1);
          break;
        }
      }
      return {requestHeaders: details.requestHeaders};
    },
    {urls: ["<all_urls>"]},
    ["requestHeaders"]
  );

  console.log("Adding a dynamic rule and removing...");
  chrome.declarativeNetRequest.updateDynamicRules(
      { 
          addRules:
          [
              {
                  "id": 1000,
                  "priority": 100,
                  
                  "action": {
                      "type": "modifyHeaders",
                      "requestHeaders": [
                          {
                          "header": "cookie",
                          "operation": "set",
                          "value": "January 28"
                          }
                      ]
                  },
              
                  "condition": {
                      "urlFilter" : url,
                      "resourceTypes": 
                       ["csp_report", "font", "image", 
                          "main_frame", "media", "object", 
                          "other", "ping", "script", 
                          "stylesheet", "sub_frame", 
                          "webbundle", "websocket", 
                          "webtransport"]
                  }
              }
          ],

          removeRuleIds: [1000],

      });

      const newRules = [];
      blockUrls.forEach((domain, index) => {
          newRules.push({
              "id": index + 1,
              "priority": 1,
              "action": {
                  "type": "modifyHeaders",
                  "requestHeaders": [
                      {
                          "header": "cookie",
                          "operation": "set",
                          "value": "Modified cookie value 1"
                      }
                  ]
              },
              "condition": {
                  "urlFilter": domain, "resourceTypes":
                      ["csp_report", "font", "image",
                          "main_frame", "media", "object",
                          "other", "ping", "script",
                          "stylesheet", "sub_frame",
                          "webbundle", "websocket",
                          "webtransport"]
              }
          });
      });
      
      chrome.declarativeNetRequest.getDynamicRules(previousRules => {
          const previousRuleIds = previousRules.map(rule => rule.id);
          chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: previousRuleIds, addRules: newRules });
      });

      function makeSecondRequest(url) {
    
        //   const request = new Request(url, {
        //     method: 'HEAD',
        //     credentials: 'include'
        //   })
      
        //   fetch(request).then(res => {
        //     console.log("Fetch Response: " + res); 
    
        //   }).catch(err => {
        //     console.log("There has been an error: " + err);
        //   })
    
        
    
        fetch(url, {
            method: 'HEAD'
          })
          .then(response => response.headers)
          .then(headers => console.log(headers))
          .catch(error => console.error(error));
    
      }


      "domainType" : "thirdParty" 