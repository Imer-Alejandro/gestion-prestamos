import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

/**
 * Pantalla de Ayuda
 * Información y soporte para el usuario
 */
export default function AyudaScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center px-8">
      <View className="bg-[#13678A]/10 rounded-full p-8 mb-6">
        <Ionicons name="help-circle" size={64} color="#13678A" />
      </View>
      
      <Text className="text-gray-800 text-2xl font-bold mb-2 text-center">
        Ayuda
      </Text>
      
      <Text className="text-gray-600 text-base text-center mb-8">
        Funcionalidad en desarrollo
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        className="bg-[#13678A] rounded-xl px-6 py-3"
        activeOpacity={0.8}
      >
        <Text className="text-white font-semibold text-base">
          Volver
        </Text>
      </TouchableOpacity>
    </View>
  );
}
