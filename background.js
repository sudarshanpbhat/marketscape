chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
	      new chrome.declarativeContent.PageStateMatcher({
	        pageUrl: {hostEquals: 'developer.chrome.com'},
	      }), 
	      new chrome.declarativeContent.PageStateMatcher({
	        pageUrl: {hostEquals: 'coin.zerodha.com'},
	      }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'kite.zerodha.com'},
        }), 
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'console.zerodha.com'}
        })
      ],
      actions: [
      	  new chrome.declarativeContent.ShowPageAction()
      ]
    }]);
  });
});