import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Pantalla de Validación de Correo para Empleado
 * Similar a la validación de organización pero específica para empleados
 * Valida el correo mediante código OTP de 6 dígitos
 */
export default function ValidarCorreoEmpleadoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120); // 2 minutos en segundos
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Temporizador para reenviar código
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

  // Formatea el tiempo restante en MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Maneja el cambio de valor en cada input
  const handleChangeCode = (text: string, index: number) => {
    // Solo permitir números
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus al siguiente campo si hay texto
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Validar automáticamente si se completó el código
    if (index === 5 && text && newCode.every((digit) => digit !== "")) {
      Keyboard.dismiss();
      handleValidateCode(newCode.join(""));
    }
  };

  // Maneja el borrado con backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Valida el código ingresado
  const handleValidateCode = (fullCode: string) => {
    // TODO: Implementar validación con backend
    console.log("Código a validar:", fullCode);

    // Simulación de validación exitosa
    Alert.alert(
      "Código Validado",
      "Su correo ha sido verificado exitosamente. Bienvenido a la organización!",
      [
        {
          text: "Continuar",
          onPress: () => router.replace("/home"),
        },
      ]
    );
  };

  // Reenvía el código de verificación
  const handleResendCode = () => {
    if (timer > 0) {
      Alert.alert(
        "Espere",
        `Podrá reenviar el código en ${formatTime(timer)}`
      );
      return;
    }

    // TODO: Implementar reenvío de código
    console.log("Reenviando código...");
    setTimer(120);
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    Alert.alert("Código Enviado", "Se ha enviado un nuevo código a su correo");
  };

  return (
    <View className="flex-1 bg-[#13678A] px-8 pt-16 pb-10">
      {/* Botón de volver */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="mb-8"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Header */}
      <View className="mb-12">
        <Text className="text-white text-3xl font-bold mb-3">
          Validar correo
        </Text>
        <Text className="text-white/80 text-base leading-relaxed">
          Ingrese el código que enviamos{"\n"}a su correo
        </Text>
      </View>

      {/* Inputs de código OTP */}
      <View className="flex-row justify-between mb-8 px-2">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChangeCode(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            className="w-12 h-14 bg-white/10 border-2 border-white/30 rounded-lg text-white text-2xl font-bold text-center"
            style={{ fontSize: 24 }}
          />
        ))}
      </View>

      {/* Temporizador */}
      <View className="items-center mb-10">
        <Text className="text-white/60 text-sm mb-1">
          Reenviar el código en: {formatTime(timer)}
        </Text>
        <TouchableOpacity
          onPress={handleResendCode}
          disabled={timer > 0}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm underline ${
              timer > 0 ? "text-white/40" : "text-white"
            }`}
          >
            Reenviar código
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón de validar */}
      <TouchableOpacity
        onPress={() => handleValidateCode(code.join(""))}
        disabled={code.some((digit) => digit === "")}
        className={`rounded-lg py-4 items-center ${
          code.some((digit) => digit === "")
            ? "bg-white/30"
            : "bg-white/90"
        }`}
        activeOpacity={0.8}
      >
        <Text
          className={`font-semibold text-base ${
            code.some((digit) => digit === "")
              ? "text-white/50"
              : "text-[#13678A]"
          }`}
        >
          validar correo
        </Text>
      </TouchableOpacity>
    </View>
  );
}
