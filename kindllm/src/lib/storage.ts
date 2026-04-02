/**
 * Storage module - wraps localStorage for API key and message persistence
 * ES5 compatible, no modern JavaScript features
 */

export interface StorageData {
  apiKey: string;
  messages: Array<{role: string; content: string}>;
}

var STORAGE_KEY = 'kindllm_data';

export function initStorage(): void {
  // Check if localStorage is available
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage not available');
    return;
  }
}

export function getData(): StorageData {
  if (typeof localStorage === 'undefined') {
    return { apiKey: '', messages: [] };
  }

  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { apiKey: '', messages: [] };
  }

  try {
    var parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || '',
      messages: parsed.messages || []
    };
  } catch (e) {
    return { apiKey: '', messages: [] };
  }
}

export function setData(data: StorageData): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function clearData(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
