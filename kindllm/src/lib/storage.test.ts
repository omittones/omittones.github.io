/**
 * Storage module tests
 * Follow TDD: test behavior before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getData, setData, clearData, initStorage } from './storage';

describe('Storage module', function() {
  var localStorageMock: Record<string, string> = {};

  beforeEach(function() {
    // Reset mock
    localStorageMock = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: function(key: string) {
        return localStorageMock[key] || null;
      },
      setItem: function(key: string, value: string) {
        localStorageMock[key] = value;
      },
      removeItem: function(key: string) {
        delete localStorageMock[key];
      }
    });
  });

  describe('initStorage', function() {
    it('should not throw when localStorage is available', function() {
      expect(function() {
        initStorage();
      }).not.toThrow();
    });

    it('should handle missing localStorage gracefully', function() {
      vi.stubGlobal('localStorage', undefined);
      expect(function() {
        initStorage();
      }).not.toThrow();
    });
  });

  describe('getData', function() {
    it('should return default values when no data exists', function() {
      var data = getData();
      expect(data.apiKey).toBe('');
      expect(data.messages).toEqual([]);
    });

    it('should return saved apiKey', function() {
      setData({ apiKey: 'test-key', messages: [] });
      var data = getData();
      expect(data.apiKey).toBe('test-key');
    });

    it('should return saved messages', function() {
      var messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      setData({ apiKey: '', messages: messages });
      var data = getData();
      expect(data.messages.length).toBe(2);
      expect(data.messages[0].content).toBe('Hello');
    });

    it('should handle corrupted data gracefully', function() {
      localStorageMock['kindllm_data'] = 'invalid json';
      var data = getData();
      expect(data.apiKey).toBe('');
      expect(data.messages).toEqual([]);
    });

    it('should return defaults when localStorage is unavailable', function() {
      vi.stubGlobal('localStorage', undefined);
      var data = getData();
      expect(data.apiKey).toBe('');
      expect(data.messages).toEqual([]);
    });
  });

  describe('setData', function() {
    it('should save apiKey to localStorage', function() {
      setData({ apiKey: 'my-secret-key', messages: [] });
      var saved = localStorageMock['kindllm_data'];
      expect(saved).toContain('my-secret-key');
    });

    it('should save messages to localStorage', function() {
      var messages = [{ role: 'user', content: 'Test' }];
      setData({ apiKey: '', messages: messages });
      var saved = JSON.parse(localStorageMock['kindllm_data']);
      expect(saved.messages[0].content).toBe('Test');
    });
  });

  describe('clearData', function() {
    it('should remove data from localStorage', function() {
      setData({ apiKey: 'key', messages: [] });
      clearData();
      expect(localStorageMock['kindllm_data']).toBeUndefined();
    });
  });
});
