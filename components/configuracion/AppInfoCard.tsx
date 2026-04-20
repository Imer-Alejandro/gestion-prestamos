import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface AppInfoCardProps {
  version: string;
  onCheckUpdates: () => void;
}

export default function AppInfoCard({
  version,
  onCheckUpdates,
}: AppInfoCardProps) {
  return (
    <View className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-100 p-6 mx-4 mb-8">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Ionicons name="information-circle" size={28} color="#13678A" />
        <Text className="text-gray-900 text-lg font-bold ml-3">
          Información de la App
        </Text>
      </View>

      {/* Versión */}
      <View className="mb-4">
        <Text className="text-gray-600 text-sm mb-1">Versión</Text>
        <Text className="text-gray-900 text-base font-semibold">{version}</Text>
      </View>

      {/* Botón de actualización */}
      <TouchableOpacity
        onPress={onCheckUpdates}
        className="flex-row items-center justify-center bg-[#13678A] rounded-xl py-3"
        activeOpacity={0.8}
      >
        <Ionicons name="cloud-download-outline" size={18} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">Buscar actualizaciones</Text>
      </TouchableOpacity>
    </View>
  );
}
