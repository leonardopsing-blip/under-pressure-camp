import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

export function StatusBadge({ label, className }: { label: string; className?: string }) {
  return (
    <View className={cn('self-start rounded-full border px-3 py-1', className)}>
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );
}
