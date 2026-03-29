import { fetchJson } from './api';

export interface DeckProgressEntry {
  deckId: string;
  progress: number;
  currentIndex: number;
  totalCards: number;
  updatedAt: string;
}

function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchUserDeckProgress(token: string) {
  const payload = await fetchJson<{ progress?: DeckProgressEntry[] }>('/api/user-progress', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return payload.progress || [];
}

export async function saveDeckProgress(
  token: string,
  entry: Omit<DeckProgressEntry, 'updatedAt'>,
) {
  return fetchJson<{ entry: DeckProgressEntry }>('/api/user-progress', {
    method: 'PUT',
    headers: createAuthHeaders(token),
    body: JSON.stringify(entry),
  });
}
