import { Ionicons } from "@expo/vector-icons";
import CountryPicker, { CountryCode } from "react-native-country-picker-modal";
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

export default function CompletarInformacionScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🌍 País
  const [countryCode, setCountryCode] = useState<CountryCode>("DO");
  const [callingCode, setCallingCode] = useState("1");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // 🇩🇴 Código local RD
  const [rdAreaCode, setRdAreaCode] = useState("809");

  const [formData, setFormData] = useState({
    representante: "",
    direccion: "",
    correo: "",
    telefono: "",
    nuevaContrasena: "",
    repetirContrasena: "",
  });

  const isRD = countryCode === "DO";

  // ✅ Formato RD: 000-0000
  const formatPhone = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    cleaned = cleaned.substring(0, 7);

    if (cleaned.length > 3) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    }

    return cleaned;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
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

    const phoneFinal = isRD
      ? `+1${rdAreaCode}${formData.telefono.replace(/\D/g, "")}`
      : `+${callingCode}${formData.telefono.replace(/\D/g, "")}`;

    const registroCompleto = {
      full_name: formData.representante,
      email: formData.correo,
      phone: phoneFinal,
      password: formData.nuevaContrasena,
      organizacion: {
        nombre: params.nombreOrganizacion,
        eslogan: params.eslogan,
        logo: params.logo,
        tipo: params.tipoOrganizacion,
        direccion: formData.direccion,
      },
    };

    try {
      setIsLoading(true);
      await register(registroCompleto);

      Alert.alert(
        "¡Bienvenido! 🎉",
        "Tu organización ha sido registrada exitosamente"
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo completar el registro."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-8 pt-14">

          <Text className="text-white text-3xl font-bold mb-6">
            Complete la información
          </Text>

          {/* REPRESENTANTE */}
          <TextInput
            value={formData.representante}
            onChangeText={(text) =>
              setFormData({ ...formData, representante: text })
            }
            className="bg-white/10 text-white p-4 rounded-lg mb-4"
            placeholder="Representante"
            placeholderTextColor="#ccc"
          />

          {/* CORREO */}
          <TextInput
            value={formData.correo}
            onChangeText={(text) =>
              setFormData({ ...formData, correo: text })
            }
            className="bg-white/10 text-white p-4 rounded-lg mb-4"
            placeholder="Correo"
            placeholderTextColor="#ccc"
          />

        <View className="mb-5">
  <Text className="text-white/80 mb-2">Teléfono</Text>

  <View className="flex-row pl-2 items-center bg-white/10 border border-white/30 rounded-lg overflow-hidden">
 {/* 🌍 MODAL */}
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCode
            visible={showCountryPicker}
            onClose={() => setShowCountryPicker(false)}
      onSelect={(country) => {
  let code = country.callingCode[0];

  if (country.cca2 === "DO") {
    code = "1"; // solo +1
  }

  setCountryCode(country.cca2);
  setCallingCode(code);
}}
          />
    {/* País */}
    <TouchableOpacity
      onPress={() => setShowCountryPicker(true)}
      className="pr-2 py-3 border-r border-white/20"
    >
      <Text className="text-white">+{callingCode}</Text>
    </TouchableOpacity>

    {/* Número COMPLETO */}
    <TextInput
      value={formData.telefono}
      onChangeText={(text) =>
        setFormData({
          ...formData,
          telefono: text.replace(/\D/g, ""),
        })
      }
      keyboardType="phone-pad"
      placeholder="000-000-0000"
      placeholderTextColor="#ccc"
      className="flex-1 px-3 py-3 text-white"
    />
  </View>
</View>

         

          {/* PASSWORD */}
          <TextInput
            value={formData.nuevaContrasena}
            onChangeText={(text) =>
              setFormData({ ...formData, nuevaContrasena: text })
            }
            secureTextEntry={!showPassword}
            className="bg-white/10 text-white p-4 rounded-lg mb-4"
            placeholder="Contraseña"
            placeholderTextColor="#ccc"
          />

          {/* CONFIRM PASSWORD */}
          <TextInput
            value={formData.repetirContrasena}
            onChangeText={(text) =>
              setFormData({ ...formData, repetirContrasena: text })
            }
            secureTextEntry={!showConfirmPassword}
            className="bg-white/10 text-white p-4 rounded-lg mb-4"
            placeholder="Repetir contraseña"
            placeholderTextColor="#ccc"
          />

          {/* BOTÓN */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-white p-4 rounded-lg mt-4"
          >
            <Text className="text-center text-[#13678A] font-bold">
              {isLoading ? "Cargando..." : "Continuar"}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}