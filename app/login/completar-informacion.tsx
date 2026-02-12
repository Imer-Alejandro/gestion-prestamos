import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Pantalla de Completar Información - Paso 2
 * Formulario final para completar el registro de la organización
 */
export default function CompletarInformacionScreen() {
  const router = useRouter();
  const { register } = useAuth();
  // Recibe los datos del paso anterior
  const params = useLocalSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    representante: "",
    direccion: "",
    correo: "",
    codigoArea: "+1",
    telefono: "",
    nuevaContrasena: "",
    repetirContrasena: "",
  });

  // Valida el formato del correo electrónico
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Maneja el envío del formulario completo
  const handleSubmit = async () => {
    // Validaciones
    if (!formData.representante.trim()) {
      Alert.alert("Error", "El nombre del representante es requerido");
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

    if (formData.nuevaContrasena.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.nuevaContrasena !== formData.repetirContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    // Combinar todos los datos del registro
    const registroCompleto = {
      full_name: formData.representante,
      email: formData.correo,
      phone: formData.codigoArea + formData.telefono,
      password: formData.nuevaContrasena,
      // Datos adicionales de la organización (pueden guardarse después)
      organizacion: {
        nombre: params.nombreOrganizacion,
        eslogan: params.eslogan,
        logo: params.logo,
        tipo: params.tipoOrganizacion,
        direccion: formData.direccion,
      }
    };

    try {
      setIsLoading(true);
      
      // Registrar el usuario en la base de datos
      await register(registroCompleto);
      
      // El AuthContext redirigirá automáticamente a /home
      Alert.alert(
        "¡Bienvenido! 🎉",
        "Tu organización ha sido registrada exitosamente",
        [
          {
            text: "Continuar",
            onPress: () => {
              // La navegación se maneja automáticamente por AuthContext
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Error en registro:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudo completar el registro. Intente nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View className="px-8 py-10">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-bold mb-2">
            Complete la información
          </Text>
          <Text className="text-white text-4xl font-bold">
            de su organización
          </Text>
        </View>

        {/* Formulario */}
        <View className="mb-6">
          {/* Campo: Representante */}
          <View className="mb-5">
            <Text className="text-white/80 text-base mb-2">Representante</Text>
            <TextInput
              value={formData.representante}
              onChangeText={(text) =>
                setFormData({ ...formData, representante: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-4 text-white text-lg"
            />
          </View>

          {/* Campo: Dirección */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Dirección</Text>
            <TextInput
              value={formData.direccion}
              onChangeText={(text) =>
                setFormData({ ...formData, direccion: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
              multiline
              numberOfLines={2}
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

          {/* Campo: Nueva contraseña */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Nueva contraseña</Text>
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
            disabled={isLoading}
            className={`bg-white/90 rounded-lg py-4 items-center mt-4 ${
              isLoading ? "opacity-50" : ""
            }`}
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-lg">
              {isLoading ? "Registrando..." : "continuar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón volver */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center py-3 mt-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff90" />
          <Text className="text-white/70 text-base ml-2">Volver</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
