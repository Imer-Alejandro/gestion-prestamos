import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

interface ProgressBarProps {
  percentage: number;
  color?: string;
  label?: string;
}

export default function ProgressBar({
  percentage,
  color = "#13678A",
  label,
}: ProgressBarProps) {
  const safePct = Math.max(0, Math.min(100, percentage));

  return (
    <View>
      {label && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600 text-sm font-medium">{label}</Text>
          <Text className="text-gray-900 text-sm font-bold">
            {safePct.toFixed(0)}%
          </Text>
        </View>
      )}
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          style={{
            width: `${safePct}%`,
            backgroundColor: color,
            height: "100%",
          }}
          className="rounded-full"
        />
      </View>
    </View>
  );
}
