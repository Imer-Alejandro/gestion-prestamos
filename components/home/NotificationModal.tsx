import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface NotificationModalProps {
  visible: boolean;
  notifications: any[];
  onClose: () => void;
  onDeleteNotification: (id: string) => void;
}

/**
 * Modal de Centro de Notificaciones - Rediseño Premium
 */
export default function NotificationModal({
  visible,
  notifications,
  onClose,
  onDeleteNotification,
}: NotificationModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Helper para formatear tiempo relativo de forma simple
  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return date.toLocaleDateString();
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View className="flex-1">
        <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />

          <Animated.View
            className="bg-gray-50 rounded-t-[40px] h-[85%] shadow-2xl"
            style={{ transform: [{ translateY }] }}
          >
            {/* Tirador */}
            <View {...panResponder.panHandlers} className="py-4 items-center">
              <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="px-8 pb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-900 text-2xl font-black">Notificaciones</Text>
                <Text className="text-gray-500 text-sm font-medium">
                  {notifications.length} alertas pendientes
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            <ScrollView 
              className="flex-1 px-6" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-400 text-lg font-bold">Todo al día</Text>
                  <Text className="text-gray-400 text-sm">No tienes alertas nuevas</Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <View
                    key={item.id}
                    className="mb-4 bg-white rounded-3xl overflow-hidden border border-gray-100"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center p-4">
                      {/* Barra indicadora lateral */}
                      <View 
                        className="w-1.5 h-12 rounded-full mr-4" 
                        style={{ backgroundColor: item.iconBg || '#3B82F6' }} 
                      />

                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="text-gray-900 text-[15px] font-bold flex-1 mr-2" numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                            {getTimeAgo(item.createdAt)}
                          </Text>
                        </View>
                        
                        <Text className="text-gray-500 text-[13px] leading-5" numberOfLines={2}>
                          {item.body}
                        </Text>
                      </View>

                      {/* Acción de eliminar */}
                      <TouchableOpacity
                        onPress={() => onDeleteNotification(item.id)}
                        className="ml-4 w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}
