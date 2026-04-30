import { Ionicons } from "@expo/vector-icons";
import CountryPicker, { CountryCode } from "react-native-country-picker-modal";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


export default function CompletarInformacionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    rnc: "",
    nuevaContrasena: "",
    repetirContrasena: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const newErrors: Record<string, string> = {};

    if (!formData.representante.trim()) {
      newErrors.representante = "El nombre del representante es requerido";
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo electrónico es requerido";
    } else if (!isValidEmail(formData.correo)) {
      newErrors.correo = "Ingrese un correo electrónico válido";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    if (formData.nuevaContrasena.length < 6) {
      newErrors.nuevaContrasena = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.repetirContrasena) {
      newErrors.repetirContrasena = "Debe confirmar su contraseña";
    } else if (formData.nuevaContrasena !== formData.repetirContrasena) {
      newErrors.repetirContrasena = "Las contraseñas no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const phoneFinal = isRD
      ? `+1${rdAreaCode}${formData.telefono.replace(/\D/g, "")}`
      : `+${callingCode}${formData.telefono.replace(/\D/g, "")}`;

    const registroParaPlan = {
      full_name: formData.representante,
      email: formData.correo,
      phone: phoneFinal,
      password: formData.nuevaContrasena,
      org_nombre: params.nombreOrganizacion,
      org_eslogan: params.eslogan,
      org_logo: params.logo,
      org_tipo: params.tipoOrganizacion,
      org_direccion: formData.direccion,
      org_rnc: formData.rnc,
    };

    router.push({
      pathname: "/login/seleccion-plan",
      params: registroParaPlan,
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-8 pt-14">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center self-start mb-6"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
            <Text className="text-white text-base ml-2 font-medium">Volver</Text>
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold mb-6">
            Complete la información
          </Text>

          {/* REPRESENTANTE */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">Representante *</Text>
            <TextInput
              value={formData.representante}
              onChangeText={(text) => {
                setFormData({ ...formData, representante: text });
                if (errors.representante) setErrors({ ...errors, representante: "" });
              }}
              className={`bg-white/10 border ${errors.representante ? 'border-red-400' : 'border-white/20'} text-white p-4 rounded-lg`}
              placeholder="Nombre completo"
              placeholderTextColor="#ccc"
            />
            {errors.representante && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.representante}</Text>
            )}
          </View>

          {/* CORREO */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">Correo electrónico *</Text>
            <TextInput
              value={formData.correo}
              onChangeText={(text) => {
                setFormData({ ...formData, correo: text });
                if (errors.correo) setErrors({ ...errors, correo: "" });
              }}
              className={`bg-white/10 border ${errors.correo ? 'border-red-400' : 'border-white/20'} text-white p-4 rounded-lg`}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.correo && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.correo}</Text>
            )}
          </View>

          {/* RNC */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">RNC (Opcional)</Text>
            <TextInput
              value={formData.rnc}
              onChangeText={(text) => setFormData({ ...formData, rnc: text })}
              className="bg-white/10 border border-white/20 text-white p-4 rounded-lg"
              placeholder="000-00000-0"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
            />
          </View>

        <View className="mb-5">
  <Text className="text-white/80 mb-2">Teléfono *</Text>

  <View className={`flex-row pl-2 items-center bg-white/10 border ${errors.telefono ? 'border-red-400' : 'border-white/30'} rounded-lg overflow-hidden`}>
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
  {errors.telefono && (
    <Text className="text-red-300 text-xs mt-1 ml-1">{errors.telefono}</Text>
  )}
</View>

         

          {/* PASSWORD */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">Contraseña *</Text>
            <View className="relative">
              <TextInput
                value={formData.nuevaContrasena}
                onChangeText={(text) => {
                  setFormData({ ...formData, nuevaContrasena: text });
                  if (errors.nuevaContrasena) setErrors({ ...errors, nuevaContrasena: "" });
                }}
                secureTextEntry={!showPassword}
                className={`bg-white/10 border ${errors.nuevaContrasena ? 'border-red-400' : 'border-white/20'} text-white p-4 rounded-lg pr-12`}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
            {errors.nuevaContrasena && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.nuevaContrasena}</Text>
            )}
          </View>

          {/* CONFIRM PASSWORD */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">Confirmar contraseña *</Text>
            <View className="relative">
              <TextInput
                value={formData.repetirContrasena}
                onChangeText={(text) => {
                  setFormData({ ...formData, repetirContrasena: text });
                  if (errors.repetirContrasena) setErrors({ ...errors, repetirContrasena: "" });
                }}
                secureTextEntry={!showConfirmPassword}
                className={`bg-white/10 border ${errors.repetirContrasena ? 'border-red-400' : 'border-white/20'} text-white p-4 rounded-lg pr-12`}
                placeholder="Repita su contraseña"
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
            {errors.repetirContrasena && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.repetirContrasena}</Text>
            )}
          </View>

          {/* BOTÓN */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-white p-4 rounded-lg mt-4"
          >
            <Text className="text-center text-[#13678A] font-bold">
              Continuar
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}