const DB_NAME = 'sportsync-offline';
const STORE_NAME = 'pending-balls';
const DB_VERSION = 1;

export interface PendingBall {
  id: string;
  matchId: string;
  ball: unknown;
  timestamp: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function queueBall(matchId: string, ball: unknown): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const item: PendingBall = {
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    matchId,
    ball,
    timestamp: new Date().toISOString(),
  };
  tx.objectStore(STORE_NAME).add(item);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingBalls(matchId?: string): Promise<PendingBall[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as PendingBall[];
      resolve(matchId ? all.filter((b) => b.matchId === matchId) : all);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingBall(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncPendingBalls(
  matchId: string,
  emit: (ball: unknown) => void
): Promise<number> {
  const pending = await getPendingBalls(matchId);
  for (const item of pending) {
    emit(item.ball);
    await removePendingBall(item.id);
  }
  return pending.length;
}
