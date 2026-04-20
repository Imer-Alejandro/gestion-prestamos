import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import EditProfileModal from "./EditProfileModal";

interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  onEditPress?: () => void;
  onNameChange?: (newName: string) => Promise<void>;
}

export default function ProfileCard({
  name,
  email,
  role,
  onNameChange,
}: ProfileCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  const handleEditPressed = () => {
    setShowEditModal(true);
  };

  const handleNameSaved = async (newName: string) => {
    if (onNameChange) {
      await onNameChange(newName);
    }
  };

  return (
    <>
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mx-4 mb-6">
        <View className="flex-row items-center justify-between mb-0">
          <View className="flex-row items-center flex-1">
            {/* Avatar */}
            <View className="w-16 h-16 bg-gradient-to-br from-[#13678A] to-[#0D4D68] rounded-full items-center justify-center mr-4">
              <Text className="text-white text-2xl font-bold">{initials}</Text>
            </View>

            {/* Información */}
            <View className="flex-1">
              <Text className="text-gray-900 text-base font-bold">{name}</Text>
              <Text className="text-gray-500 text-sm mb-1">{email}</Text>
              <View className="flex-row items-center">
                <View className="bg-blue-100 rounded-full px-3 py-1">
                  <Text className="text-blue-700 text-xs font-semibold">{role}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Botón Editar */}
          <TouchableOpacity
            onPress={handleEditPressed}
            className="bg-[#13678A] w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Edición */}
      <EditProfileModal
        visible={showEditModal}
        currentName={name}
        currentEmail={email}
        onClose={() => setShowEditModal(false)}
        onSave={handleNameSaved}
      />
    </>
  );
}
