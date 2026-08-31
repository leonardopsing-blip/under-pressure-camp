import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '@/components/screen-container';
import { InfoCard, InfoRow } from '@/components/info-card';
import { StatusBadge } from '@/components/status-badge';
import { campData, getPaymentBadgeClasses, getPaymentLabel, type Campista } from '@/lib/camp-data';
import {
  emptyMealState,
  loadOperationsState,
  saveOperationsState,
  type MealState,
  type MealType,
  type OperationsState,
  type PaymentRecord,
} from '@/lib/operations-store';

const mealConfig: Record<MealType, { title: string; slots: { key: string; label: string }[] }> = {
  desayuno: {
    title: 'Desayunos',
    slots: [
      { key: 'sabado', label: 'Desayuno de sábado' },
      { key: 'domingo', label: 'Desayuno de domingo' },
    ],
  },
  almuerzo: {
    title: 'Almuerzos',
    slots: [
      { key: 'sabado', label: 'Almuerzo de sábado' },
      { key: 'domingo', label: 'Almuerzo de domingo' },
    ],
  },
  cena: {
    title: 'Cenas',
    slots: [
      { key: 'viernes', label: 'Cena de viernes' },
      { key: 'sabado', label: 'Cena de sábado' },
    ],
  },
};

function MealButton({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]} className={`flex-1 rounded-2xl border px-3 py-3 ${checked ? 'border-emerald-300 bg-emerald-100' : 'border-border bg-background'}`}>
      <Text className={`text-center text-sm font-semibold ${checked ? 'text-emerald-800' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

export default function CampistaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; focus?: string }>();
  const campista = useMemo(() => campData.campistas.find((item) => item.id === params.id), [params.id]) as Campista | undefined;
  const [operations, setOperations] = useState<OperationsState>({ meals: {}, payments: [], lastSeenCampistaIds: [] });
  const [paymentType, setPaymentType] = useState<'abono' | 'pago_completo'>('abono');
  const [method, setMethod] = useState<'efectivo' | 'transferencia' | 'deposito' | 'datafacil'>('efectivo');
  const [detail, setDetail] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>();

  useEffect(() => {
    loadOperationsState().then(setOperations);
  }, []);

  if (!campista) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text className="text-xl font-bold text-foreground">Campista no encontrado</Text>
        <Text className="mt-2 text-center text-sm text-muted">El QR o la búsqueda no coinciden con un registro del demo.</Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-2xl bg-primary px-5 py-3">
          <Text className="text-base font-semibold text-white">Volver</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const meals = campista ? (operations.meals[campista.id] ?? emptyMealState) : emptyMealState;
  const campistaPayments = campista ? operations.payments.filter((payment) => payment.campistaId === campista.id) : [];

  async function persist(next: OperationsState) {
    setOperations(next);
    await saveOperationsState(next);
  }

  async function toggleMeal(type: MealType, slotKey: string) {
    if (!campista) return;
    const current = operations.meals[campista.id] ?? emptyMealState;
    if ((current[type] as Record<string, boolean>)[slotKey]) {
      Alert.alert('Ya registrado', 'Esta comida ya quedó marcada para este campista.');
      return;
    }
    const next: OperationsState = {
      ...operations,
      meals: {
        ...operations.meals,
        [campista.id]: {
          ...current,
          [type]: {
            ...current[type],
            [slotKey]: true,
          },
        } as MealState,
      },
    };
    await persist(next);
  }

  async function pickReceipt(fromCamera: boolean) {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function savePayment() {
    if (!campista) return;
    const record: PaymentRecord = {
      id: `${campista.id}-${Date.now()}`,
      campistaId: campista.id,
      campistaName: campista.fullName,
      type: paymentType,
      method,
      detail: detail.trim(),
      receiptUri,
      createdAt: new Date().toISOString(),
    };
    const next = { ...operations, payments: [record, ...operations.payments] };
    await persist(next);
    setDetail('');
    setReceiptUri(undefined);
    Alert.alert('Registro guardado', 'El pago/abono quedó registrado en el demo operativo.');
  }

  return (
    <ScreenContainer className="px-4 pb-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-5 pt-4">
          <View className="rounded-[28px] border border-border bg-surface p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm text-muted">Ficha del campista</Text>
                <Text className="mt-1 text-3xl font-bold text-foreground">{campista.fullName}</Text>
                <Text className="mt-2 text-base text-muted">C.I. {campista.idNumber}</Text>
              </View>
              <StatusBadge label={getPaymentLabel(campista.paymentStatus)} className={getPaymentBadgeClasses(campista.paymentStatus)} />
            </View>
          </View>

          <InfoCard title="Datos principales">
            <InfoRow label="Edad" value={campista.age} />
            <InfoRow label="Teléfono" value={campista.phone} />
            <InfoRow label="Contacto de emergencia 1" value={campista.emergencyContacts[0]} />
            <InfoRow label="Contacto de emergencia 2" value={campista.emergencyContacts[1]} />
            <InfoRow label="Red en casa" value={`${campista.homeNetworkAttends}${campista.homeNetworkName ? ` · ${campista.homeNetworkName}` : ''}`} />
          </InfoCard>

          <InfoCard title="Salud y dieta">
            <InfoRow label="Enfermedad" value={`${campista.hasDisease}${campista.diseaseDetail ? ` · ${campista.diseaseDetail}` : ''}`} />
            <InfoRow label="Medicación" value={`${campista.takesMedication}${campista.medicationDetail ? ` · ${campista.medicationDetail}` : ''}`} />
            <InfoRow label="Alergia" value={`${campista.hasAllergy}${campista.allergyDetail ? ` · ${campista.allergyDetail}` : ''}`} />
            <InfoRow label="Dieta por tratamiento" value={campista.treatmentDiet} />
          </InfoCard>

          <InfoCard title="Comidas del campamento">
            {(['desayuno', 'almuerzo', 'cena'] as MealType[]).map((type) => (
              <View key={type} className="gap-2">
                <Text className="text-sm font-semibold text-foreground">{mealConfig[type].title}</Text>
                <View className="gap-2">
                  {mealConfig[type].slots.map((slot) => (
                    <MealButton
                      key={slot.key}
                      label={slot.label}
                      checked={(meals[type] as Record<string, boolean>)[slot.key]}
                      onPress={() => toggleMeal(type, slot.key)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </InfoCard>

          <InfoCard title="Registrar pago o abono">
            <View className="flex-row gap-2">
              {(['abono', 'pago_completo'] as const).map((option) => (
                <Pressable key={option} onPress={() => setPaymentType(option)} className={`flex-1 rounded-2xl border px-3 py-3 ${paymentType === option ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                  <Text className="text-center text-sm font-semibold text-foreground">{option === 'abono' ? 'Abono' : 'Pago completo'}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {(['efectivo', 'transferencia', 'deposito', 'datafacil'] as const).map((option) => (
                <Pressable key={option} onPress={() => setMethod(option)} className={`rounded-full border px-4 py-2 ${method === option ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                  <Text className="text-sm font-medium text-foreground">{option}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="Detalle de transferencia, depósito o referencia"
              placeholderTextColor="#687076"
              multiline
              className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground"
            />
            <View className="flex-row gap-2">
              <Pressable onPress={() => pickReceipt(false)} className="flex-1 rounded-2xl border border-border bg-background px-4 py-3">
                <Text className="text-center text-sm font-semibold text-foreground">Subir comprobante</Text>
              </Pressable>
              <Pressable onPress={() => pickReceipt(true)} className="flex-1 rounded-2xl border border-border bg-background px-4 py-3">
                <Text className="text-center text-sm font-semibold text-foreground">Tomar foto</Text>
              </Pressable>
            </View>
            {receiptUri ? <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 180, borderRadius: 20 }} /> : null}
            <Pressable onPress={savePayment} className="rounded-2xl bg-primary px-4 py-4">
              <Text className="text-center text-base font-bold text-white">Guardar registro</Text>
            </Pressable>
          </InfoCard>

          <InfoCard title="Historial operativo del demo">
            {campistaPayments.length === 0 ? (
              <Text className="text-sm text-muted">Aún no hay pagos nuevos registrados desde la app.</Text>
            ) : (
              campistaPayments.map((payment) => (
                <View key={payment.id} className="rounded-2xl border border-border bg-background p-3">
                  <Text className="text-sm font-semibold text-foreground">{payment.type === 'abono' ? 'Abono' : 'Pago completo'} · {payment.method}</Text>
                  {payment.detail ? <Text className="mt-1 text-sm text-muted">{payment.detail}</Text> : null}
                  {payment.receiptUri ? <Image source={{ uri: payment.receiptUri }} style={{ width: '100%', height: 160, borderRadius: 16, marginTop: 8 }} /> : null}
                </View>
              ))
            )}
          </InfoCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
