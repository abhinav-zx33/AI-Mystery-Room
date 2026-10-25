import { demoCaseId } from './api.js';

const storageKey = `ai-mystery-room:${demoCaseId}:session`;

export function getStoredSessionId() {
  return window.sessionStorage.getItem(storageKey);
}

export function storeSessionId(sessionId) {
  window.sessionStorage.setItem(storageKey, sessionId);
}

export function clearStoredSessionId() {
  window.sessionStorage.removeItem(storageKey);
}
