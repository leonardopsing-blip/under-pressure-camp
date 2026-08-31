import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/screen-container';
import { InfoCard, InfoRow } from '@/components/info-card';
import { StatusBadge } from '@/components/status-badge';
import { getPaymentBadgeClasses, getPaymentLabel } from '@/lib/camp-data';
import { trpc } from '@/lib/trpc';

const mealConfig = {
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
} as const;

type MealType = keyof typeof mealConfig;

function MealButton({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]} className={`rounded-2xl border px-3 py-3 ${checked ? 'border-emerald-300 bg-emerald-100' : 'border-border bg-background'}`}>
      <Text className={`text-center text-sm font-semibold ${checked ? 'text-emerald-800' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

export default function CampistaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; focus?: string }>();
  const detailQuery = trpc.camp.detail.useQuery({ idNumber: params.id ?? '' }, { enabled: Boolean(params.id), refetchInterval: 30000 });
  const markMeal = trpc.camp.markMeal.useMutation({
    onSuccess: () => detailQuery.refetch(),
  });
  const addPaymentEntry = trpc.camp.addPaymentEntry.useMutation({
    onSuccess: () => detailQuery.refetch(),
  });

  const [paymentType, setPaymentType] = useState<'abono' | 'pago_completo'>('abono');
  const [method, setMethod] = useState<'efectivo' | 'transferencia' | 'deposito' | 'datafacil'>('efectivo');
  const [detail, setDetail] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>();

  const data = detailQuery.data;
  const campista = data?.campista;
  const payment = data?.payment;
  const meals = data?.meals ?? [];
  const entries = data?.entries ?? [];

  const paidPercentage = useMemo(() => Number(payment?.paidPercentage ?? 0), [payment?.paidPercentage]);

  if (!campista) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text className="text-xl font-bold text-foreground">Campista no encontrado</Text>
        <Text className="mt-2 text-center text-sm text-muted">El QR o la búsqueda no coinciden con un registro sincronizado.</Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-2xl bg-primary px-5 py-3">
          <Text className="text-base font-semibold text-white">Volver</Text>
        </Pressable>
      </ScreenContainer>
    );
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
    await addPaymentEntry.mutateAsync({
      idNumber: campista.idNumber,
      entryType: paymentType,
      method,
      detail: detail.trim(),
      receiptUrl: receiptUri,
    });
    setDetail('');
    setReceiptUri(undefined);
    Alert.alert('Registro guardado', 'El pago/abono quedó registrado en la base operativa.');
  }

  return (
    <ScreenContainer className="px-4 pb-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-5 pt-4">
          <Animated.View entering={FadeInDown.duration(350)} className="rounded-[28px] border border-border bg-surface p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm text-muted">Ficha del campista</Text>
                <Text className="mt-1 text-3xl font-bold text-foreground">{campista.fullName}</Text>
                <Text className="mt-2 text-base text-muted">C.I. {campista.idNumber}</Text>
              </View>
              <StatusBadge label={getPaymentLabel((payment?.status ?? 'no_pagado') as any)} className={getPaymentBadgeClasses((payment?.status ?? 'no_pagado') as any)} />
            </View>
            <View className="mt-5 rounded-3xl bg-background p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-muted">Porcentaje pagado</Text>
                <Text className="text-2xl font-bold text-foreground">{Math.round(paidPercentage)}%</Text>
              </View>
              <View className="mt-3 h-3 overflow-hidden rounded-full bg-border">
                <View style={{ width: `${Math.max(0, Math.min(100, paidPercentage))}%` }} className="h-full rounded-full bg-primary" />
              </View>
              <Text className="mt-3 text-sm text-muted">Método reciente: {payment?.method || 'Sin registro'}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(350)}>
            <InfoCard title="Datos principales">
              <InfoRow label="Edad" value={campista.age ?? ''} />
              <InfoRow label="Teléfono" value={campista.phone ?? ''} />
              <InfoRow label="Contacto de emergencia 1" value={campista.emergencyContact1 ?? ''} />
              <InfoRow label="Contacto de emergencia 2" value={campista.emergencyContact2 ?? ''} />
              <InfoRow label="Red en casa" value={`${campista.homeNetworkAttends ?? ''}${campista.homeNetworkName ? ` · ${campista.homeNetworkName}` : ''}`} />
            </InfoCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(180).duration(350)}>
            <InfoCard title="Salud y dieta">
              <InfoRow label="Enfermedad" value={`${campista.hasDisease ?? ''}${campista.diseaseDetail ? ` · ${campista.diseaseDetail}` : ''}`} />
              <InfoRow label="Medicación" value={`${campista.takesMedication ?? ''}${campista.medicationDetail ? ` · ${campista.medicationDetail}` : ''}`} />
              <InfoRow label="Alergia" value={`${campista.hasAllergy ?? ''}${campista.allergyDetail ? ` · ${campista.allergyDetail}` : ''}`} />
              <InfoRow label="Dieta por tratamiento" value={campista.treatmentDiet ?? ''} />
            </InfoCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(240).duration(350)}>
            <InfoCard title="Comidas del campamento">
              {(Object.keys(mealConfig) as MealType[]).map((type) => (
                <View key={type} className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">{mealConfig[type].title}</Text>
                  <View className="gap-2">
                    {mealConfig[type].slots.map((slot) => {
                      const checked = meals.some((meal) => meal.mealType === type && meal.mealDay === slot.key && meal.marked);
                      return (
                        <MealButton
                          key={slot.key}
                          label={slot.label}
                          checked={checked}
                          onPress={() => markMeal.mutate({ idNumber: campista.idNumber, mealType: type, mealDay: slot.key })}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}
            </InfoCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(350)}>
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
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(360).duration(350)}>
            <InfoCard title="Historial operativo">
              {entries.length === 0 ? (
                <Text className="text-sm text-muted">Aún no hay pagos nuevos registrados desde la app.</Text>
              ) : (
                entries.map((paymentEntry) => (
                  <View key={paymentEntry.id} className="rounded-2xl border border-border bg-background p-3">
                    <Text className="text-sm font-semibold text-foreground">{paymentEntry.entryType === 'abono' ? 'Abono' : 'Pago completo'} · {paymentEntry.method}</Text>
                    {paymentEntry.detail ? <Text className="mt-1 text-sm text-muted">{paymentEntry.detail}</Text> : null}
                    {paymentEntry.receiptUrl ? <Image source={{ uri: paymentEntry.receiptUrl }} style={{ width: '100%', height: 160, borderRadius: 16, marginTop: 8 }} /> : null}
                  </View>
                ))
              )}
            </InfoCard>
          </Animated.View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
