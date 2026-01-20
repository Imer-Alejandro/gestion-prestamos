import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { validateCredentials } from "../../data/authData";

/**
 * Pantalla de Login - Permite iniciar sesión con usuario/contraseña
 * o mediante proveedores externos (Google, Facebook, Otro)
 */
export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Maneja el inicio de sesión con credenciales
  const handleLogin = () => {
    // Validaciones básicas
    if (!formData.username.trim()) {
      Alert.alert("Error", "Por favor ingrese su nombre de usuario");
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert("Error", "Por favor ingrese su contraseña");
      return;
    }

    setIsLoading(true);

    // Simular delay de red
    setTimeout(() => {
      const user = validateCredentials(formData.username, formData.password);

      if (user) {
        // Login exitoso
        console.log("Usuario autenticado:", user);
        
        // Si se marcó "Guardar inicio de sesión"
        if (rememberSession) {
          // TODO: Guardar sesión en AsyncStorage
          console.log("Sesión guardada");
        }

        // Navegar al home
        router.replace("/home");
      } else {
        // Credenciales incorrectas
        Alert.alert(
          "Error de autenticación",
          "Usuario o contraseña incorrectos. Intente nuevamente."
        );
      }

      setIsLoading(false);
    }, 800);
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
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

        {/* Información de credenciales de prueba 
        <View className="mb-6 bg-white/10 rounded-lg p-4 border border-white/20">
          <Text className="text-white/90 text-xs font-semibold mb-2">
            💡 Credenciales de prueba:
          </Text>
          <Text className="text-white/70 text-xs mb-1">
            Usuario: <Text className="text-white font-medium">admin</Text>
          </Text>
          <Text className="text-white/70 text-xs">
            Contraseña: <Text className="text-white font-medium">admin123</Text>
          </Text>
        </View>*/}

        {/* Formulario de login */}
        <View className="mb-6">
          {/* Campo de nombre de usuario */}
          <View className="mb-6">
            <Text className="text-white/70 text-base mb-2">
              Nombre de usuario
            </Text>
            <TextInput
              value={formData.username}
              onChangeText={(text) =>
                setFormData({ ...formData, username: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-4 text-white text-lg"
              autoCapitalize="none"
            />
          </View>

          {/* Campo de contraseña con toggle de visibilidad */}
          <View className="mb-5">
            <Text className="text-white/70 text-base mb-2">Contraseña</Text>
            <View className="relative">
              <TextInput
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showPassword}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-4 text-white text-lg pr-12"
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
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
              className={`w-5 h-5 rounded border-2 border-white/40 mr-2.5 items-center justify-center ${
                rememberSession ? "bg-white/20" : "bg-transparent"
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
            className={`bg-white/90 rounded-lg py-4 items-center mb-5 ${
              isLoading ? "opacity-50" : "opacity-100"
            }`}
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-lg">
              {isLoading ? "iniciando..." : "iniciar"}
            </Text>
          </TouchableOpacity>

          {/* Separador "o" */}
          <View className="flex-row items-center mb-5">
            <View className="flex-1 h-px bg-white/20" />
            <Text className="text-white/60 text-base mx-4">o</Text>
            <View className="flex-1 h-px bg-white/20" />
          </View>

          {/* Botones de inicio de sesión con proveedores externos */}
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              onPress={() => handleSocialLogin("Google")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3.5 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-base font-medium">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLogin("Facebook")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3.5 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-base font-medium">Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLogin("Otro")}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3.5 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-base font-medium">Otro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Links de navegación en el footer */}
        <View className="flex-row justify-between mt-8 mb-6">
          <TouchableOpacity onPress={() => router.push("/login/registro")}>
            <Text className="text-white/80 text-base underline">registrarse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login/recuperar-contrasena")}
          >
            <Text className="text-white/80 text-base underline">
              recuperar contraseña
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
