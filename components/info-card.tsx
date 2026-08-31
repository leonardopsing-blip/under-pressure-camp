import { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-3xl border border-border bg-surface p-4">
      <Text className="text-sm font-semibold text-muted">{title}</Text>
      <View className="mt-3 gap-2">{children}</View>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View className="gap-1">
      <Text className="text-xs uppercase tracking-wide text-muted">{label}</Text>
      <Text className="text-base font-medium text-foreground">{value?.trim() ? value : 'No especificado'}</Text>
    </View>
  );
}
