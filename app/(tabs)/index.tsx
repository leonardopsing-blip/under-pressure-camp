import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ScreenContainer } from '@/components/screen-container';
import { CampistaCard } from '@/components/campista-card';
import { findCampistaByScan, searchCampistas } from '@/lib/camp-data';
import { loadOperationsState, saveOperationsState, type OperationsState } from '@/lib/operations-store';
import { trpc } from '@/lib/trpc';

type LiveCampista = {
  id: string;
  fullName: string;
  idNumber: string;
  age: string;
  phone: string;
  emergencyContacts: string[];
  homeNetworkAttends: string;
  homeNetworkName: string;
  hasDisease: string;
  diseaseDetail: string;
  takesMedication: string;
  medicationDetail: string;
  hasAllergy: string;
  allergyDetail: string;
  treatmentDiet: string;
  paymentStatus: 'pagado' | 'abonado' | 'no_pagado';
  paidPercentage: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatusLabel: string;
  paymentStatusColor: string;
  sourceRow: number;
  paymentSourceRow: number | null;
  paymentMethod: string;
  paymentDetail: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [operations, setOperations] = useState<OperationsState>({ meals: {}, payments: [], lastSeenCampistaIds: [] });

  const syncLive = trpc.camp.syncLive.useMutation();
  const listQuery = trpc.camp.list.useQuery(undefined, { refetchInterval: 30000 });
  const alertsQuery = trpc.camp.alerts.useQuery(undefined, { refetchInterval: 30000 });

  useEffect(() => {
    loadOperationsState().then(setOperations);
    syncLive.mutate();
  }, []);

  const liveCampistas = useMemo<LiveCampista[]>(() => {
    if (!listQuery.data) return [];
    return listQuery.data.map((item) => ({
      id: item.idNumber,
      fullName: item.fullName,
      idNumber: item.idNumber,
      age: item.age ?? '',
      phone: item.phone ?? '',
      emergencyContacts: [item.emergencyContact1, item.emergencyContact2].filter(Boolean) as string[],
      homeNetworkAttends: item.homeNetworkAttends ?? '',
      homeNetworkName: item.homeNetworkName ?? '',
      hasDisease: item.hasDisease ?? '',
      diseaseDetail: item.diseaseDetail ?? '',
      takesMedication: item.takesMedication ?? '',
      medicationDetail: item.medicationDetail ?? '',
      hasAllergy: item.hasAllergy ?? '',
      allergyDetail: item.allergyDetail ?? '',
      treatmentDiet: item.treatmentDiet ?? '',
      paymentStatus: (item.payment?.status ?? 'no_pagado') as 'pagado' | 'abonado' | 'no_pagado',
      paidPercentage: Number(item.payment?.paidPercentage ?? 0),
      paidAmount: Number(item.payment?.paidAmount ?? 0),
      pendingAmount: Number(item.payment?.pendingAmount ?? 100),
      paymentStatusLabel: item.payment?.status === 'pagado' ? 'Pagado' : item.payment?.status === 'abonado' ? 'Abonado' : 'No pagado',
      paymentStatusColor: item.payment?.status === 'pagado' ? '#16A34A' : item.payment?.status === 'abonado' ? '#F59E0B' : '#DC2626',
      sourceRow: item.sourceRow ?? 0,
      paymentSourceRow: item.payment?.sourceRow ?? null,
      paymentMethod: item.payment?.method ?? '',
      paymentDetail: item.payment?.detail ?? '',
    }));
  }, [listQuery.data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return liveCampistas;
    return searchCampistas(query).filter((campista) => liveCampistas.some((live) => live.idNumber === campista.idNumber));
  }, [query, liveCampistas]);

  const newCampistas = useMemo(() => {
    return (alertsQuery.data ?? [])
      .filter((alert) => alert.alertType === 'nuevo_campista' && alert.campista)
      .map((alert) => ({
        alertId: alert.id,
        id: alert.campista!.idNumber,
        fullName: alert.campista!.fullName,
      }));
  }, [alertsQuery.data]);

  const summary = useMemo(() => {
    const total = liveCampistas.length;
    const pagado = liveCampistas.filter((c) => c.paymentStatus === 'pagado').length;
    const abonado = liveCampistas.filter((c) => c.paymentStatus === 'abonado').length;
    const noPagado = liveCampistas.filter((c) => c.paymentStatus === 'no_pagado').length;
    return { total, pagado, abonado, noPagado };
  }, [liveCampistas]);

  async function openScanner() {
    if (Platform.OS === 'web') {
      Alert.alert('Escáner móvil', 'En el demo web el escáner puede depender del navegador. En teléfono se abre la cámara; aquí también puedes usar la búsqueda manual.');
      setScannerVisible(true);
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesito acceso a la cámara para escanear el QR del campista.');
        return;
      }
    }
    setScannerVisible(true);
  }

  function handleScan(data: string) {
    const campista = findCampistaByScan(data);
    setScannerVisible(false);
    if (!campista) {
      Alert.alert('No encontrado', 'No encontré un campista con ese QR. Prueba con búsqueda manual.');
      return;
    }
    router.push((`/campista/${campista.id}`) as Href);
  }

  async function markAlertsAsSeen() {
    const next = { ...operations, lastSeenCampistaIds: liveCampistas.map((c) => c.id) };
    setOperations(next);
    await saveOperationsState(next);
  }

  return (
    <ScreenContainer className="px-4 pb-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-5 pt-4">
          <View className="rounded-[28px] bg-primary p-4">
            <Text className="text-sm font-medium text-white/80">Under Pressure Camp</Text>
            <Text className="mt-1 text-2xl font-bold text-white">Control QR de campistas</Text>
            <Text className="mt-2 text-sm leading-5 text-white/85">
              Escanea el QR, revisa datos críticos, marca comidas y registra pagos con información sincronizada desde los Sheets.
            </Text>
            <View className="mt-4 gap-2">
              <Pressable onPress={openScanner} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton]}>
                <Text className="text-center text-base font-bold text-primary">Escanear QR</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/campistas' as Href)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}>
                <Text className="text-center text-base font-semibold text-white">Ver lista completa</Text>
              </Pressable>
            </View>
          </View>

          {newCampistas.length > 0 ? (
            <View className="rounded-3xl border border-amber-300 bg-amber-50 p-4">
              <Text className="text-base font-bold text-amber-800">Nuevos campistas detectados</Text>
              <Text className="mt-1 text-sm text-amber-800">
                Hay {newCampistas.length} campista(s) nuevos detectados desde la última revisión.
              </Text>
              <View className="mt-3 gap-2">
                {newCampistas.slice(0, 3).map((campista) => (
                  <Pressable key={campista.alertId} onPress={() => router.push((`/campista/${campista.id}?focus=pagos`) as Href)}>
                    <Text className="text-sm font-semibold text-amber-900">{campista.fullName}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="mt-4 flex-row gap-2">
                <Pressable onPress={() => router.push('/(tabs)/campistas' as Href)} className="rounded-full bg-amber-600 px-4 py-2">
                  <Text className="text-sm font-semibold text-white">Revisar lista</Text>
                </Pressable>
                <Pressable onPress={markAlertsAsSeen} className="rounded-full border border-amber-400 px-4 py-2">
                  <Text className="text-sm font-semibold text-amber-800">Marcar vistas</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <View className="rounded-3xl border border-border bg-surface p-4">
              <Text className="text-sm text-muted">Campistas registrados</Text>
              <Text className="mt-2 text-3xl font-bold text-foreground">{summary.total}</Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <Text className="text-sm text-emerald-700">Pagados</Text>
                <Text className="mt-2 text-2xl font-bold text-emerald-800">{summary.pagado}</Text>
              </View>
              <View className="flex-1 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-sm text-amber-700">Abonados</Text>
                <Text className="mt-2 text-2xl font-bold text-amber-800">{summary.abonado}</Text>
              </View>
              <View className="flex-1 rounded-3xl border border-red-200 bg-red-50 p-4">
                <Text className="text-sm text-red-700">No pagados</Text>
                <Text className="mt-2 text-2xl font-bold text-red-800">{summary.noPagado}</Text>
              </View>
            </View>
          </View>

          <View className="rounded-3xl border border-border bg-surface p-4">
            <Text className="text-lg font-bold text-foreground">Búsqueda rápida</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o cédula"
              placeholderTextColor="#687076"
              className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground"
            />
            <View className="mt-4 gap-3">
              {filtered.slice(0, 5).map((campista) => (
                <CampistaCard key={campista.id} campista={campista} onPress={() => router.push((`/campista/${campista.id}`) as Href)} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {scannerVisible ? (
        <View className="absolute inset-0 bg-black">
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          />
          <View className="absolute left-4 right-4 top-14 rounded-3xl bg-black/60 p-4">
            <Text className="text-center text-base font-semibold text-white">Apunta al QR del campista</Text>
          </View>
          <Pressable onPress={() => setScannerVisible(false)} className="absolute bottom-12 left-6 right-6 rounded-2xl bg-white px-4 py-4">
            <Text className="text-center text-base font-bold text-black">Cerrar escáner</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  secondaryButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressedButton: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
