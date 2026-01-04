import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Pantalla de Registro de Empleado
 * Permite a un empleado unirse a una organización mediante:
 * - Nombre completo
 * - Correo electrónico
 * - Teléfono
 * - Código de organización
 * - Contraseña
 */
export default function RegistroEmpleadoScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    codigoArea: "",
    telefono: "",
    codigoOrganizacion: "",
    nuevaContrasena: "",
    repetirContrasena: "",
  });

  // Valida el formato del correo electrónico
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Maneja el envío del formulario
  const handleSubmit = () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    if (!formData.correo.trim() || !isValidEmail(formData.correo)) {
      Alert.alert("Error", "Ingrese un correo electrónico válido");
      return;
    }

    if (!formData.telefono.trim()) {
      Alert.alert("Error", "El teléfono es requerido");
      return;
    }

    if (!formData.codigoOrganizacion.trim()) {
      Alert.alert("Error", "El código de organización es requerido");
      return;
    }

    if (formData.nuevaContrasena.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.nuevaContrasena !== formData.repetirContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    // TODO: Implementar registro en Firebase
    console.log("Registro empleado:", formData);
    
    // Navegar a validación de correo
    router.push({
      pathname: "/login/validar-correo-empleado",
      params: { correo: formData.correo },
    });
  };

  // Escanear código QR
  const handleScanQR = () => {
    // TODO: Implementar scanner de QR
    Alert.alert("Scanner QR", "Funcionalidad en desarrollo");
  };

  return (
    <ScrollView className="flex-1 bg-[#13678A]">
      <View className="px-8 pt-16 pb-10">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold mb-1">
            Comience el registro
          </Text>
          <Text className="text-white text-3xl font-bold">
            en su organización
          </Text>
        </View>

        {/* Formulario */}
        <View className="mb-6">
          {/* Campo: Nombre */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Nombre</Text>
            <TextInput
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData({ ...formData, nombre: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
            />
          </View>

          {/* Campo: Correo */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Correo</Text>
            <TextInput
              value={formData.correo}
              onChangeText={(text) =>
                setFormData({ ...formData, correo: text.toLowerCase() })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
            />
          </View>

          {/* Campo: Teléfono con código de área */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Teléfono</Text>
            <View className="flex-row gap-3">
              {/* Código de área */}
              <TextInput
                value={formData.codigoArea}
                onChangeText={(text) =>
                  setFormData({ ...formData, codigoArea: text })
                }
                placeholder="+1"
                placeholderTextColor="#ffffff40"
                keyboardType="phone-pad"
                maxLength={4}
                className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base w-20"
              />
              {/* Número de teléfono */}
              <TextInput
                value={formData.telefono}
                onChangeText={(text) =>
                  setFormData({ ...formData, telefono: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                keyboardType="phone-pad"
                className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
              />
            </View>
          </View>

          {/* Campo: Código de organización con botón QR */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">
              Código de organización
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                value={formData.codigoOrganizacion}
                onChangeText={(text) =>
                  setFormData({ ...formData, codigoOrganizacion: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                keyboardType="number-pad"
                maxLength={6}
                className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
              />
              {/* Botón para escanear QR */}
              <TouchableOpacity
                onPress={handleScanQR}
                className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo: Nueva contraseña */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">
              Nueva contraseña
            </Text>
            <View className="relative">
              <TextInput
                value={formData.nuevaContrasena}
                onChangeText={(text) =>
                  setFormData({ ...formData, nuevaContrasena: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showPassword}
                className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base pr-12"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#ffffff90"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo: Repetir contraseña */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">
              Repita la contraseña
            </Text>
            <View className="relative">
              <TextInput
                value={formData.repetirContrasena}
                onChangeText={(text) =>
                  setFormData({ ...formData, repetirContrasena: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showConfirmPassword}
                className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base pr-12"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-3.5"
              >
                <Ionicons
                  name={
                    showConfirmPassword ? "eye-off-outline" : "eye-outline"
                  }
                  size={22}
                  color="#ffffff90"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón continuar */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-white/90 rounded-lg py-4 items-center mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-base">
              continuar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón volver */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center py-3 mt-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff90" />
          <Text className="text-white/70 text-sm ml-2">Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
