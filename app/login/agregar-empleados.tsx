import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

/**
 * Pantalla de Agregar Empleados con QR Code
 * Genera un código QR único para que los empleados se unan a la organización
 * Muestra el código de la organización para compartir
 */
export default function AgregarEmpleadosScreen() {
  const router = useRouter();
  // Generar código único de organización (en producción vendría del backend)
  const [organizationCode] = useState("403567");
  const qrValue = `kannicash://join/${organizationCode}`;

  // Copia el código al portapapeles
  const handleCopyCode = () => {
    // TODO: Implementar copia al portapapeles con Clipboard de react-native
    Alert.alert("Copiado", "Código copiado al portapapeles");
  };

  // Comparte el código QR
  const handleShareQR = () => {
    // TODO: Implementar compartir con Share API de react-native
    Alert.alert("Compartir", "Funcionalidad de compartir en desarrollo");
  };

  // Continúa al onboarding
  const handleContinue = () => {
    router.push("/login/onboarding");
  };

  return (
    <View className="flex-1 bg-[#13678A] px-8 pt-16 pb-10">
      {/* Header */}
      <View className="mb-12">
        <Text className="text-white text-2xl font-bold text-center leading-tight">
          Agregue sus empleados a{"\n"}la organización
        </Text>
      </View>

      {/* QR Code Container */}
      <View className="bg-white/95 rounded-3xl p-8 mb-6 items-center">
        {/* QR Code */}
        <View className="bg-white p-4 rounded-2xl mb-4">
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor="white"
            color="#13678A"
          />
        </View>

        {/* Código de organización */}
        <Text className="text-[#13678A]/70 text-sm mb-2">
          Código de la organización
        </Text>
        <View className="flex-row items-center bg-[#13678A]/10 rounded-lg px-4 py-3 mb-3">
          <Text className="text-[#13678A] text-2xl font-bold tracking-widest mr-3">
            {organizationCode}
          </Text>
          <TouchableOpacity
            onPress={handleCopyCode}
            className="ml-2"
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={24} color="#13678A" />
          </TouchableOpacity>
        </View>

        {/* Botón de compartir */}
        <TouchableOpacity
          onPress={handleShareQR}
          className="flex-row items-center mt-2"
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color="#13678A" />
          <Text className="text-[#13678A] text-sm font-medium ml-2">
            Compartir código QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instrucciones */}
      <View className="bg-white/10 rounded-lg p-4 mb-8">
        <Text className="text-white/80 text-xs leading-relaxed text-center">
          Comparta este código QR o el código numérico con sus empleados para
          que puedan unirse a su organización
        </Text>
      </View>

      {/* Botón continuar */}
      <TouchableOpacity
        onPress={handleContinue}
        className="bg-white/90 rounded-lg py-4 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-[#13678A] font-semibold text-base">
          continuar
        </Text>
      </TouchableOpacity>

      {/* Opción para omitir */}
      <TouchableOpacity
        onPress={handleContinue}
        className="items-center mt-4 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-white/70 text-sm">Omitir este paso</Text>
      </TouchableOpacity>
    </View>
  );
}
