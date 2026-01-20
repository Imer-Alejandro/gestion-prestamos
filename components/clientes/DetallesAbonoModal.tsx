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

interface DetalleAbono {
  id: string;
  fechaRegistro: string;
  prestamoAbono: number;
  tipoAbono: string;
}

interface DetallesAbonoModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  totalAbonado: number;
  cantidadAbonos: number;
  detalles: DetalleAbono[];
  nota?: string;
}

/**
 * Modal de Detalles de Abono de Cuota
 * Muestra el resumen de abonos realizados a una cuota específica
 */
export default function DetallesAbonoModal({
  visible,
  onClose,
  onEdit,
  totalAbonado,
  cantidadAbonos,
  detalles,
  nota,
}: DetallesAbonoModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Resetear animación cuando el modal se abre
  useEffect(() => {
    if (visible) {
      translateY.setValue(1000);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // PanResponder para detectar swipe hacia abajo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
              transform: [{ translateY }],
            }}
          >
            {/* Indicador de arrastre */}
            <View {...panResponder.panHandlers} className="py-3 items-center">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header del modal */}
            <View className="px-6 pb-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-gray-800 text-xl font-bold">
                detalles abono de cuota
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={onEdit}
                  className="w-10 h-10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={24} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Contenido */}
            <ScrollView
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Total abonado */}
              <View className="items-center mb-6">
                <Text className="text-gray-600 text-sm mb-2">
                  Total abonado a la cuota ({cantidadAbonos})
                </Text>
                <Text className="text-blue-600 text-4xl font-bold">
                  {formatCurrency(totalAbonado)}
                </Text>
              </View>

              {/* Tabla de detalles */}
              <View className="mb-4">
                {/* Header de la tabla */}
                <View className="flex-row bg-gray-100 rounded-t-lg p-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs font-semibold">
                      fecha de registro
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs font-semibold">
                      prestamo abono
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs font-semibold">
                      tipo de abono
                    </Text>
                  </View>
                </View>

                {/* Filas de datos */}
                {detalles.map((detalle, index) => (
                  <View
                    key={detalle.id}
                    className={`flex-row p-3 border-b border-gray-200 ${
                      index === detalles.length - 1 ? "rounded-b-lg" : ""
                    }`}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                    }}
                  >
                    <View className="flex-1">
                      <Text className="text-gray-700 text-xs">
                        {detalle.fechaRegistro}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-xs font-semibold">
                        {formatCurrency(detalle.prestamoAbono)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 text-xs">
                        {detalle.tipoAbono}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Nota */}
              {nota && (
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-gray-600 text-xs font-semibold mb-2">
                    nota:
                  </Text>
                  <Text className="text-gray-700 text-sm leading-5">
                    {nota}
                  </Text>
                </View>
              )}

              {/* Espaciador */}
              <View className="h-6" />
            </ScrollView>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}
