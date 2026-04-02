function showSetup() {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('chat-container').style.display = 'none';
}

function showChat() {
  document.getElementById('setup').style.display = 'none';
  document.getElementById('chat-container').style.display = 'block';
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function appendMessage(role, text) {
  var messagesDiv = document.getElementById('messages');
  var div = document.createElement('div');
  div.className = 'message ' + role + ' clearfix';

  var label = document.createElement('div');
  label.className = 'role-label';
  label.textContent = role === 'user' ? 'You' : 'Claude';

  var content = document.createElement('div');
  content.className = 'content';
  if (role === 'assistant') {
    content.innerHTML = parseMarkdown(text);
  } else {
    content.style.whiteSpace = 'pre-wrap';
    content.textContent = text;
  }

  div.appendChild(label);
  div.appendChild(content);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
