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

interface DetallesClienteModalProps {
  visible: boolean;
  onClose: () => void;
  cliente: {
    nombre: string;
    iniciales: string;
    estado: "en-mora" | "proximo-mora" | "al-dia";
    totalDeuda: number;
    totalAbonado: number;
    totalPendiente: number;
    fechaRegistro: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    proximoPagoCuota: string;
    direccion: string;
    nota?: string;
  };
}

/**
 * Modal de Detalles del Cliente
 * Muestra información completa del cliente
 */
export default function DetallesClienteModal({
  visible,
  onClose,
  cliente,
}: DetallesClienteModalProps) {
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

  const getEstadoBadge = () => {
    switch (cliente.estado) {
      case "en-mora":
        return { bg: "bg-red-500", text: "en mora" };
      case "proximo-mora":
        return { bg: "bg-orange-500", text: "próximo a mora" };
      default:
        return { bg: "bg-green-500", text: "al día" };
    }
  };

  const badge = getEstadoBadge();

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
            className="bg-white rounded-t-3xl h-5/6 shadow-2xl"
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
                Detalles del cliente
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            <ScrollView
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar y nombre */}
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-2xl bg-blue-600 items-center justify-center mb-3">
                  <Text className="text-white text-2xl font-bold">
                    {cliente.iniciales}
                  </Text>
                </View>
                <Text className="text-gray-900 text-lg font-semibold mb-2">
                  {cliente.nombre}
                </Text>
                <View className={`${badge.bg} px-4 py-1.5 rounded-full`}>
                  <Text className="text-white text-xs font-medium">
                    Estado: {badge.text}
                  </Text>
                </View>
              </View>

              {/* Resumen financiero */}
              <View className="flex-row justify-between mb-6 pb-6 border-b border-gray-200">
                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs mb-1">
                    Total deuda
                  </Text>
                  <Text className="text-gray-900 text-base font-bold">
                    {formatCurrency(cliente.totalDeuda)}
                  </Text>
                </View>

                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs mb-1">
                    Total abonado
                  </Text>
                  <Text className="text-gray-900 text-base font-bold">
                    {formatCurrency(cliente.totalAbonado)}
                  </Text>
                </View>

                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs mb-1">
                    Total pendiente
                  </Text>
                  <Text className="text-gray-900 text-base font-bold">
                    {formatCurrency(cliente.totalPendiente)}
                  </Text>
                </View>
              </View>

              {/* Información del cliente */}
              <View className="space-y-3">
                {/* Fecha de registro */}
                <View>
                  <Text className="text-gray-900 text-sm">
                    <Text className="font-semibold">Fecha de registro: </Text>
                    <Text className="text-gray-600">{cliente.fechaRegistro}</Text>
                  </Text>
                </View>

                {/* Teléfono */}
                <View>
                  <Text className="text-gray-900 text-sm">
                    <Text className="font-semibold">Teléfono: </Text>
                    <Text className="text-gray-600">{cliente.telefono}</Text>
                  </Text>
                </View>

                {/* N. documento */}
                <View>
                  <Text className="text-gray-900 text-sm">
                    <Text className="font-semibold">N. documento: </Text>
                    <Text className="text-gray-600">
                      {cliente.tipoDocumento} - {cliente.numeroDocumento}
                    </Text>
                  </Text>
                </View>

                {/* Próximo pago de cuota */}
                <View>
                  <Text className="text-gray-900 text-sm">
                    <Text className="font-semibold">Próximo pago de cuota: </Text>
                    <Text className="text-gray-600">{cliente.proximoPagoCuota}</Text>
                  </Text>
                </View>

                {/* Dirección */}
                <View>
                  <Text className="text-gray-900 text-sm">
                    <Text className="font-semibold">Dirección: </Text>
                    <Text className="text-gray-600">{cliente.direccion}</Text>
                  </Text>
                </View>

                {/* Nota */}
                {cliente.nota && (
                  <View className="mt-2">
                    <Text className="text-gray-900 text-sm font-semibold mb-1">
                      Nota:
                    </Text>
                    <Text className="text-gray-600 text-sm leading-5">
                      {cliente.nota}
                    </Text>
                  </View>
                )}
              </View>

              {/* Espaciador */}
              <View className="h-6" />
            </ScrollView>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}
