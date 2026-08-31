import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { CampistaCard } from '@/components/campista-card';
import { searchCampistas } from '@/lib/camp-data';
import { trpc } from '@/lib/trpc';

export default function CampistasScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const listQuery = trpc.camp.list.useQuery(undefined, { refetchInterval: 30000 });

  const data = useMemo(() => {
    const live = (listQuery.data ?? []).map((item) => ({
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
    if (!query.trim()) return live;
    const localMatches = new Set(searchCampistas(query).map((item) => item.idNumber));
    return live.filter((item) => localMatches.has(item.idNumber));
  }, [listQuery.data, query]);

  return (
    <ScreenContainer className="px-4 pb-4">
      <View className="gap-4 pt-4">
        <View>
          <Text className="text-3xl font-bold text-foreground">Campistas</Text>
          <Text className="mt-1 text-sm text-muted">Lista sincronizada con el Forms y el registro de pagos.</Text>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar campista"
          placeholderTextColor="#687076"
          className="rounded-2xl border border-border bg-surface px-4 py-3 text-base text-foreground"
        />
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <CampistaCard campista={item} onPress={() => router.push((`/campista/${item.id}`) as Href)} />
          )}
        />
      </View>
    </ScreenContainer>
  );
}
