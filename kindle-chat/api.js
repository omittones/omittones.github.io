var ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
var ANTHROPIC_VERSION = '2023-06-01';

function callClaude(apiKey, model, messages, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', ANTHROPIC_API_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('x-api-key', apiKey);
  xhr.setRequestHeader('anthropic-version', ANTHROPIC_VERSION);
  xhr.setRequestHeader('anthropic-dangerous-direct-browser-access', 'true');

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var resp = JSON.parse(xhr.responseText);
        onSuccess(resp.content[0].text);
      } catch(e) {
        onError('Error parsing response.');
      }
    } else {
      var msg = 'Error ' + xhr.status;
      try {
        var err = JSON.parse(xhr.responseText);
        if (err.error && err.error.message) msg = err.error.message;
      } catch(e) {}
      onError(msg);
    }
  };

  xhr.onerror = function() {
    onError('Network error. Check your connection.');
  };

  xhr.send(JSON.stringify({ model: model, max_tokens: 1024, messages: messages }));
}

function validateApiKey(apiKey, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', ANTHROPIC_API_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('x-api-key', apiKey);
  xhr.setRequestHeader('anthropic-version', ANTHROPIC_VERSION);
  xhr.setRequestHeader('anthropic-dangerous-direct-browser-access', 'true');

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      onSuccess();
    } else {
      var msg = 'Invalid key (error ' + xhr.status + ')';
      try {
        var err = JSON.parse(xhr.responseText);
        if (err.error && err.error.message) msg = err.error.message;
      } catch(e) {}
      onError(msg);
    }
  };

  xhr.onerror = function() {
    onError('Network error. Check your connection.');
  };

  // Use cheapest model and smallest token count to minimise cost
  xhr.send(JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1,
    messages: [{ role: 'user', content: 'Hi' }]
  }));
}
