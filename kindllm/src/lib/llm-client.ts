/**
 * LLM Client - handles API calls to the language model
 * Uses XMLHttpRequest for old browser compatibility
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

var DEFAULT_BASE_URL = 'https://api.endpoints.anyscale.com/v1';
var DEFAULT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

export function sendMessage(
  options: LlmOptions,
  messages: LlmMessage[],
  onSuccess: (content: string) => void,
  onError: (error: string) => void
): void {
  var apiKey = options.apiKey;
  var baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  var model = options.model || DEFAULT_MODEL;

  if (!apiKey) {
    onError('API key not configured. Please set your API key.');
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('POST', baseUrl + '/chat/completions', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status !== 200) {
      onError('Request failed: ' + xhr.statusText);
      return;
    }

    try {
      var response = JSON.parse(xhr.responseText);
      var content = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
      if (content) {
        onSuccess(content);
      } else {
        onError('Invalid response format');
      }
    } catch (e) {
      onError('Failed to parse response');
    }
  };

  var body = JSON.stringify({
    model: model,
    messages: messages
  });

  xhr.send(body);
}

export function getSuggestions(
  options: LlmOptions,
  lastUserMessage: string,
  lastAssistantMessage: string,
  onSuccess: (suggestions: string[]) => void,
  onError: (error: string) => void
): void {
  var messages: LlmMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant that generates insightful follow-up questions. Reply with a JSON object containing a "suggestions" array of exactly 3 questions.'
    },
    {
      role: 'user',
      content: lastUserMessage
    },
    {
      role: 'assistant',
      content: lastAssistantMessage
    },
    {
      role: 'user',
      content: 'List three good follow-up questions as JSON:'
    }
  ];

  var apiKey = options.apiKey;
  var baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  var model = options.model || DEFAULT_MODEL;

  if (!apiKey) {
    onError('API key not configured');
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('POST', baseUrl + '/chat/completions', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status !== 200) {
      onError('Request failed: ' + xhr.statusText);
      return;
    }

    try {
      var response = JSON.parse(xhr.responseText);
      var content = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
      if (content) {
        var parsed = JSON.parse(content);
        var suggestions = parsed.suggestions || [];
        onSuccess(suggestions.slice(0, 3));
      } else {
        onError('Invalid response format');
      }
    } catch (e) {
      onError('Failed to parse suggestions');
    }
  };

  var body = JSON.stringify({
    model: model,
    messages: messages,
    response_format: { type: 'json_object' }
  });

  xhr.send(body);
}
