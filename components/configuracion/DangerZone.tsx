import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface DangerZoneProps {
  onChangePassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function DangerZone({
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: DangerZoneProps) {
  return (
    <View className="mb-8">
      <Text className="text-gray-600 text-sm font-semibold px-4 mb-3 uppercase tracking-wider">
        Seguridad
      </Text>
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mx-4">
        {/* Cambiar contraseña */}
        <TouchableOpacity
          onPress={onChangePassword}
          activeOpacity={0.6}
          className="flex-row items-center px-6 py-4"
        >
          <View className="w-10 h-10 bg-yellow-50 rounded-xl items-center justify-center mr-4">
            <Ionicons name="key" size={22} color="#EAB308" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-base font-semibold">
              Cambiar contraseña
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Actualiza tu contraseña regularmente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
        </TouchableOpacity>

        <View className="h-px bg-gray-100 ml-16" />

        {/* Cerrar sesión */}
        <TouchableOpacity
          onPress={onLogout}
          activeOpacity={0.6}
          className="flex-row items-center px-6 py-4"
        >
          <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center mr-4">
            <Ionicons name="log-out-outline" size={22} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-base font-semibold">
              Cerrar sesión
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Salir de tu cuenta
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
        </TouchableOpacity>

        <View className="h-px bg-gray-100 ml-16" />

        {/* Eliminar cuenta */}
        <TouchableOpacity
          onPress={onDeleteAccount}
          activeOpacity={0.6}
          className="flex-row items-center px-6 py-4"
        >
          <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-4">
            <Ionicons name="trash" size={22} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-red-600 text-base font-semibold">
              Eliminar cuenta
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Acción irreversible
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
