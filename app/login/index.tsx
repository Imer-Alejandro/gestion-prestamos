import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
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
import { getDb } from "../../database/db";

/**
 * Pantalla de Login - Permite iniciar sesión con contraseña
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Maneja el inicio de sesión con email y contraseña
  const handleLogin = async () => {
    // Validaciones básicas
    if (!formData.email.trim()) {
      Alert.alert("Error", "Por favor ingrese su correo electrónico");
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert("Error", "Por favor ingrese su contraseña");
      return;
    }

    try {
      await login(formData.email, formData.password);
      // El AuthContext redirigirá automáticamente a /home
    } catch (error: any) {
      Alert.alert(
        "Error de autenticación",
        error.message || "Email o contraseña incorrectos. Intente nuevamente.",
      );
    }
  };

  /* Maneja el inicio de sesión con proveedores externos
  const handleSocialLogin = (provider: string) => {
    // TODO: Implementar autenticación con proveedores
    Alert.alert(
      "Próximamente",
      `Login con ${provider} estará disponible pronto`,
    );
  };*/

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-10">
          {/* Header con título de bienvenida y K de fondo */}
          <View className="mb-10 relative">
            {/* K gigante de fondo con opacidad */}
            <Text className="absolute -top-10 -left-4 text-[#ffffff] opacity-10 text-[400px] font-bold leading-none">
              k
            </Text>

            {/* Textos de bienvenida */}
            <View className="relative z-10 pl-6 pt-24">
              <Text className="text-white text-5xl font-bold mb-3">
                bienvenido
              </Text>
              <Text className="text-white/80 text-lg">
                Inicie sesión y continúe
              </Text>
            </View>
          </View>

          {/* Formulario de login */}
          <View className="mb-6">
            {/* Campo de correo electrónico - Solución iOS: TextInput invisible + Text visible */}
            <View className="mb-5">
              <Text className="text-white/70 text-base mb-2">
                Correo electrónico
              </Text>

              <TextInput
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#ffffff40"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="bg-white/10 border border-white/20 rounded-lg px-4 text-white text-lg"
                style={{ height: 56 }}
              />
            </View>

            <View className="mb-5">
              <Text className="text-white/70 text-base mb-2">
                Contraseña
              </Text>

              <View className="relative">
                <TextInput
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  placeholder="Ingrese su contraseña"
                  placeholderTextColor="#ffffff40"
                  secureTextEntry={!showPassword}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 text-white text-lg pr-12"
                  style={{ height: 56 }}
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4"
                  style={{ top: 16 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#ffffff90"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox para guardar inicio de sesión */}
            <TouchableOpacity
              onPress={() => setRememberSession(!rememberSession)}
              className="flex-row items-center mb-8"
            >
              <View
                className={`w-5 h-5 rounded border-2 border-white/40 mr-2.5 items-center justify-center ${rememberSession ? "bg-white/20" : "bg-transparent"
                  }`}
              >
                {rememberSession && (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                )}
              </View>
              <Text className="text-white/70 text-base">
                Guardar inicio de sesión
              </Text>
            </TouchableOpacity>

            {/* Botón principal de iniciar sesión */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-white/90 rounded-lg py-4 items-center mb-5 ${isLoading ? "opacity-50" : "opacity-100"
                }`}
              activeOpacity={0.8}
            >
              <Text className="text-[#13678A] font-semibold text-lg">
                {isLoading ? "iniciando..." : "iniciar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Links de navegación en el footer */}
          <View className="flex-col gap-y-4 mt-8 mb-6">
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => router.push("/login/registro-organizacion")}>
                <Text className="text-white/80 text-base underline">
                  registrar empresa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/login/recuperar-contrasena")}
              >
                <Text className="text-white/80 text-base underline">
                  recuperar contraseña
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => router.push("/login/join-org")}
              className="bg-white/10 border border-white/30 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-medium text-base">
                unirse a una organización
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
