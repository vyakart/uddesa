export interface StorageHealthStatus {
  available: boolean;
  quotaBytes?: number;
  usageBytes?: number;
  remainingBytes?: number;
  lowHeadroom: boolean;
}

const LOW_STORAGE_BYTES = 50 * 1024 * 1024;
const LOW_STORAGE_RATIO = 0.05;

export async function getStorageHealthStatus(): Promise<StorageHealthStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return {
      available: false,
      lowHeadroom: false,
    };
  }

  const estimate = await navigator.storage.estimate();
  const usageBytes = estimate.usage ?? 0;
  const quotaBytes = estimate.quota ?? 0;
  const remainingBytes = Math.max(0, quotaBytes - usageBytes);
  const lowHeadroomByBytes = remainingBytes > 0 && remainingBytes < LOW_STORAGE_BYTES;
  const lowHeadroomByRatio =
    quotaBytes > 0 && remainingBytes / quotaBytes < LOW_STORAGE_RATIO;

  return {
    available: true,
    usageBytes,
    quotaBytes,
    remainingBytes,
    lowHeadroom: lowHeadroomByBytes || lowHeadroomByRatio,
  };
}

export function formatStorageWarning(status: StorageHealthStatus): string | null {
  if (!status.available || !status.lowHeadroom) {
    return null;
  }

  const remainingMb = status.remainingBytes ? Math.round(status.remainingBytes / (1024 * 1024)) : null;
  if (remainingMb != null) {
    return `Browser storage is running low (${remainingMb} MB remaining). Export or back up important work.`;
  }

  return 'Browser storage is running low. Export or back up important work.';
}
