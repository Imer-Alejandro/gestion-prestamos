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
import { Notification } from "../../data/homeData";

interface NotificationModalProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onDeleteNotification: (id: string) => void;
}

/**
 * Modal de Centro de Notificaciones
 * Muestra todas las notificaciones del usuario con opciones para eliminar
 * Con fondo blur para mejor UX y cierre con swipe hacia abajo
 */
export default function NotificationModal({
  visible,
  notifications,
  onClose,
  onDeleteNotification,
}: NotificationModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Resetear animación cuando el modal se abre
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  // PanResponder para detectar swipe hacia abajo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5; // Solo si se mueve hacia abajo
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Cerrar si se desliza más de 100px o con velocidad alta
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          // Volver a la posición original
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View 
            className="bg-white rounded-t-3xl h-4/5 shadow-2xl"
            style={{
              transform: [{ translateY }]
            }}
          >
            {/* Indicador de arrastre */}
            <View 
              {...panResponder.panHandlers}
              className="py-3 items-center"
            >
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header del modal */}
            <View className="px-6 pb-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-gray-800 text-xl font-bold">
                Centro de notificaciones
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Lista de notificaciones */}
            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
                  <Text className="text-gray-400 text-base mt-4">
                    No tienes notificaciones
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <View
                    key={notification.id}
                    className="mb-3 p-4 rounded-xl border bg-blue-50 border-blue-200"
                  >
                    <View className="flex-row items-start">
                      {/* Icono según el tipo */}
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-3`}
                        style={{ backgroundColor: notification.iconBg }}
                      >
                        <Ionicons
                          name={
                            notification.icon === "person"
                              ? "person"
                              : notification.icon === "person-add"
                              ? "person-add"
                              : "notifications"
                          }
                          size={20}
                          color="#ffffff"
                        />
                      </View>

                      {/* Contenido */}
                      <View className="flex-1">
                        <Text className="text-gray-800 text-sm font-semibold mb-1">
                          {notification.title}
                        </Text>
                        <Text className="text-gray-600 text-sm mb-2">
                          {notification.clientName}
                        </Text>
                      </View>

                      {/* Botón de eliminar */}
                      <TouchableOpacity
                        onPress={() => onDeleteNotification(notification.id)}
                        className="ml-2 w-8 h-8 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
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
