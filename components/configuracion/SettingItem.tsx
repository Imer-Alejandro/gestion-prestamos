import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  trailing?: "chevron" | "toggle" | "switch" | "none";
  isActive?: boolean;
  badge?: string;
  isDivider?: boolean;
}

export default function SettingItem({
  icon,
  title,
  description,
  onPress,
  trailing = "chevron",
  isActive = false,
  badge,
  isDivider = true,
}: SettingItemProps) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        className="flex-row items-center px-6 py-4"
      >
        {/* Icono */}
        <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-4">
          <Ionicons name={icon} size={22} color="#13678A" />
        </View>

        {/* Contenido */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-900 text-base font-semibold flex-1">
              {title}
            </Text>
            {badge && (
              <View className="bg-red-100 rounded-full px-2 py-1">
                <Text className="text-red-600 text-xs font-bold">{badge}</Text>
              </View>
            )}
          </View>
          {description && (
            <Text className="text-gray-500 text-sm mt-1">{description}</Text>
          )}
        </View>

        {/* Trailing */}
        <View className="ml-2">
          {trailing === "chevron" && (
            <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
          )}
          {trailing === "toggle" && (
            <View
              className={`w-12 h-7 rounded-full ${
                isActive ? "bg-green-500" : "bg-gray-300"
              } items-center justify-center`}
            >
              <View
                className={`w-6 h-6 bg-white rounded-full ${
                  isActive ? "ml-2.5" : "-ml-2.5"
                }`}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {isDivider && <View className="h-px bg-gray-100 ml-16" />}
    </>
  );
}
