chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{
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
  }],
 removeRuleIds: [1001] //When is this removed? 
})

 
let n = 0;
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
  (e) => console.log(e, ++n)
);


