import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

/**
 * Pantalla 404 - Not Found
 * Se muestra cuando el usuario intenta acceder a una ruta que no existe
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#13678A] items-center justify-center px-8">
      {/* Icono de error */}
      <View className="mb-8">
        <Ionicons name="alert-circle-outline" size={120} color="#ffffff" />
      </View>

      {/* Mensaje */}
      <Text className="text-white text-3xl font-bold mb-3 text-center">
        Página no encontrada
      </Text>
      <Text className="text-white/70 text-base mb-8 text-center">
        Lo sentimos, la página que buscas no existe
      </Text>

      {/* Botón para volver */}
      <TouchableOpacity
        onPress={() => router.replace("/home")}
        className="bg-white/90 rounded-lg px-8 py-4"
        activeOpacity={0.8}
      >
        <Text className="text-[#13678A] font-semibold text-base">
          Volver al inicio
        </Text>
      </TouchableOpacity>
    </View>
  );
}

