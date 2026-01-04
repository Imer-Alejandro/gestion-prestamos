import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

/**
 * Pantalla de Login - Permite iniciar sesión con usuario/contraseña
 * o mediante proveedores externos (Google, Facebook, Otro)
 */
export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Maneja el inicio de sesión con credenciales
  const handleLogin = () => {
    // TODO: Implementar lógica de autenticación
    console.log("Login con:", formData);
  };

  // Maneja el inicio de sesión con proveedores externos
  const handleSocialLogin = (provider: string) => {
    // TODO: Implementar autenticación con proveedores
    console.log("Login con:", provider);
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-40 pb-10">
          {/* Header con título de bienvenida y K de fondo */}
          <View className="mb-16 relative pt-40">
            {/* K gigante de fondo con opacidad */}
            <Text className="absolute -top-10 -left-4 text-[#ffffff] opacity-10 text-[500px] font-bold leading-none">
              k
            </Text>
            
            {/* Textos de bienvenida */}
            <View className="relative z-10 pl-6 ">
              <Text className="text-white text-4xl font-bold mb-2">
                bienvenido
              </Text>
            <Text className="text-white/80 text-base">
              Inicie sessión y continue
            </Text>
          </View>
        </View>

        {/* Formulario de login */}
        <View className="mb-8 pt-4">
          {/* Campo de nombre de usuario */}
          <View className="mb-6">
            <Text className="text-white/70 text-sm mb-2">
              Nombre de usuario
            </Text>
            <TextInput
              value={formData.username}
              onChangeText={(text) =>
                setFormData({ ...formData, username: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3.5 text-white text-base"
              autoCapitalize="none"
            />
          </View>

          {/* Campo de contraseña con toggle de visibilidad */}
          <View className="mb-4">
            <Text className="text-white/70 text-sm mb-2">Contraseña</Text>
            <View className="relative">
              <TextInput
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showPassword}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3.5 text-white text-base pr-12"
              />
              {/* Botón para mostrar/ocultar contraseña */}
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

          {/* Checkbox para guardar inicio de sesión */}
          <TouchableOpacity
            onPress={() => setRememberSession(!rememberSession)}
            className="flex-row items-center mb-6"
          >
            <View
              className={`w-5 h-5 rounded border-2 border-white/40 mr-2.5 items-center justify-center ${
                rememberSession ? "bg-white/20" : "bg-transparent"
              }`}
            >
              {rememberSession && (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              )}
            </View>
            <Text className="text-white/70 text-sm">
              Guardar inicio de sesión
            </Text>
          </TouchableOpacity>

          {/* Botón principal de iniciar sesión */}
          <TouchableOpacity
            onPress={handleLogin}
            className="bg-white/90 rounded-lg py-4 items-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-base">
              iniciar
            </Text>
          </TouchableOpacity>

          {/* Separador "o" */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-white/20" />
            <Text className="text-white/60 text-sm mx-4">o</Text>
            <View className="flex-1 h-px bg-white/20" />
          </View>

          {/* Botones de inicio de sesión con proveedores externos */}
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              onPress={() => handleSocialLogin("Google")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-sm font-medium">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLogin("Facebook")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-sm font-medium">Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLogin("Otro")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-sm font-medium">Otro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Links de navegación en el footer */}
        <View className="flex-row justify-between mt-6 mb-8">
          <TouchableOpacity onPress={() => router.push("/login/registro")}>
            <Text className="text-white/80 text-sm underline">registrarse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login/recuperar-contrasena")}
          >
            <Text className="text-white/80 text-sm underline">
              recuperar contraseña
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
