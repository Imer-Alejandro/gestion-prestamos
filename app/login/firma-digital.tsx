import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Pantalla de Firma Digital - VERSIÓN SIMPLIFICADA
 * Permite al usuario ingresar su firma como texto
 * (Versión sin canvas para evitar dependencias de Skia)
 */
export default function FirmaDigitalScreen() {
  const router = useRouter();
  const [signature, setSignature] = useState("");

  // Guarda la firma y continúa
  const handleSaveSignature = () => {
    if (!signature.trim()) {
      Alert.alert("Error", "Por favor, ingrese su firma antes de continuar");
      return;
    }

    // TODO: Guardar firma en el backend
    console.log("Firma guardada:", signature);
    
    Alert.alert(
      "Firma Guardada",
      "Su firma ha sido guardada exitosamente",
      [
        {
          text: "Continuar",
          onPress: () => router.push("/login/agregar-empleados"),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#13678A] justify-center px-8 py-10">
      {/* Botón de volver */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-8"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Header */}
      <View className="mb-10 items-center">
        <Ionicons
          name="information-circle-outline"
          size={40}
          color="#ffffff"
          style={{ marginBottom: 16 }}
        />
        <Text className="text-white text-3xl font-bold mb-4 text-center">
          Ingrese una firma
        </Text>
        <Text className="text-white/80 text-lg text-center">
          con la firma digital de tu{"\n"}organización!
        </Text>
      </View>

      {/* Input de firma (temporal - reemplazar con canvas cuando se instale Skia) */}
      <View className="bg-white/95 rounded-2xl p-6 mb-6">
        <Text className="text-[#13678A] text-sm mb-3 font-medium">
          Ingrese su firma:
        </Text>
        <TextInput
          value={signature}
          onChangeText={setSignature}
          placeholder="Escriba su firma aquí..."
          placeholderTextColor="#13678A40"
          className="bg-[#13678A]/5 border-2 border-[#13678A]/20 rounded-lg px-4 py-3 text-[#13678A] text-lg text-center font-bold"
          style={{ 
            fontFamily: 'cursive',
            fontSize: 24,
            minHeight: 100,
          }}
          multiline
        />
        <Text className="text-[#13678A]/60 text-xs mt-2 text-center">
          Nota: Próximamente podrás dibujar tu firma
        </Text>
      </View>

      {/* Botón de limpiar firma */}
      <TouchableOpacity
        onPress={() => setSignature("")}
        className="flex-row items-center justify-center mb-6 py-3"
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={22} color="#ffffff90" />
        <Text className="text-white/70 text-base ml-2">Limpiar firma</Text>
      </TouchableOpacity>

      {/* Botón de guardar firma */}
      <TouchableOpacity
        onPress={handleSaveSignature}
        className="bg-white/90 rounded-lg py-4 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-[#13678A] font-semibold text-lg">
          guardar firma
        </Text>
      </TouchableOpacity>
    </View>
  );
}
