import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface RegistroAbonoModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (abonoData: AbonoFormData) => void;
  clienteId?: string;
}

export interface AbonoFormData {
  fechaRegistro: string;
  prestamoAbono: string;
  cuotaAbono: string;
  tipoAbono: string;
  metodoPago: string;
  referenciaPago: string;
  monto: string;
  nota: string;
}

const TIPOS_ABONO = ["Normal", "Anticipo", "Pago total", "Cuota extra"];
const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta"];

/**
 * Modal de Registro de Abono
 * Formulario para registrar pagos/abonos de clientes
 */
export default function RegistroAbonoModal({
  visible,
  onClose,
  onSubmit,
  clienteId,
}: RegistroAbonoModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [showTipoAbonoPicker, setShowTipoAbonoPicker] = useState(false);
  const [showMetodoPagoPicker, setShowMetodoPagoPicker] = useState(false);
  const [showTipoAbonoInfo, setShowTipoAbonoInfo] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<AbonoFormData>({
    fechaRegistro: new Date().toISOString().split("T")[0],
    prestamoAbono: "",
    cuotaAbono: "",
    tipoAbono: "Normal",
    metodoPago: "Efectivo",
    referenciaPago: "",
    monto: "",
    nota: "",
  });

  // Resetear animación cuando el modal se abre
  useEffect(() => {
    if (visible) {
      translateY.setValue(1000);
      setFormData({
        fechaRegistro: new Date().toISOString().split("T")[0],
        prestamoAbono: "",
        cuotaAbono: "",
        tipoAbono: "Normal",
        metodoPago: "Efectivo",
        referenciaPago: "",
        monto: "",
        nota: "",
      });
      setShowTipoAbonoPicker(false);
      setShowMetodoPagoPicker(false);

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

  // Validar formulario
  const isFormValid = () => {
    return (
      formData.fechaRegistro.trim().length > 0 &&
      formData.prestamoAbono.trim().length > 0 &&
      formData.cuotaAbono.trim().length > 0 &&
      formData.monto.trim().length > 0
    );
  };

  // Manejar envío del formulario
  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(formData);
      onClose();
    }
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
            className="bg-white rounded-t-3xl h-5/6 shadow-2xl"
            style={{
              transform: [{ translateY }],
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
              keyboardVerticalOffset={0}
            >
              {/* Indicador de arrastre */}
              <View {...panResponder.panHandlers} className="py-3 items-center">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header del modal */}
              <View className="px-6 pb-4 border-b border-gray-100 flex-row items-center justify-between">
                <Text className="text-gray-800 text-xl font-bold">
                  Registro pago de cuota
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Formulario */}
              <ScrollView
                className="flex-1 px-6 py-4"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Fecha de registro */}
                <View className="mb-4">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    Fecha de registro
                  </Text>
                  <TextInput
                    value={formData.fechaRegistro}
                    onChangeText={(text) =>
                      setFormData({ ...formData, fechaRegistro: text })
                    }
                    placeholder="YYYY-MM-DD"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Prestamo del abono */}
                <View className="mb-4">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    Prestamo del abono
                  </Text>
                  <TextInput
                    value={formData.prestamoAbono}
                    onChangeText={(text) =>
                      setFormData({ ...formData, prestamoAbono: text })
                    }
                    placeholder=""
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Cuota del abono */}
                <View className="mb-4">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    Cuota del abono
                  </Text>
                  <TextInput
                    value={formData.cuotaAbono}
                    onChangeText={(text) =>
                      setFormData({ ...formData, cuotaAbono: text })
                    }
                    placeholder=""
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Tipo de abono */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-blue-600 text-sm font-medium">
                      Tipo de abono
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowTipoAbonoInfo(!showTipoAbonoInfo)}
                      className="w-6 h-6 rounded-full border-2 border-blue-600 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-blue-600 text-xs font-bold">?</Text>
                    </TouchableOpacity>
                  </View>

                  {showTipoAbonoInfo && (
                    <View className="bg-blue-50 p-3 rounded-lg mb-2">
                      <Text className="text-blue-800 text-xs">
                        • Normal: Pago regular de cuota{"\n"}
                        • Anticipo: Pago adelantado{"\n"}
                        • Pago total: Liquidación completa{"\n"}
                        • Cuota extra: Pago adicional
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowTipoAbonoPicker(!showTipoAbonoPicker)}
                    className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 text-base">
                      {formData.tipoAbono}
                    </Text>
                    <Ionicons
                      name={showTipoAbonoPicker ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {showTipoAbonoPicker && (
                    <View className="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {TIPOS_ABONO.map((tipo) => (
                        <TouchableOpacity
                          key={tipo}
                          onPress={() => {
                            setFormData({ ...formData, tipoAbono: tipo });
                            setShowTipoAbonoPicker(false);
                          }}
                          className="px-4 py-3 border-b border-gray-100"
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-base ${
                              formData.tipoAbono === tipo
                                ? "text-blue-600 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {tipo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Metodo de pago y Referencia de pago en fila */}
                <View className="flex-row mb-4 gap-3">
                  {/* Metodo de pago */}
                  <View className="flex-1">
                    <Text className="text-blue-600 text-sm font-medium mb-2">
                      Metodo de pago
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowMetodoPagoPicker(!showMetodoPagoPicker)}
                      className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                      activeOpacity={0.7}
                    >
                      <Text className="text-gray-900 text-base">
                        {formData.metodoPago}
                      </Text>
                      <Ionicons
                        name={showMetodoPagoPicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {showMetodoPagoPicker && (
                      <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {METODOS_PAGO.map((metodo) => (
                          <TouchableOpacity
                            key={metodo}
                            onPress={() => {
                              setFormData({ ...formData, metodoPago: metodo });
                              setShowMetodoPagoPicker(false);
                            }}
                            className="px-4 py-3 border-b border-gray-100"
                            activeOpacity={0.7}
                          >
                            <Text
                              className={`text-base ${
                                formData.metodoPago === metodo
                                  ? "text-blue-600 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {metodo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Referencia de pago */}
                  <View className="flex-1">
                    <Text className="text-blue-600 text-sm font-medium mb-2">
                      Referencia de pago
                    </Text>
                    <TextInput
                      value={formData.referenciaPago}
                      onChangeText={(text) =>
                        setFormData({ ...formData, referenciaPago: text })
                      }
                      placeholder=""
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Monto */}
                <View className="mb-4">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    Monto
                  </Text>
                  <TextInput
                    value={formData.monto}
                    onChangeText={(text) =>
                      setFormData({ ...formData, monto: text })
                    }
                    placeholder=""
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Nota */}
                <View className="mb-4">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    nota
                  </Text>
                  <TextInput
                    value={formData.nota}
                    onChangeText={(text) =>
                      setFormData({ ...formData, nota: text })
                    }
                    placeholder=""
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Espaciador */}
                <View className="h-20" />
              </ScrollView>

              {/* Botón de registro fijo al fondo */}
              <View className="px-6 pb-6 pt-4 border-t border-gray-100 bg-white">
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!isFormValid()}
                  className={`rounded-lg py-4 flex-row items-center justify-center ${
                    isFormValid() ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white text-base font-semibold">
                    registrar abono
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}
