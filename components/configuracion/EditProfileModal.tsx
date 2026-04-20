import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface EditProfileModalProps {
  visible: boolean;
  currentName: string;
  currentEmail: string;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

export default function EditProfileModal({
  visible,
  currentName,
  currentEmail,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    if (name === currentName) {
      Alert.alert("Aviso", "No hay cambios que guardar");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(name.trim());
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      onClose();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el perfil");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(currentName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50 justify-end"
      >
        {/* Overlay para cerrar */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          className="flex-1"
        />

        {/* Modal Bottom Sheet */}
        <View className="bg-white rounded-t-3xl px-6 pb-8 pt-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-900">
              Editar Perfil
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Nombre */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#999"
              editable={!isLoading}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              maxLength={50}
            />
            <Text className="text-gray-400 text-xs mt-2">
              {name.length}/50 caracteres
            </Text>
          </View>

          {/* Email (Solo lectura) */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Email</Text>
            <TextInput
              value={currentEmail}
              placeholder="Email"
              placeholderTextColor="#999"
              editable={false}
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-600"
            />
            <Text className="text-gray-400 text-xs mt-2">No se puede cambiar</Text>
          </View>

          {/* Botones */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="flex-1 bg-[#13678A] rounded-xl py-3.5 items-center justify-center flex-row gap-2"
              activeOpacity={0.8}
            >
              {isLoading && (
                <ActivityIndicator size="small" color="#ffffff" />
              )}
              <Text className="text-white font-semibold text-base">
                {isLoading ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
