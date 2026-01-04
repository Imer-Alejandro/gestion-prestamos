import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

/**
 * Pantalla de Selección de Tipo de Registro
 * Permite elegir entre registrarse como Organización o Empleado
 */
export default function RegistroTipoScreen() {
  const router = useRouter();

  // Maneja la selección del tipo de registro
  const handleSelectType = (type: "organizacion" | "empleado") => {
    if (type === "organizacion") {
      router.push("/login/registro-organizacion");
    } else {
      router.push("/login/registro-empleado");
    }
  };

  return (
    <View className="flex-1 bg-[#13678A] px-8 pt-20 pb-10">
      {/* Header con título */}
      <View className="mb-16">
        <Text className="text-white text-3xl font-bold text-center leading-tight">
          Como desea{"\n"}aplicar su registro?
        </Text>
      </View>

      {/* Opciones de registro */}
      <View className="flex-row justify-center gap-6 mb-8">
        {/* Opción Organización */}
        <TouchableOpacity
          onPress={() => handleSelectType("organizacion")}
          className="items-center"
          activeOpacity={0.7}
        >
          {/* Card con ilustración */}
          <View className="bg-white/95 rounded-2xl p-6 w-36 h-36 items-center justify-center mb-3 shadow-lg">
            {/* Ilustración de organización (building/team) */}
            <View className="bg-[#13678A]/10 rounded-full p-4 mb-2">
              <Ionicons name="business" size={48} color="#13678A" />
            </View>
          </View>
          {/* Label */}
          <Text className="text-white text-base font-medium">
            Organización
          </Text>
        </TouchableOpacity>

        {/* Opción Empleado */}
        <TouchableOpacity
          onPress={() => handleSelectType("empleado")}
          className="items-center"
          activeOpacity={0.7}
        >
          {/* Card con ilustración */}
          <View className="bg-white/95 rounded-2xl p-6 w-36 h-36 items-center justify-center mb-3 shadow-lg">
            {/* Ilustración de empleado (person) */}
            <View className="bg-[#13678A]/10 rounded-full p-4 mb-2">
              <Ionicons name="person" size={48} color="#13678A" />
            </View>
          </View>
          {/* Label */}
          <Text className="text-white text-base font-medium">Empleado</Text>
        </TouchableOpacity>
      </View>

      {/* Botón para volver al login */}
      <View className="absolute bottom-10 left-8 right-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center py-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff90" />
          <Text className="text-white/70 text-sm ml-2">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
