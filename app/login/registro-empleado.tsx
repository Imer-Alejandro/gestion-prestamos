import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Pantalla de Registro de Empleado
 * Permite a un empleado unirse a una organización mediante:
 * - Nombre completo
 * - Correo electrónico
 * - Teléfono
 * - Código de organización
 * - Contraseña
 */
export default function RegistroEmpleadoScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    codigoArea: "",
    telefono: "",
    codigoOrganizacion: "",
    nuevaContrasena: "",
    repetirContrasena: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Valida el formato del correo electrónico
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Maneja el envío del formulario
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!isValidEmail(formData.correo)) {
      newErrors.correo = "Ingrese un correo electrónico válido";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    if (!formData.codigoOrganizacion.trim()) {
      newErrors.codigoOrganizacion = "El código de organización es requerido";
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

    // TODO: Implementar registro en Firebase
    console.log("Registro empleado:", formData);
    
    // Navegar a validación de correo
    router.push({
      pathname: "/login/validar-correo-empleado",
      params: { correo: formData.correo },
    });
  };

  // Escanear código QR
  const handleScanQR = () => {
    // TODO: Implementar scanner de QR
    Alert.alert("Scanner QR", "Funcionalidad en desarrollo");
  };

  return (
    <ScrollView 
      className="flex-1 bg-[#13678A]"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-8 py-10">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-bold mb-2">
            Comience el registro
          </Text>
          <Text className="text-white text-4xl font-bold">
            en su organización
          </Text>
        </View>

        {/* Formulario */}
        <View className="mb-6">
          {/* Campo: Nombre */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Nombre *</Text>
            <TextInput
              value={formData.nombre}
              onChangeText={(text) => {
                setFormData({ ...formData, nombre: text });
                if (errors.nombre) setErrors({ ...errors, nombre: "" });
              }}
              placeholder=""
              placeholderTextColor="#ffffff40"
              className={`bg-white/10 border ${errors.nombre ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base`}
            />
            {errors.nombre && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.nombre}</Text>
            )}
          </View>

          {/* Campo: Correo */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Correo *</Text>
            <TextInput
              value={formData.correo}
              onChangeText={(text) => {
                setFormData({ ...formData, correo: text.toLowerCase() });
                if (errors.correo) setErrors({ ...errors, correo: "" });
              }}
              placeholder=""
              placeholderTextColor="#ffffff40"
              keyboardType="email-address"
              autoCapitalize="none"
              className={`bg-white/10 border ${errors.correo ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base`}
            />
            {errors.correo && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.correo}</Text>
            )}
          </View>

          {/* Campo: Teléfono con código de área */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Teléfono *</Text>
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
                onChangeText={(text) => {
                  setFormData({ ...formData, telefono: text });
                  if (errors.telefono) setErrors({ ...errors, telefono: "" });
                }}
                placeholder=""
                placeholderTextColor="#ffffff40"
                keyboardType="phone-pad"
                className={`flex-1 bg-white/10 border ${errors.telefono ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base`}
              />
            </View>
            {errors.telefono && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.telefono}</Text>
            )}
          </View>

          {/* Campo: Código de organización con botón QR */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">
              Código de organización *
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                value={formData.codigoOrganizacion}
                onChangeText={(text) => {
                  setFormData({ ...formData, codigoOrganizacion: text });
                  if (errors.codigoOrganizacion) setErrors({ ...errors, codigoOrganizacion: "" });
                }}
                placeholder=""
                placeholderTextColor="#ffffff40"
                keyboardType="number-pad"
                maxLength={6}
                className={`flex-1 bg-white/10 border ${errors.codigoOrganizacion ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base`}
              />
              {/* Botón para escanear QR */}
              <TouchableOpacity
                onPress={handleScanQR}
                className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            {errors.codigoOrganizacion && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.codigoOrganizacion}</Text>
            )}
          </View>

          {/* Campo: Nueva contraseña */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">
              Nueva contraseña *
            </Text>
            <View className="relative">
              <TextInput
                value={formData.nuevaContrasena}
                onChangeText={(text) => {
                  setFormData({ ...formData, nuevaContrasena: text });
                  if (errors.nuevaContrasena) setErrors({ ...errors, nuevaContrasena: "" });
                }}
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showPassword}
                className={`bg-white/10 border ${errors.nuevaContrasena ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base pr-12`}
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
            {errors.nuevaContrasena && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.nuevaContrasena}</Text>
            )}
          </View>

          {/* Campo: Repetir contraseña */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">
              Repita la contraseña *
            </Text>
            <View className="relative">
              <TextInput
                value={formData.repetirContrasena}
                onChangeText={(text) => {
                  setFormData({ ...formData, repetirContrasena: text });
                  if (errors.repetirContrasena) setErrors({ ...errors, repetirContrasena: "" });
                }}
                placeholder=""
                placeholderTextColor="#ffffff40"
                secureTextEntry={!showConfirmPassword}
                className={`bg-white/10 border ${errors.repetirContrasena ? 'border-red-400' : 'border-white/30'} rounded-lg px-4 py-3.5 text-white text-base pr-12`}
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
            {errors.repetirContrasena && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.repetirContrasena}</Text>
            )}
          </View>

          {/* Botón continuar */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-white/90 rounded-lg py-4 items-center mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-base">
              continuar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón volver */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center py-3 mt-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff90" />
          <Text className="text-white/70 text-sm ml-2">Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
