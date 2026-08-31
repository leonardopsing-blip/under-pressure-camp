import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { CampistaCard } from '@/components/campista-card';
import { searchCampistas } from '@/lib/camp-data';

export default function CampistasScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const data = useMemo(() => searchCampistas(query), [query]);

  return (
    <ScreenContainer className="px-4 pb-4">
      <View className="gap-4 pt-4">
        <View>
          <Text className="text-3xl font-bold text-foreground">Campistas</Text>
          <Text className="mt-1 text-sm text-muted">Busca por nombre o cédula y abre la ficha operativa.</Text>
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
