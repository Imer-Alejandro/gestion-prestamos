import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getLoansByClient } from "../../services/loan.service";

interface ClientDetailsModalProps {
  visible: boolean;
  client: any | null;
  onClose: () => void;
}

export default function ClientDetailsModal({
  visible,
  client,
  onClose,
}: ClientDetailsModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      if (client?.id) {
        // Fetch active loans when modal opens
        getLoansByClient(client.id)
          .then((data) => {
            setLoans(data);
          })
          .catch((err) => {
            console.error("Error fetching client loans:", err);
            setLoans([]);
          });
      }
    } else {
      setLoans([]);
    }
  }, [visible, client?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
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
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Render method returns null if no client is selected
  if (!client && !visible) return null;

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
            style={{ transform: [{ translateY }] }}
          >
            {/* Indicador de arrastre */}
            <View {...panResponder.panHandlers} className="py-3 items-center">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header del modal */}
            <View className="px-6 pb-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-gray-800 text-xl font-bold">
                Detalle del Cliente
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Contenido (si hay cliente seleccionado) */}
            {client && (
              <ScrollView
                className="flex-1 px-6 py-4"
                showsVerticalScrollIndicator={false}
              >
                {/* Perfil Header */}
                <View className="flex-row items-center mb-6 bg-gray-50 p-4 rounded-2xl">
                  <View className="w-16 h-16 bg-[#13678A]/10 rounded-full items-center justify-center mr-4">
                    <Text className="text-[#13678A] font-bold text-xl">
                      {client.first_name?.[0] || ""}
                      {client.last_name?.[0] || ""}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-lg font-bold">
                      {client.first_name} {client.last_name}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-0.5">
                      Doc: {client.document_number}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-md self-start mt-2 ${
                        client.status === "al-dia"
                          ? "bg-green-100"
                          : client.status === "proximo-mora"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          client.status === "al-dia"
                            ? "text-green-700"
                            : client.status === "proximo-mora"
                            ? "text-yellow-700"
                            : "text-red-700"
                        }`}
                      >
                        {client.status === "al-dia"
                          ? "AL DÍA"
                          : client.status === "proximo-mora"
                          ? "AVISO"
                          : "MORA"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Resumen Financiero */}
                <Text className="text-gray-800 text-base font-semibold mb-3">
                  Resumen Financiero
                </Text>
                <View className="flex-row flex-wrap justify-between mb-6">
                  <View className="w-[48%] bg-[#13678A] rounded-xl p-4 mb-3 shadow-sm">
                    <Text className="text-white/80 text-xs mb-1">
                      Deuda Total
                    </Text>
                    <Text className="text-white text-lg font-bold">
                      ${client.totalDebt?.toFixed(2) || "0.00"}
                    </Text>
                  </View>

                  <View className="w-[48%] bg-[#0D8A7A] rounded-xl p-4 mb-3 shadow-sm">
                    <Text className="text-white/80 text-xs mb-1">
                      Total Pagado
                    </Text>
                    <Text className="text-white text-lg font-bold">
                      ${client.totalPaid?.toFixed(2) || "0.00"}
                    </Text>
                  </View>

                  <View className="w-full bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm">
                    <Text className="text-orange-700 text-xs mb-1">
                      Saldo Pendiente
                    </Text>
                    <Text className="text-orange-800 text-xl font-bold">
                      ${client.pendingDebt?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                </View>

                {/* Info de contacto */}
                <Text className="text-gray-800 text-base font-semibold mb-3">
                  Contacto
                </Text>
                <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                      <Ionicons name="call" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs">Teléfono</Text>
                      <Text className="text-gray-800 text-sm font-medium">
                        {client.phone_primary || "No registrado"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                      <Ionicons name="location" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs">Dirección</Text>
                      <Text className="text-gray-800 text-sm font-medium">
                        {client.address_line || "No registrada"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Préstamos Activos */}
                <Text className="text-gray-800 text-base font-semibold mb-3">
                  Historial de Préstamos
                </Text>
                {loans.length === 0 ? (
                  <View className="bg-white border border-gray-100 p-6 rounded-2xl items-center justify-center mb-10">
                    <Ionicons
                      name="document-text-outline"
                      size={40}
                      color="#E5E7EB"
                    />
                    <Text className="text-gray-400 text-sm mt-3 text-center">
                      No hay préstamos asociados a este cliente
                    </Text>
                  </View>
                ) : (
                  <View className="mb-10">
                    {loans.map((loan) => (
                      <View
                        key={loan.id}
                        className="bg-white border border-gray-100 p-4 rounded-xl mb-3 shadow-sm"
                      >
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="text-gray-800 font-bold">
                            Contrato #{loan.contract_number}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded ${
                              loan.status === "active"
                                ? "bg-green-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                loan.status === "active"
                                  ? "text-green-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {loan.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-500 text-xs">Principal</Text>
                          <Text className="text-gray-800 font-medium text-xs">
                            ${loan.principal_amount?.toFixed(2)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-500 text-xs">Tasa</Text>
                          <Text className="text-gray-800 font-medium text-xs">
                            {loan.interest_rate}% ({loan.payment_frequency})
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-500 text-xs">Balance</Text>
                          <Text className="text-[#13678A] font-bold text-xs">
                            ${loan.current_balance?.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}
