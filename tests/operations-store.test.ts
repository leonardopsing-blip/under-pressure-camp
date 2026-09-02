import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
  },
}));

import { loadOperationsState, markMealLocally } from '../lib/operations-store';

describe('operations store', () => {
  beforeEach(() => storage.clear());

  it('persists Saturday lunch offline and queues it for sync', async () => {
    const next = await markMealLocally('0941630824', 'almuerzo', 'sabado');

    expect(next.meals['0941630824'].almuerzo.sabado).toBe(true);
    expect(next.meals['0941630824'].almuerzo.domingo).toBe(false);
    expect(next.pendingMeals).toEqual([
      { campistaId: '0941630824', mealType: 'almuerzo', mealDay: 'sabado' },
    ]);

    const restored = await loadOperationsState();
    expect(restored.meals['0941630824'].almuerzo.sabado).toBe(true);
    expect(restored.pendingMeals).toHaveLength(1);
  });
});
