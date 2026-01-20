import { Ionicons } from "@expo/vector-icons";

import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface AppHeaderProps {
  userData: {
    name: string;
    role: string;
  };
  onNotificationsPress: () => void;
  onMenuPress: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  hasNotifications?: boolean;
}

/**
 * Header compartido para todas las pantallas principales
 * Incluye perfil, notificaciones, menú y buscador
 */
export default function AppHeader({
  userData,
  onNotificationsPress,
  onMenuPress,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  hasNotifications = true,
}: AppHeaderProps) {
  return (
    <View className="bg-[#13678A] px-6 pt-16 pb-6 rounded-b-3xl shadow-lg">
      <View className="flex-row items-center justify-between mb-6">
        {/* Perfil de usuario */}
        <View className="flex-row items-center">
          {/* Avatar con iniciales */}
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center border-2 border-white/30 mr-3">
            <Text className="text-white text-lg font-bold">
              {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
          {/* Nombre y rol */}
          <View>
            <Text className="text-white text-base font-semibold">
              Hola, {userData.name}
            </Text>
            <Text className="text-white/70 text-xs">
              {userData.role}
            </Text>
          </View>
        </View>

        {/* Iconos de notificación y menú */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onNotificationsPress}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#ffffff" />
            {/* Badge de notificaciones */}
            {hasNotifications && (
              <View className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-[#13678A]" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onMenuPress}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Buscador */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1 bg-white/95 rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Buscar clientes..."
            placeholderTextColor="#999"
            className="flex-1 ml-2 text-gray-800 text-sm"
            onSubmitEditing={onSearchSubmit}
          />
        </View>
        <TouchableOpacity
          onPress={onSearchSubmit}
          className="bg-[#0D4D68] rounded-xl px-5 py-3.5"
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
