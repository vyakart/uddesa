import { formatStorageWarning, getStorageHealthStatus } from './storageHealth';

describe('storageHealth', () => {
  const originalStorage = navigator.storage;

  function setStorageEstimate(
    estimate: () => Promise<StorageEstimate>
  ) {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate },
    });
  }

  beforeEach(() => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: originalStorage,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: originalStorage,
    });
  });

  it('returns unavailable when storage estimate API is missing', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {},
    });

    const status = await getStorageHealthStatus();
    expect(status).toEqual({
      available: false,
      lowHeadroom: false,
    });
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: originalStorage,
    });
  });

  it('flags low headroom by bytes threshold', async () => {
    setStorageEstimate(async () => ({
      quota: 200 * 1024 * 1024,
      usage: 170 * 1024 * 1024,
    }));

    const status = await getStorageHealthStatus();
    expect(status.available).toBe(true);
    expect(status.lowHeadroom).toBe(true);
    expect(status.remainingBytes).toBe(30 * 1024 * 1024);
  });

  it('flags low headroom by ratio threshold', async () => {
    setStorageEstimate(async () => ({
      quota: 2_000_000_000,
      usage: 1_930_000_000,
    }));

    const status = await getStorageHealthStatus();
    expect(status.available).toBe(true);
    expect(status.lowHeadroom).toBe(true);
    expect(status.remainingBytes).toBe(70_000_000);
  });

  it('handles remaining-bytes floor and ratio low-headroom detection', async () => {
    setStorageEstimate(async () => ({
      quota: 10,
      usage: 25,
    }));

    const status = await getStorageHealthStatus();
    expect(status.usageBytes).toBe(25);
    expect(status.quotaBytes).toBe(10);
    expect(status.remainingBytes).toBe(0);
    expect(status.lowHeadroom).toBe(true);
  });

  it('returns available without low-headroom when quota is unknown', async () => {
    setStorageEstimate(async () => ({}));

    const status = await getStorageHealthStatus();
    expect(status.available).toBe(true);
    expect(status.usageBytes).toBe(0);
    expect(status.quotaBytes).toBe(0);
    expect(status.remainingBytes).toBe(0);
    expect(status.lowHeadroom).toBe(false);
  });

  it('formats warnings for remaining MB and generic low-storage fallback', () => {
    expect(formatStorageWarning({ available: false, lowHeadroom: false })).toBeNull();
    expect(formatStorageWarning({ available: true, lowHeadroom: false })).toBeNull();

    expect(
      formatStorageWarning({
        available: true,
        lowHeadroom: true,
        remainingBytes: 42 * 1024 * 1024,
      })
    ).toContain('42 MB remaining');

    expect(
      formatStorageWarning({
        available: true,
        lowHeadroom: true,
        remainingBytes: 0,
      })
    ).toContain('Browser storage is running low.');
  });
});
