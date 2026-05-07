import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

interface ValidarCorreoComponentProps {
  email: string;
  userId: number;
  fullName: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * Componente de Validación de Correo Electrónico
 * Interfaz bonita para ingresar código de 6 dígitos
 * Características:
 * - Animación de entrada suave
 * - Inputs de código individuales
 * - Temporizador para reenvío
 * - Indicadores visuales
 * - Intentos limitados
 */
export default function ValidarCorreoComponent({
  email,
  userId,
  fullName,
  onSuccess,
  onCancel,
}: ValidarCorreoComponentProps) {
  const { verifyEmail, requestEmailVerification } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120); // 2 minutos
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Temporizador de reenvío
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Formatear tiempo MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Manejar cambio de código
  const handleChangeCode = (text: string, index: number) => {
    // Solo permitir números
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Mover al siguiente input si ingresa un número
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Limpiar error
    setError("");
  };

  // Manejar borrado hacia atrás
  const handleKeyPress = (index: number, nativeEvent: any) => {
    if (nativeEvent.key === "Backspace") {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Enviar código
  const handleSendCode = async () => {
    try {
      setSending(true);
      setError("");
      await requestEmailVerification(userId, email);
      setTimer(120);
      setCode(["", "", "", "", "", ""]);
      Alert.alert("✅ Código reenviado", `Se envió un nuevo código a ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el código");
    } finally {
      setSending(false);
    }
  };

  // Verificar código completo
  const handleVerifyCode = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Ingresa los 6 dígitos del código");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await verifyEmail(userId, email, fullCode);
      Alert.alert("✅ Correo validado", "Tu correo ha sido verificado correctamente");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
      // Limpiar los inputs en caso de error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#13678A" }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
          }}
          className="bg-gradient-to-b from-[#13678A] to-white"
        >
          <View className="flex-1 px-6 py-16 justify-between">
        {/* Header */}
        <View>
          <View className="mb-8">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mx-auto mb-6">
              <Ionicons name="mail-outline" size={32} color="#13678A" />
            </View>

            <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
              Valida tu correo
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Ingresa el código de 6 dígitos que enviamos a
            </Text>
            <Text className="text-center font-semibold text-gray-800 mt-2">
              {email}
            </Text>
          </View>

          {/* Inputs de código */}
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
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent)}
                  editable={!loading && !sending}
                  className={`w-12 h-16 border-2 rounded-xl text-center text-xl font-bold ${
                    digit
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-gray-50"
                  } ${error ? "border-red-500 bg-red-50" : ""}`}
                  placeholderTextColor="#D1D5DB"
                />
              ))}
            </View>

            {/* Error message */}
            {error && (
              <View className="flex-row items-center bg-red-50 p-3 rounded-lg mb-4">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-red-600 ml-2 flex-1 text-sm">{error}</Text>
              </View>
            )}
          </View>

          {/* Botón verificar */}
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={loading || sending || code.join("").length !== 6}
            className={`py-4 rounded-xl items-center justify-center mb-4 ${
              loading || sending || code.join("").length !== 6
                ? "bg-gray-300"
                : "bg-blue-600"
            }`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Verificar código
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer - Reenvío y cancelar */}
        <View className="space-y-3">
          {/* Temporizador */}
          <View className="bg-blue-50 p-4 rounded-xl mb-4">
            <Text className="text-gray-600 text-center text-sm mb-1">
              ¿No recibiste el código?
            </Text>
            <Text className="text-center font-semibold text-gray-800">
              {timer > 0 ? (
                <>
                  Reenviar en <Text className="text-blue-600">{formatTime(timer)}</Text>
                </>
              ) : (
                "Ya puedes pedir un nuevo código"
              )}
            </Text>
          </View>

          {/* Botón reenviar */}
          <TouchableOpacity
            onPress={handleSendCode}
            disabled={timer > 0 || sending}
            className={`py-3 rounded-xl border-2 items-center ${
              timer > 0 || sending
                ? "border-gray-300 bg-gray-50"
                : "border-blue-600 bg-white"
            }`}
            activeOpacity={0.7}
          >
            {sending ? (
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

          {/* Botón cancelar */}
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading || sending}
              className="py-3 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-gray-600 font-medium">Cancelar</Text>
            </TouchableOpacity>
          )}

          {/* Nota de seguridad */}
          <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-gray-200">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text className="text-gray-500 text-xs ml-2">
              Tu información está protegida
            </Text>
          </View>
        </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
