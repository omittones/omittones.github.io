/**
 * Kindllm - Main Entry Point
 *
 * Initializes the chat application for Kindle devices.
 * Uses ES5-compatible patterns for old browser support.
 */

import './styles.css';
import { initChat } from './lib/chat';
import { initStorage } from './lib/storage';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initStorage();
  initChat();
});
