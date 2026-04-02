var API_KEY = '';
var conversation = [];

function getModel() {
  var sel = document.getElementById('model-select');
  return sel ? sel.value : 'claude-sonnet-4-6';
}

function saveConversation() {
  try { localStorage.setItem('claude_conversation', JSON.stringify(conversation)); } catch(e) {}
}

function loadFromDpaste() {
  var raw = document.getElementById('dpaste-input').value.trim();
  if (!raw) { alert('Please enter a dpaste ID or URL.'); return; }

  // Accept full URL or bare ID
  var id = raw.replace(/^https?:\/\/dpaste\.com\//i, '').replace(/\.txt$/i, '').replace(/\/$/, '');
  if (!id) { alert('Could not parse dpaste ID.'); return; }

  var statusEl = document.getElementById('dpaste-status');
  statusEl.textContent = 'Loading...';

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://dpaste.com/' + id + '.txt', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      var key = xhr.responseText.trim();
      if (!key) { statusEl.textContent = 'Paste was empty.'; return; }
      API_KEY = key;
      try { localStorage.setItem('claude_api_key', key); } catch(e) {}
      document.getElementById('dpaste-input').value = '';
      statusEl.textContent = '';
      showChat();
    } else {
      statusEl.textContent = 'Could not load paste (status ' + xhr.status + '). Check the ID.';
    }
  };
  xhr.onerror = function() {
    statusEl.textContent = 'Network error. Check your connection.';
  };
  xhr.send();
}

function saveApiKey() {
  var key = document.getElementById('api-key-input').value.trim();
  if (!key) { alert('Please enter an API key.'); return; }
  API_KEY = key;
  try { localStorage.setItem('claude_api_key', key); } catch(e) {}
  showChat();
}

function changeKey() {
  showSetup();
  document.getElementById('api-key-input').value = '';
}

function clearChat() {
  conversation = [];
  saveConversation();
  document.getElementById('messages').innerHTML = '';
  setStatus('');
}

function sendMessage() {
  var input = document.getElementById('user-input');
  var text = input.value.trim();
  if (!text) return;
  if (!API_KEY) { alert('No API key set.'); return; }

  input.value = '';
  conversation.push({ role: 'user', content: text });
  saveConversation();
  appendMessage('user', text);
  setStatus('Waiting for Claude...');

  var btn = document.getElementById('send-btn');
  btn.disabled = true;

  callClaude(API_KEY, getModel(), conversation,
    function(reply) {
      btn.disabled = false;
      conversation.push({ role: 'assistant', content: reply });
      saveConversation();
      appendMessage('assistant', reply);
      setStatus('');
    },
    function(errMsg) {
      btn.disabled = false;
      setStatus(errMsg);
      conversation.pop();
    }
  );
}

function init() {
  var stored = '';
  try { stored = localStorage.getItem('claude_api_key') || ''; } catch(e) {}
  if (!stored) return;

  API_KEY = stored;
  showChat();

  try {
    var saved = localStorage.getItem('claude_conversation');
    if (saved) {
      conversation = JSON.parse(saved);
      for (var i = 0; i < conversation.length; i++) {
        appendMessage(conversation[i].role, conversation[i].content);
      }
    }
  } catch(e) { conversation = []; }
}

document.addEventListener('DOMContentLoaded', function() {
  init();
  var input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
