import type { StudySession } from './types';

const CURRENT_KEY = 'studyai_current';
const HISTORY_KEY = 'studyai_history';
const MAX_HISTORY = 20;

export function getCurrentSession(): StudySession | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as StudySession) : null;
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: StudySession): void {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(session));

  const history = getHistory();
  const filtered = history.filter(s => s.id !== session.id);
  const updated = [session, ...filtered].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getHistory(): StudySession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StudySession[]) : [];
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter(s => s.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CURRENT_KEY);
}
