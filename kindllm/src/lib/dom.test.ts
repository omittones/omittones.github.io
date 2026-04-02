/**
 * DOM utility tests
 */

import { describe, it, expect } from 'vitest';
import { createElement, escapeHtml } from './dom';

describe('DOM utilities', function() {
  describe('createElement', function() {
    it('should create element with tag name', function() {
      var el = createElement('div');
      expect(el.tagName.toLowerCase()).toBe('div');
    });

    it('should set attributes', function() {
      var el = createElement('div', { id: 'test', class: 'foo' });
      expect(el.getAttribute('id')).toBe('test');
      expect(el.getAttribute('class')).toBe('foo');
    });

    it('should append text children', function() {
      var el = createElement('div', {}, ['Hello']);
      expect(el.textContent).toBe('Hello');
    });

    it('should append element children', function() {
      var child = document.createElement('span');
      var el = createElement('div', {}, [child]);
      expect(el.children.length).toBe(1);
      expect(el.children[0].tagName.toLowerCase()).toBe('span');
    });
  });

  describe('escapeHtml', function() {
    it('should escape HTML tags', function() {
      var result = escapeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should escape ampersands', function() {
      var result = escapeHtml('foo & bar');
      expect(result).toContain('&amp;');
    });

    it('should handle plain text', function() {
      var result = escapeHtml('Hello World');
      expect(result).toBe('Hello World');
    });
  });
});
