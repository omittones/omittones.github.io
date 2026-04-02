var ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
var ANTHROPIC_VERSION = '2023-06-01';

function callClaude(apiKey, model, messages, onChunk, onSuccess, onError) {
  fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model: model, max_tokens: 1024, messages: messages, stream: true })
  })
  .then(function(response) {
    if (!response.ok) {
      return response.json().then(function(err) {
        onError((err.error && err.error.message) ? err.error.message : 'Error ' + response.status);
      }).catch(function() {
        onError('Error ' + response.status);
      });
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var lineBuffer = '';
    var accumulated = '';

    function pump() {
      return reader.read().then(function(result) {
        if (result.done) { onSuccess(accumulated); return; }

        lineBuffer += decoder.decode(result.value, { stream: true });
        var lines = lineBuffer.split('\n');
        lineBuffer = lines.pop(); // keep the incomplete last line

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.indexOf('data: ') !== 0) continue;
          var raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            var evt = JSON.parse(raw);
            if (evt.type === 'content_block_delta' &&
                evt.delta && evt.delta.type === 'text_delta') {
              accumulated += evt.delta.text;
              onChunk(evt.delta.text);
            }
          } catch(e) {}
        }
        return pump();
      });
    }

    return pump();
  })
  .catch(function() {
    onError('Network error. Check your connection.');
  });
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
