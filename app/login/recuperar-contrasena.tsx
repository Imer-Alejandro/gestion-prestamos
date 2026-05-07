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

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="flex-1"
          >
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              ¿Olvidaste tu contraseña?
            </Text>
            <Text className="text-gray-600 text-base mb-8">
              Ingresa tu correo electrónico y te enviaremos un código para resetearla
            </Text>

            {/* Input email */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </Text>
              <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="tu@correo.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                  }}
                  keyboardType="email-address"
                  editable={!loading}
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-50 p-3 rounded-lg mb-6 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-red-600 ml-2 flex-1 text-sm">{error}</Text>
              </View>
            )}

            {/* Botón enviar */}
            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={loading}
              className="bg-blue-600 py-4 rounded-xl items-center mb-4"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Enviar código</Text>
              )}
            </TouchableOpacity>

            {/* Botón volver */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="py-3 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-back" size={18} color="#6B7280" />
                <Text className="text-gray-600 ml-2 font-medium">Volver</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );

      case "code":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="flex-1"
          >
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Verifica el código
            </Text>
            <Text className="text-gray-600 text-base mb-8">
              Ingresa los 6 dígitos que enviamos a{"\n"}
              <Text className="font-semibold text-gray-800">{email}</Text>
            </Text>

            {/* Inputs código */}
            <View className="mb-8">
              <View className="flex-row justify-between mb-6">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    maxLength={1}
                    keyboardType="numeric"
                    value={digit}
                    onChangeText={(text) => handleChangeCode(text, index)}
                    editable={!loading}
                    className={`w-12 h-16 border-2 rounded-xl text-center text-xl font-bold ${
                      digit
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  />
                ))}
              </View>

              {/* Timer */}
              <View className="bg-blue-50 p-4 rounded-xl mb-6">
                <Text className="text-gray-600 text-center text-sm">
                  {timer > 0 ? (
                    <>
                      Código expira en:{" "}
                      <Text className="font-bold text-blue-600">{formatTime(timer)}</Text>
                    </>
                  ) : (
                    "El código ha expirado"
                  )}
                </Text>
              </View>

              {/* Error */}
              {error && (
                <View className="bg-red-50 p-3 rounded-lg mb-6 flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text className="text-red-600 ml-2 flex-1 text-sm">{error}</Text>
                </View>
              )}
            </View>

            {/* Botón siguiente */}
            <TouchableOpacity
              onPress={() => setStep("password")}
              disabled={loading || code.join("").length !== 6}
              className={`py-4 rounded-xl items-center mb-4 ${
                loading || code.join("").length !== 6
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">Continuar</Text>
            </TouchableOpacity>

            {/* Reenviar */}
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={timer > 0 || loading}
              className={`py-3 rounded-xl border-2 items-center ${
                timer > 0 ? "border-gray-300" : "border-blue-600"
              }`}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#13678A" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons
                    name="refresh"
                    size={18}
                    color={timer > 0 ? "#D1D5DB" : "#13678A"}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      timer > 0 ? "text-gray-400" : "text-blue-600"
                    }`}
                  >
                    Reenviar código
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );

      case "password":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="flex-1"
          >
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Nueva contraseña
            </Text>
            <Text className="text-gray-600 text-base mb-8">
              Crea una contraseña fuerte para tu cuenta
            </Text>

            {/* Nueva contraseña */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Nueva contraseña
              </Text>
              <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="••••••"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError("");
                  }}
                  editable={!loading}
                  className="flex-1 ml-3 text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {newPassword && newPassword.length < 6 && (
                <Text className="text-xs text-orange-600 mt-2">
                  Mínimo 6 caracteres
                </Text>
              )}
            </View>

            {/* Confirmar contraseña */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Confirmar contraseña
              </Text>
              <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="••••••"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError("");
                  }}
                  editable={!loading}
                  className="flex-1 ml-3 text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && newPassword !== confirmPassword && (
                <Text className="text-xs text-red-600 mt-2">
                  Las contraseñas no coinciden
                </Text>
              )}
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-50 p-3 rounded-lg mb-6 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-red-600 ml-2 flex-1 text-sm">{error}</Text>
              </View>
            )}

            {/* Nota de seguridad */}
            <View className="bg-green-50 p-4 rounded-xl mb-8 flex-row items-start">
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text className="text-green-700 text-sm ml-3 flex-1">
                Usa mayúsculas, minúsculas y números para mayor seguridad
              </Text>
            </View>

            {/* Botón resetear */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
              className={`py-4 rounded-xl items-center mb-4 ${
                loading || newPassword !== confirmPassword || newPassword.length < 6
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Resetear contraseña
                </Text>
              )}
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity
              onPress={() => setStep("code")}
              disabled={loading}
              className="py-3 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-back" size={18} color="#6B7280" />
                <Text className="text-gray-600 ml-2 font-medium">Volver</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );

      case "success":
        return (
          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="flex-1 items-center justify-center"
          >
            <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-8">
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>

            <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
              ¡Contraseña actualizada!
            </Text>
            <Text className="text-gray-600 text-base text-center mb-12">
              Tu contraseña ha sido resetada correctamente. Ya puedes iniciar sesión con tu
              nueva contraseña.
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("/login")}
              className="bg-blue-600 px-12 py-4 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">
                Ir al login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={step === "email"}
        className="flex-1 px-6 py-10"
      >
        {renderStep()}
      </ScrollView>
    </View>
  );
}
