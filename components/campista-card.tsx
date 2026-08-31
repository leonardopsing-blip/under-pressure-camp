import { Pressable, Text, View } from 'react-native';

import { Campista, getPaymentBadgeClasses, getPaymentLabel } from '@/lib/camp-data';
import { StatusBadge } from './status-badge';

export function CampistaCard({ campista, onPress }: { campista: Campista; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}> 
      <View className="rounded-3xl border border-border bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{campista.fullName}</Text>
            <Text className="mt-1 text-sm text-muted">C.I. {campista.idNumber}</Text>
          </View>
          <StatusBadge label={getPaymentLabel(campista.paymentStatus)} className={getPaymentBadgeClasses(campista.paymentStatus)} />
        </View>
        <View className="mt-4 gap-2">
          <Text className="text-sm text-foreground">Edad: {campista.age || 'No especificada'}</Text>
          <Text className="text-sm text-foreground">Red en casa: {campista.homeNetworkAttends}{campista.homeNetworkName ? ` · ${campista.homeNetworkName}` : ''}</Text>
          <Text className="text-sm text-foreground">Alergia: {campista.hasAllergy}{campista.allergyDetail ? ` · ${campista.allergyDetail}` : ''}</Text>
        </View>
      </View>
    </Pressable>
  );
}
