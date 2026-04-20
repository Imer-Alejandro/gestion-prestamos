import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

interface ClientHeaderProps {
  firstName: string;
  lastName: string;
  status: "Al día" | "En mora" | "Riesgo";
  phone?: string;
  email?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Al día":
      return { bg: "#DCFCE7", text: "#166534", icon: "checkmark-circle" };
    case "En mora":
      return { bg: "#FEE2E2", text: "#991B1B", icon: "alert-circle" };
    case "Riesgo":
      return { bg: "#FEF3C7", text: "#B45309", icon: "warning" };
    default:
      return { bg: "#F3F4F6", text: "#4B5563", icon: "help-circle" };
  }
};

export default function ClientHeader({
  firstName,
  lastName,
  status,
  phone,
  email,
}: ClientHeaderProps) {
  const statusConfig = getStatusColor(status);
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  return (
    <View className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 mx-4 mb-6 shadow-lg">
      {/* Header Row */}
      <View className="flex-row items-start justify-between mb-4">
        {/* Avatar y Datos */}
        <View className="flex-row items-center flex-1">
          <View className="w-16 h-16 bg-white/25 rounded-full items-center justify-center mr-4 border-3 border-white/40">
            <Text className="text-white text-2xl font-black">{initials}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-2">
              {firstName} {lastName}
            </Text>
            <View
              style={{ backgroundColor: statusConfig.bg }}
              className="rounded-full px-3.5 py-1.5 self-start flex-row items-center gap-1.5"
            >
              <Ionicons
                name={statusConfig.icon as any}
                size={14}
                color={statusConfig.text}
              />
              <Text
                style={{ color: statusConfig.text }}
                className="text-xs font-bold uppercase tracking-wide"
              >
                {status}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      {(phone || email) && <View className="h-px bg-white/30 mb-3" />}

      {/* Contact Info */}
      {(phone || email) && (
        <View>
          {phone && (
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center mr-2">
                <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.9)" />
              </View>
              <Text className="text-white text-sm font-medium">{phone}</Text>
            </View>
          )}
          {email && (
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center mr-2">
                <Ionicons name="mail-outline" size={14} color="rgba(255,255,255,0.9)" />
              </View>
              <Text className="text-white text-sm font-medium">{email}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
