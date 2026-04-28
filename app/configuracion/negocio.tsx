import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { updateOrganization } from "../../services/user.service";

export default function ConfigNegocioScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    slogan: "",
    logo_path: "",
    address: "",
    phone: "",
    email: "",
    rnc: "",
    currency: "DOP",
  });

  useEffect(() => {
    if (user?.organization) {
      setFormData({
        name: user.organization.name || "",
        type: user.organization.type || "",
        slogan: user.organization.slogan || "",
        logo_path: user.organization.logo_path || "",
        address: user.organization.address || "",
        phone: user.organization.phone || "",
        email: user.organization.email || "",
        rnc: user.organization.rnc || "",
        currency: user.organization.currency || "DOP",
      });
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFormData({ ...formData, logo_path: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Campo requerido", "El nombre del negocio es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      if (user?.id) {
        await updateOrganization(user.id, formData);
        await refreshUser(); // Actualizar el contexto de auth con los nuevos datos
        Alert.alert("✅ Éxito", "La información del negocio ha sido actualizada.");
        router.back();
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      Alert.alert("❌ Error", "No se pudo actualizar la información.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View className="bg-[#13678A] px-6 pt-16 pb-8 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Configuración de Negocio</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Logo Selector Section */}
        <View className="items-center mb-8">
          <TouchableOpacity 
            onPress={pickImage}
            className="relative"
            activeOpacity={0.8}
          >
            <View className="w-32 h-32 rounded-full bg-white shadow-md items-center justify-center border-4 border-white overflow-hidden">
              {formData.logo_path ? (
                <Image 
                  source={{ uri: formData.logo_path }} 
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="business" size={50} color="#13678A" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-[#13678A] w-10 h-10 rounded-full border-4 border-gray-50 items-center justify-center">
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-gray-500 mt-3 text-sm font-medium">Logo del Negocio</Text>
        </View>

        {/* Formulario */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-6 flex-row items-center">
            Información General
          </Text>

          <View className="mb-5">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Nombre del Negocio *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ej. Inversiones Kanni"
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Slogan</Text>
            <TextInput
              value={formData.slogan}
              onChangeText={(text) => setFormData({ ...formData, slogan: text })}
              placeholder="Ej. Tu socio financiero"
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
            />
          </View>

          <View className="mb-2">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">RNC (Opcional)</Text>
            <TextInput
              value={formData.rnc}
              onChangeText={(text) => setFormData({ ...formData, rnc: text })}
              placeholder="000-00000-0"
              keyboardType="numeric"
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
            />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
          <Text className="text-gray-800 font-bold text-lg mb-6">Contacto y Ubicación</Text>

          <View className="mb-5">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Dirección</Text>
            <TextInput
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Calle, Ciudad, País"
              multiline
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Teléfono</Text>
            <TextInput
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="809-000-0000"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
            />
          </View>

          <View className="mb-2">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Correo Electrónico</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="contacto@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-800 text-base"
            />
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-[#13678A] rounded-2xl py-4 items-center justify-center shadow-md mb-4"
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Guardar Cambios</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={saving}
          className="bg-white border border-gray-200 rounded-2xl py-4 items-center justify-center"
        >
          <Text className="text-gray-500 font-semibold text-base">Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
