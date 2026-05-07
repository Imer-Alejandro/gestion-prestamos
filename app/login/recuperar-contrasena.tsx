import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

type RecoveryStep = "email" | "code" | "password" | "success";

/**
 * Pantalla de Recuperación de Contraseña
 * Flujo completo:
 * 1. Ingresa email registrado
 * 2. Verifica código enviado
 * 3. Establece nueva contraseña
 * 4. Pantalla de éxito
 */
export default function RecuperarContrasenaScreen() {
  const router = useRouter();
  const { requestPasswordReset, verifyPasswordReset } = useAuth();
  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animaciones
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Animar cambio de paso
  useEffect(() => {
    slideAnim.setValue(100);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [step]);

  // Temporizador
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Paso 1: Solicitar código
  const handleRequestCode = async () => {
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresa un correo válido");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await requestPasswordReset(email, "Usuario");
      setStep("code");
      setTimer(120);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar el código");
    } finally {
      setLoading(false);
    }
  };

  // Cambiar código
  const handleChangeCode = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    setError("");
  };

  // Paso 2: Verificar código y cambiar contraseña
  const handleResetPassword = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Ingresa los 6 dígitos del código");
      return;
    }

    if (!newPassword.trim()) {
      setError("Ingresa una nueva contraseña");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await verifyPasswordReset(email, fullCode, newPassword);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear la contraseña");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    try {
      setLoading(true);
      await requestPasswordReset(email, "Usuario");
      setTimer(120);
      setCode(["", "", "", "", "", ""]);
      setError("");
      Alert.alert("✅ Código reenviado", `Nuevo código enviado a ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reenviar");
    } finally {
      setLoading(false);
    }
  };

  const { width } = Dimensions.get("window");



  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="w-full"
          >
            <View className="mb-8">
              <Text className="text-white text-4xl font-bold mb-3">
                ¿olvidaste tu contraseña?
              </Text>
              <Text className="text-white/70 text-lg leading-6">
                Ingresa tu correo electrónico y te enviaremos un código para restablecerla
              </Text>
            </View>

            {/* Input email */}
            <View className="mb-6">
              <Text className="text-white/70 text-base mb-2 font-medium">
                Correo electrónico
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 py-4">
                <Ionicons name="mail-outline" size={22} color="#ffffff90" />
                <TextInput
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#ffffff40"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  className="flex-1 ml-3 text-white text-lg"
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl mb-6 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                <Text className="text-red-200 ml-3 flex-1 text-sm font-medium">{error}</Text>
              </View>
            )}

            {/* Botón enviar */}
            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={loading}
              className={`bg-white/90 py-4 rounded-xl items-center mb-6 shadow-sm ${loading ? "opacity-50" : "opacity-100"
                }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#13678A" />
              ) : (
                <Text className="text-[#13678A] font-bold text-lg">Enviar código</Text>
              )}
            </TouchableOpacity>

            {/* Botón volver */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="py-2 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white/60 text-base underline font-medium">
                Volver al inicio de sesión
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "code":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="w-full"
          >
            <View className="mb-8">
              <Text className="text-white text-4xl font-bold mb-3">
                verifica el código
              </Text>
              <Text className="text-white/70 text-lg leading-6">
                Ingresa los 6 dígitos que enviamos a{"\n"}
                <Text className="font-bold text-white">{email}</Text>
              </Text>
            </View>

            {/* Inputs código */}
            <View className="mb-8">
              <View className="flex-row justify-between mb-8">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    maxLength={1}
                    keyboardType="numeric"
                    value={digit}
                    onChangeText={(text) => handleChangeCode(text, index)}
                    editable={!loading}
                    className={`w-12 h-16 border-2 rounded-xl text-center text-2xl font-bold ${digit
                      ? "border-white bg-white/20 text-white"
                      : "border-white/20 bg-white/5 text-white/50"
                      }`}
                  />
                ))}
              </View>

              {/* Timer y Reenviar */}
              <View className="flex-row items-center justify-between px-2 mb-8">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={18} color="#ffffff80" />
                  <Text className="text-white/60 ml-2 font-medium">
                    {timer > 0 ? formatTime(timer) : "Expirado"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={timer > 0 || loading}
                  className={timer > 0 ? "opacity-30" : "opacity-100"}
                >
                  <Text className="text-white font-bold underline">Reenviar código</Text>
                </TouchableOpacity>
              </View>

              {/* Error */}
              {error && (
                <View className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl mb-6 flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                  <Text className="text-red-200 ml-3 flex-1 text-sm font-medium">{error}</Text>
                </View>
              )}
            </View>

            {/* Botón siguiente */}
            <TouchableOpacity
              onPress={() => setStep("password")}
              disabled={loading || code.join("").length !== 6}
              className={`bg-white/90 py-4 rounded-xl items-center mb-6 ${loading || code.join("").length !== 6 ? "opacity-50" : "opacity-100"
                }`}
              activeOpacity={0.8}
            >
              <Text className="text-[#13678A] font-bold text-lg">Continuar</Text>
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity
              onPress={() => setStep("email")}
              className="py-2 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white/60 text-base underline font-medium">
                Cambiar correo electrónico
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "password":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="w-full"
          >
            <View className="mb-8">
              <Text className="text-white text-4xl font-bold mb-3">
                nueva contraseña
              </Text>
              <Text className="text-white/70 text-lg leading-6">
                Crea una contraseña segura para proteger tu cuenta
              </Text>
            </View>

            {/* Nueva contraseña */}
            <View className="mb-6">
              <Text className="text-white/70 text-base mb-2 font-medium">
                Nueva contraseña
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 py-4">
                <Ionicons name="lock-closed-outline" size={22} color="#ffffff90" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#ffffff40"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError("");
                  }}
                  editable={!loading}
                  className="flex-1 ml-3 text-white text-lg"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#ffffff90"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar contraseña */}
            <View className="mb-8">
              <Text className="text-white/70 text-base mb-2 font-medium">
                Confirmar contraseña
              </Text>
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 py-4">
                <Ionicons name="lock-closed-outline" size={22} color="#ffffff90" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#ffffff40"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError("");
                  }}
                  editable={!loading}
                  className="flex-1 ml-3 text-white text-lg"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#ffffff90"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword !== "" && newPassword !== confirmPassword && (
                <Text className="text-red-300 text-xs mt-2 ml-1 font-medium">
                  Las contraseñas no coinciden
                </Text>
              )}
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl mb-6 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                <Text className="text-red-200 ml-3 flex-1 text-sm font-medium">{error}</Text>
              </View>
            )}

            {/* Botón resetear */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
              className={`bg-white/90 py-4 rounded-xl items-center mb-6 shadow-sm ${loading || newPassword !== confirmPassword || newPassword.length < 6
                ? "opacity-50"
                : "opacity-100"
                }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#13678A" />
              ) : (
                <Text className="text-[#13678A] font-bold text-lg">Cambiar contraseña</Text>
              )}
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity
              onPress={() => setStep("code")}
              className="py-2 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white/60 text-base underline font-medium">
                Volver al código
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "success":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="w-full items-center justify-center py-10"
          >
            <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-8 border-4 border-white/30">
              <Ionicons name="checkmark" size={60} color="#ffffff" />
            </View>

            <Text className="text-white text-4xl font-bold mb-4 text-center">
              ¡listo!
            </Text>
            <Text className="text-white/70 text-lg text-center mb-12 leading-6">
              Tu contraseña ha sido actualizada correctamente. Ya puedes acceder a tu cuenta.
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("/login")}
              className="bg-white/90 px-12 py-4 rounded-xl shadow-sm"
              activeOpacity={0.8}
            >
              <Text className="text-[#13678A] font-bold text-lg">Iniciar sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        );
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-10 relative">
          {/* K gigante de fondo con opacidad */}
          <Text className="absolute -top-10 -left-4 text-[#ffffff] opacity-10 text-[400px] font-bold leading-none">
            k
          </Text>

          {/* Header con indicador de pasos */}
          <View className="relative z-10 pt-10">
            {renderStep()}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
