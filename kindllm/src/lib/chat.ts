/**
 * Chat module - handles chat UI and interactions
 * ES5 compatible, no modern JavaScript features
 */

import { getData, setData, StorageData } from './storage';
import { sendMessage, getSuggestions, LlmMessage } from './llm-client';
import { $, createElement, appendHtml, scrollToBottom, escapeHtml } from './dom';

var app: HTMLElement | null = null;
var messagesContainer: HTMLElement | null = null;
var messageInput: HTMLInputElement | null = null;
var currentMessages: LlmMessage[] = [];

export function initChat(): void {
  app = $('#app');
  if (!app) {
    console.error('App container not found');
    return;
  }

  renderChatInterface();
  loadMessages();
  bindEvents();
}

function renderChatInterface(): void {
  if (!app) return;

  app.innerHTML = '';

  // Logo and title
  var header = createElement('div', { class: 'chat-header' }, [
    createElement('h1', {}, ['Kindllm'])
  ]);

  // Messages container
  messagesContainer = createElement('div', { id: 'messages', class: 'messages-container' });

  // Input area
  var inputContainer = createElement('div', { class: 'input-container' });

  messageInput = createElement('input', {
    type: 'text',
    id: 'message-input',
    placeholder: 'Type your message...',
    class: 'message-input'
  }) as HTMLInputElement;

  var sendButton = createElement('button', {
    id: 'send-button',
    class: 'send-button',
    type: 'button'
  }, ['Send']);

  inputContainer.appendChild(messageInput);
  inputContainer.appendChild(sendButton);

  // Suggestions container
  var suggestionsContainer = createElement('div', { id: 'suggestions', class: 'suggestions-container' });

  // Footer controls
  var footer = createElement('div', { class: 'chat-footer' }, [
    createElement('button', { id: 'clear-button', class: 'control-button' }, ['Clear']),
    createElement('button', { id: 'settings-button', class: 'control-button' }, ['Settings']),
    createElement('a', { href: '/privacy.html', class: 'footer-link' }, ['Privacy'])
  ]);

  app.appendChild(header);
  app.appendChild(messagesContainer);
  app.appendChild(inputContainer);
  app.appendChild(suggestionsContainer);
  app.appendChild(footer);
}

function bindEvents(): void {
  var sendButton = $('#send-button');
  var clearButton = $('#clear-button');
  var settingsButton = $('#settings-button');

  if (sendButton && messageInput) {
    sendButton.onclick = handleSend;
    messageInput.onkeypress = function(e) {
      if (e.keyCode === 13) {
        handleSend();
      }
    };
  }

  if (clearButton) {
    clearButton.onclick = handleClear;
  }

  if (settingsButton) {
    settingsButton.onclick = showSettings;
  }
}

function loadMessages(): void {
  var data = getData();
  currentMessages = data.messages || [];

  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    for (var i = 0; i < currentMessages.length; i++) {
      var msg = currentMessages[i];
      appendMessageToUI(msg.role, msg.content);
    }
  }
}

function handleSend(): void {
  if (!messageInput) return;

  var content = messageInput.value.trim();
  if (!content) return;

  // Add user message
  var userMessage: LlmMessage = { role: 'user', content: content };
  currentMessages.push(userMessage);
  appendMessageToUI('user', content);
  saveMessages();

  // Clear input
  messageInput.value = '';

  // Show loading
  showLoading();

  // Get API key and send to LLM
  var data = getData();
  var apiKey = data.apiKey;

  if (!apiKey) {
    hideLoading();
    showError('Please configure your API key in Settings');
    return;
  }

  // Prepare messages for API (include system prompt)
  var systemMessage: LlmMessage = {
    role: 'system',
    content: 'You are a helpful assistant on a Kindle e-reader, called Kindllm. You get straight to the point with a short answer and a pleasant demeanor.'
  };
  var apiMessages = [systemMessage].concat(currentMessages);

  sendMessage(
    { apiKey: apiKey },
    apiMessages,
    function(response) {
      hideLoading();
      var assistantMessage: LlmMessage = { role: 'assistant', content: response };
      currentMessages.push(assistantMessage);
      appendMessageToUI('assistant', response);
      saveMessages();
      loadSuggestions();
    },
    function(error) {
      hideLoading();
      showError(error);
    }
  );
}

function appendMessageToUI(role: string, content: string): void {
  if (!messagesContainer) return;

  var className = role === 'user' ? 'user-message' : 'assistant-message';
  var label = role === 'user' ? 'User' : 'Kindllm';

  var messageEl = createElement('div', { class: 'message ' + className });
  var labelEl = createElement('strong', {}, [label + ': ']);
  var contentEl = createElement('span', {}, []);
  contentEl.innerHTML = escapeHtml(content).replace(/\n/g, '<br>');

  messageEl.appendChild(labelEl);
  messageEl.appendChild(contentEl);
  messagesContainer.appendChild(messageEl);

  scrollToBottom(messagesContainer);
}

function saveMessages(): void {
  var data = getData();
  data.messages = currentMessages;
  setData(data);
}

function handleClear(): void {
  if (confirm('Clear all messages?')) {
    currentMessages = [];
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    saveMessages();
    hideSuggestions();
  }
}

function showSettings(): void {
  var data = getData();
  var apiKey = prompt('Enter your API key:', data.apiKey);
  if (apiKey !== null) {
    data.apiKey = apiKey;
    setData(data);
  }
}

function showLoading(): void {
  var sendButton = $('#send-button');
  if (sendButton) {
    sendButton.textContent = 'Loading...';
    sendButton.setAttribute('disabled', 'disabled');
  }
}

function hideLoading(): void {
  var sendButton = $('#send-button');
  if (sendButton) {
    sendButton.textContent = 'Send';
    sendButton.removeAttribute('disabled');
  }
}

function showError(message: string): void {
  alert('Error: ' + message);
}

function loadSuggestions(): void {
  if (currentMessages.length < 2) return;

  var lastUser = '';
  var lastAssistant = '';

  for (var i = currentMessages.length - 1; i >= 0; i--) {
    if (!lastAssistant && currentMessages[i].role === 'assistant') {
      lastAssistant = currentMessages[i].content;
    } else if (!lastUser && currentMessages[i].role === 'user') {
      lastUser = currentMessages[i].content;
    }
    if (lastUser && lastAssistant) break;
  }

  if (!lastUser || !lastAssistant) return;

  var data = getData();
  if (!data.apiKey) return;

  getSuggestions(
    { apiKey: data.apiKey },
    lastUser,
    lastAssistant,
    function(suggestions) {
      renderSuggestions(suggestions);
    },
    function() {
      hideSuggestions();
    }
  );
}

function renderSuggestions(suggestions: string[]): void {
  var container = $('#suggestions');
  if (!container) return;

  container.innerHTML = '';

  for (var i = 0; i < suggestions.length; i++) {
    var btn = createElement('button', {
      class: 'suggestion-button',
      type: 'button'
    }, [suggestions[i]]);

    btn.onclick = (function(suggestion: string) {
      return function() {
        if (messageInput) {
          messageInput.value = suggestion;
          handleSend();
        }
      };
    })(suggestions[i]);

    container.appendChild(btn);
  }
}

function hideSuggestions(): void {
  var container = $('#suggestions');
  if (container) {
    container.innerHTML = '';
  }
}
