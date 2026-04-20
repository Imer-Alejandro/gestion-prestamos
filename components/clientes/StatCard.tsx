import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  backgroundColor,
}: StatCardProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-gray-500 text-xs font-semibold mb-2">
            {label}
          </Text>
          <Text className="text-gray-900 text-lg font-bold">
            {value}
          </Text>
        </View>
        <View
          style={{ backgroundColor }}
          className="w-10 h-10 rounded-lg items-center justify-center"
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
    </View>
  );
}
