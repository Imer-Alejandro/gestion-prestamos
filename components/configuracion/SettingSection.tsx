import { Text, View } from "react-native";

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-gray-600 text-sm font-semibold px-4 mb-3 uppercase tracking-wider">
        {title}
      </Text>
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mx-4">
        {children}
      </View>
    </View>
  );
}
