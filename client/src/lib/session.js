import { demoCaseId } from './api.js';

const storageKey = (caseId = demoCaseId) => `ai-mystery-room:${caseId}:session`;

export function getStoredSessionId(caseId = demoCaseId) {
  return window.sessionStorage.getItem(storageKey(caseId));
}

export function storeSessionId(sessionId, caseId = demoCaseId) {
  window.sessionStorage.setItem(storageKey(caseId), sessionId);
}

export function clearStoredSessionId(caseId = demoCaseId) {
  window.sessionStorage.removeItem(storageKey(caseId));
}
