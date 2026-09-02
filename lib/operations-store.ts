import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealType = 'desayuno' | 'almuerzo' | 'cena';

export interface MealState {
  desayuno: Record<'sabado' | 'domingo', boolean>;
  almuerzo: Record<'sabado' | 'domingo', boolean>;
  cena: Record<'viernes' | 'sabado', boolean>;
}

export interface PaymentRecord {
  id: string;
  campistaId: string;
  campistaName: string;
  type: 'abono' | 'pago_completo';
  method: 'efectivo' | 'transferencia' | 'deposito' | 'datafacil';
  detail: string;
  receiptUri?: string;
  createdAt: string;
}

export interface PendingMeal {
  campistaId: string;
  mealType: MealType;
  mealDay: string;
}

export interface OperationsState {
  meals: Record<string, MealState>;
  payments: PaymentRecord[];
  lastSeenCampistaIds: string[];
  pendingMeals: PendingMeal[];
}

const STORAGE_KEY = 'under-pressure-camp/operations-v1';

export const emptyMealState: MealState = {
  desayuno: { sabado: false, domingo: false },
  almuerzo: { sabado: false, domingo: false },
  cena: { viernes: false, sabado: false },
};

export async function loadOperationsState(): Promise<OperationsState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { meals: {}, payments: [], lastSeenCampistaIds: [], pendingMeals: [] };
  }
  try {
    const parsed = JSON.parse(raw) as OperationsState;
    return {
      meals: parsed.meals ?? {},
      payments: parsed.payments ?? [],
      lastSeenCampistaIds: parsed.lastSeenCampistaIds ?? [],
      pendingMeals: parsed.pendingMeals ?? [],
    };
  } catch {
    return { meals: {}, payments: [], lastSeenCampistaIds: [], pendingMeals: [] };
  }
}

export async function saveOperationsState(state: OperationsState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function markMealLocally(
  campistaId: string,
  mealType: MealType,
  mealDay: string,
): Promise<OperationsState> {
  const current = await loadOperationsState();
  const previous = current.meals[campistaId] ?? emptyMealState;
  const alreadyPending = current.pendingMeals.some(
    (item) => item.campistaId === campistaId && item.mealType === mealType && item.mealDay === mealDay,
  );
  const next: OperationsState = {
    ...current,
    pendingMeals: alreadyPending ? current.pendingMeals : [...current.pendingMeals, { campistaId, mealType, mealDay }],
    meals: {
      ...current.meals,
      [campistaId]: {
        ...previous,
        [mealType]: {
          ...previous[mealType],
          [mealDay]: true,
        },
      } as MealState,
    },
  };
  await saveOperationsState(next);
  return next;
}

export async function clearPendingMeal(campistaId: string, mealType: MealType, mealDay: string) {
  const current = await loadOperationsState();
  const next = {
    ...current,
    pendingMeals: current.pendingMeals.filter(
      (item) => !(item.campistaId === campistaId && item.mealType === mealType && item.mealDay === mealDay),
    ),
  };
  await saveOperationsState(next);
  return next;
}
