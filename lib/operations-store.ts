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

export interface OperationsState {
  meals: Record<string, MealState>;
  payments: PaymentRecord[];
  lastSeenCampistaIds: string[];
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
    return { meals: {}, payments: [], lastSeenCampistaIds: [] };
  }
  try {
    const parsed = JSON.parse(raw) as OperationsState;
    return {
      meals: parsed.meals ?? {},
      payments: parsed.payments ?? [],
      lastSeenCampistaIds: parsed.lastSeenCampistaIds ?? [],
    };
  } catch {
    return { meals: {}, payments: [], lastSeenCampistaIds: [] };
  }
}

export async function saveOperationsState(state: OperationsState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
