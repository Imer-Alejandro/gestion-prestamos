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

interface RegistroClienteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (clienteData: ClienteFormData) => void;
}

export interface ClienteFormData {
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
  nota: string;
}

const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "PA"];

/**
 * Modal de Registro de Cliente
 * Formulario para registrar nuevos clientes con validación
 */
export default function RegistroClienteModal({
  visible,
  onClose,
  onSubmit,
}: RegistroClienteModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [showTipoDocPicker, setShowTipoDocPicker] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<ClienteFormData>({
    nombreCompleto: "",
    tipoDocumento: "CC",
    numeroDocumento: "",
    telefono: "",
    direccion: "",
    nota: "",
  });

  // Resetear animación cuando el modal se abre
  useEffect(() => {
    if (visible) {
      // Iniciar desde abajo
      translateY.setValue(1000);
      // Limpiar formulario al abrir
      setFormData({
        nombreCompleto: "",
        tipoDocumento: "CC",
        numeroDocumento: "",
        telefono: "",
        direccion: "",
        nota: "",
      });
      setShowTipoDocPicker(false);
      
      // Animar entrada
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
      formData.nombreCompleto.trim().length > 0 &&
      formData.numeroDocumento.trim().length > 0 &&
      formData.telefono.trim().length > 0
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
                  Registro de cliente
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
              {/* Nombre completo */}
              <View className="mb-4">
                <Text className="text-blue-600 text-sm font-medium mb-2">
                  Nombre completo
                </Text>
                <TextInput
                  value={formData.nombreCompleto}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombreCompleto: text })
                  }
                  placeholder=""
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Tipo documento y N. documento en fila */}
              <View className="flex-row mb-4 gap-3">
                {/* Tipo documento */}
                <View className="flex-1">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    Tipo documento
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTipoDocPicker(!showTipoDocPicker)}
                    className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 text-base">
                      {formData.tipoDocumento}
                    </Text>
                    <Ionicons
                      name={showTipoDocPicker ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {/* Picker desplegable */}
                  {showTipoDocPicker && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <TouchableOpacity
                          key={tipo}
                          onPress={() => {
                            setFormData({ ...formData, tipoDocumento: tipo });
                            setShowTipoDocPicker(false);
                          }}
                          className="px-4 py-3 border-b border-gray-100"
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-base ${
                              formData.tipoDocumento === tipo
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

                {/* N. documento */}
                <View className="flex-1">
                  <Text className="text-blue-600 text-sm font-medium mb-2">
                    N. documento
                  </Text>
                  <TextInput
                    value={formData.numeroDocumento}
                    onChangeText={(text) =>
                      setFormData({ ...formData, numeroDocumento: text })
                    }
                    placeholder=""
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Teléfono */}
              <View className="mb-4">
                <Text className="text-blue-600 text-sm font-medium mb-2">
                  Teléfono
                </Text>
                <TextInput
                  value={formData.telefono}
                  onChangeText={(text) =>
                    setFormData({ ...formData, telefono: text })
                  }
                  placeholder=""
                  keyboardType="phone-pad"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Dirección */}
              <View className="mb-4">
                <Text className="text-blue-600 text-sm font-medium mb-2">
                  Dirección
                </Text>
                <TextInput
                  value={formData.direccion}
                  onChangeText={(text) =>
                    setFormData({ ...formData, direccion: text })
                  }
                  placeholder=""
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Nota */}
              <View className="mb-4">
                <Text className="text-blue-600 text-sm font-medium mb-2">
                  Nota
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
                    isFormValid() ? "bg-teal-600" : "bg-gray-300"
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person-add"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white text-base font-semibold">
                    registrar cliente
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
