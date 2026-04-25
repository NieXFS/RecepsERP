type AttemptRecord = {
  failedCount: number;
  lockedUntil: number | null;
  lockSequence: number;
};

const LOCK_STEP = 3;
const BASE_LOCK_MS = 60_000;
const store = new Map<string, AttemptRecord>();

export function checkLock(userId: string): { locked: boolean; retryAfterSec?: number } {
  const record = store.get(userId);
  const now = Date.now();

  if (!record?.lockedUntil || record.lockedUntil <= now) {
    return { locked: false };
  }

  return {
    locked: true,
    retryAfterSec: Math.ceil((record.lockedUntil - now) / 1000),
  };
}

export function recordFailure(userId: string): {
  lockedUntil: number | null;
  retryAfterSec?: number;
} {
  const record = store.get(userId) ?? {
    failedCount: 0,
    lockedUntil: null,
    lockSequence: 0,
  };

  record.failedCount += 1;

  if (record.failedCount % LOCK_STEP === 0) {
    const lockDuration = BASE_LOCK_MS * Math.pow(2, record.lockSequence);
    record.lockedUntil = Date.now() + lockDuration;
    record.lockSequence += 1;
    store.set(userId, record);

    return {
      lockedUntil: record.lockedUntil,
      retryAfterSec: Math.ceil(lockDuration / 1000),
    };
  }

  store.set(userId, record);
  return { lockedUntil: null };
}

export function recordSuccess(userId: string): void {
  store.delete(userId);
}

export function clearAll(): void {
  store.clear();
}
