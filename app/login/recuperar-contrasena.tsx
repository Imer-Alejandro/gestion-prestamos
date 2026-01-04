import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

/**
 * Pantalla de Recuperar Contraseña
 * Permite al usuario solicitar el restablecimiento de su contraseña
 */
export default function RecuperarContrasenaScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#13678A] px-8 pt-20 pb-10">
      <View className="mb-10">
        <Text className="text-white text-3xl font-bold">
          Recuperar contraseña
        </Text>
      </View>

      {/* TODO: Implementar formulario de recuperación */}
      <Text className="text-white/80 text-base mb-6">
        Funcionalidad en desarrollo...
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        className="flex-row items-center justify-center py-3"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#ffffff90" />
        <Text className="text-white/70 text-sm ml-2">Volver</Text>
      </TouchableOpacity>
    </View>
  );
}
