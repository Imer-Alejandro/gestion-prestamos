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
  // Información básica
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  nacionalidad: string;
  sexo: string;
  
  // Contacto
  celularWhatsapp: string;
  telefonoCasa: string;
  telefonoOtro: string;
  email: string;
  
  // Ubicación
  direccion: string;
  provincia: string;
  municipio: string;
  sector: string;
  rutaCobro: string;
  
  // Información laboral
  ocupacion: string;
  situacionLaboral: string;
  direccionTrabajo: string;
  ingresos: string;
  
  // Vivienda
  tipoVivienda: string;
  
  // Referencias
  recomendadoPor: string;
  
  // Firma
  firma: string | null;
  
  // Notas
  nota: string;
}

const TIPOS_DOCUMENTO = ["Cédula", "Pasaporte", "RNC"];
const SEXOS = ["Masculino", "Femenino"];
const TIPOS_VIVIENDA = ["Propia", "Alquilada", "Familiar", "Otra"];
const SITUACIONES_LABORALES = ["Empleado", "Independiente", "Desempleado", "Pensionado"];

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
  const [showSexoPicker, setShowSexoPicker] = useState(false);
  const [showViviendaPicker, setShowViviendaPicker] = useState(false);
  const [showSituacionLaboralPicker, setShowSituacionLaboralPicker] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<ClienteFormData>({
    nombreCompleto: "",
    tipoDocumento: "Cédula",
    numeroDocumento: "",
    fechaNacimiento: "",
    nacionalidad: "Dominicana",
    sexo: "Masculino",
    celularWhatsapp: "",
    telefonoCasa: "",
    telefonoOtro: "",
    email: "",
    direccion: "",
    provincia: "",
    municipio: "",
    sector: "",
    rutaCobro: "",
    ocupacion: "",
    situacionLaboral: "Empleado",
    direccionTrabajo: "",
    ingresos: "",
    tipoVivienda: "Propia",
    recomendadoPor: "",
    firma: null,
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
        tipoDocumento: "Cédula",
        numeroDocumento: "",
        fechaNacimiento: "",
        nacionalidad: "Dominicana",
        sexo: "Masculino",
        celularWhatsapp: "",
        telefonoCasa: "",
        telefonoOtro: "",
        email: "",
        direccion: "",
        provincia: "",
        municipio: "",
        sector: "",
        rutaCobro: "",
        ocupacion: "",
        situacionLaboral: "Empleado",
        direccionTrabajo: "",
        ingresos: "",
        tipoVivienda: "Propia",
        recomendadoPor: "",
        firma: null,
        nota: "",
      });
      setShowTipoDocPicker(false);
      setShowSexoPicker(false);
      setShowViviendaPicker(false);
      setShowSituacionLaboralPicker(false);
      
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
      formData.celularWhatsapp.trim().length > 0
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
            className="bg-white rounded-t-3xl shadow-2xl"
            style={{
              transform: [{ translateY }],
              height: '92%',
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="flex-1"
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
                contentContainerStyle={{ paddingBottom: 40 }}
              >
              {/* SECCIÓN: Información Personal */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Información Personal
                </Text>

                {/* Nombre completo */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Nombre completo *
                  </Text>
                  <TextInput
                    value={formData.nombreCompleto}
                    onChangeText={(text) =>
                      setFormData({ ...formData, nombreCompleto: text })
                    }
                    placeholder="Ej: Juan Pérez García"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Tipo y Número de documento */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Tipo documento *
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
                            <Text className={`text-base ${formData.tipoDocumento === tipo ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                              {tipo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      N. documento *
                    </Text>
                    <TextInput
                      value={formData.numeroDocumento}
                      onChangeText={(text) =>
                        setFormData({ ...formData, numeroDocumento: text })
                      }
                      placeholder="001-0123456-7"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Fecha de nacimiento y Sexo */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Fecha de nacimiento
                    </Text>
                    <TextInput
                      value={formData.fechaNacimiento}
                      onChangeText={(text) =>
                        setFormData({ ...formData, fechaNacimiento: text })
                      }
                      placeholder="DD/MM/AAAA"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Sexo
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowSexoPicker(!showSexoPicker)}
                      className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                      activeOpacity={0.7}
                    >
                      <Text className="text-gray-900 text-base">
                        {formData.sexo}
                      </Text>
                      <Ionicons
                        name={showSexoPicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                    {showSexoPicker && (
                      <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {SEXOS.map((sexo) => (
                          <TouchableOpacity
                            key={sexo}
                            onPress={() => {
                              setFormData({ ...formData, sexo });
                              setShowSexoPicker(false);
                            }}
                            className="px-4 py-3 border-b border-gray-100"
                            activeOpacity={0.7}
                          >
                            <Text className={`text-base ${formData.sexo === sexo ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                              {sexo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Nacionalidad */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Nacionalidad
                  </Text>
                  <TextInput
                    value={formData.nacionalidad}
                    onChangeText={(text) =>
                      setFormData({ ...formData, nacionalidad: text })
                    }
                    placeholder="Ej: Dominicana"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* SECCIÓN: Contacto */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Información de Contacto
                </Text>

                {/* Celular/WhatsApp */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Celular/WhatsApp *
                  </Text>
                  <TextInput
                    value={formData.celularWhatsapp}
                    onChangeText={(text) =>
                      setFormData({ ...formData, celularWhatsapp: text })
                    }
                    placeholder="Ej: 809-555-1234"
                    keyboardType="phone-pad"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Tel. Casa y Tel. Otro */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Tel. Casa
                    </Text>
                    <TextInput
                      value={formData.telefonoCasa}
                      onChangeText={(text) =>
                        setFormData({ ...formData, telefonoCasa: text })
                      }
                      placeholder="Opcional"
                      keyboardType="phone-pad"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Tel. Otro
                    </Text>
                    <TextInput
                      value={formData.telefonoOtro}
                      onChangeText={(text) =>
                        setFormData({ ...formData, telefonoOtro: text })
                      }
                      placeholder="Opcional"
                      keyboardType="phone-pad"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Correo electrónico
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* SECCIÓN: Ubicación */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Ubicación
                </Text>

                {/* Dirección */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Dirección
                  </Text>
                  <TextInput
                    value={formData.direccion}
                    onChangeText={(text) =>
                      setFormData({ ...formData, direccion: text })
                    }
                    placeholder="Calle, número, edificio, etc."
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Provincia y Municipio */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Provincia
                    </Text>
                    <TextInput
                      value={formData.provincia}
                      onChangeText={(text) =>
                        setFormData({ ...formData, provincia: text })
                      }
                      placeholder="Ej: Santo Domingo"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Municipio
                    </Text>
                    <TextInput
                      value={formData.municipio}
                      onChangeText={(text) =>
                        setFormData({ ...formData, municipio: text })
                      }
                      placeholder="Ej: Distrito Nacional"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Sector y Ruta de cobro */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Sector
                    </Text>
                    <TextInput
                      value={formData.sector}
                      onChangeText={(text) =>
                        setFormData({ ...formData, sector: text })
                      }
                      placeholder="Ej: Zona Colonial"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-800 text-sm font-medium mb-2">
                      Ruta de cobro
                    </Text>
                    <TextInput
                      value={formData.rutaCobro}
                      onChangeText={(text) =>
                        setFormData({ ...formData, rutaCobro: text })
                      }
                      placeholder="Ej: Ruta A"
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              {/* SECCIÓN: Información Laboral */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Información Laboral
                </Text>

                {/* Ocupación */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Ocupación
                  </Text>
                  <TextInput
                    value={formData.ocupacion}
                    onChangeText={(text) =>
                      setFormData({ ...formData, ocupacion: text })
                    }
                    placeholder="Ej: Contador, Comerciante, etc."
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Situación Laboral */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Situación laboral
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowSituacionLaboralPicker(!showSituacionLaboralPicker)}
                    className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 text-base">
                      {formData.situacionLaboral}
                    </Text>
                    <Ionicons
                      name={showSituacionLaboralPicker ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {showSituacionLaboralPicker && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {SITUACIONES_LABORALES.map((situacion) => (
                        <TouchableOpacity
                          key={situacion}
                          onPress={() => {
                            setFormData({ ...formData, situacionLaboral: situacion });
                            setShowSituacionLaboralPicker(false);
                          }}
                          className="px-4 py-3 border-b border-gray-100"
                          activeOpacity={0.7}
                        >
                          <Text className={`text-base ${formData.situacionLaboral === situacion ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                            {situacion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Dirección de trabajo */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Dirección de trabajo
                  </Text>
                  <TextInput
                    value={formData.direccionTrabajo}
                    onChangeText={(text) =>
                      setFormData({ ...formData, direccionTrabajo: text })
                    }
                    placeholder="Dirección completa del lugar de trabajo"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Ingresos */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Ingresos mensuales
                  </Text>
                  <TextInput
                    value={formData.ingresos}
                    onChangeText={(text) =>
                      setFormData({ ...formData, ingresos: text })
                    }
                    placeholder="Ej: 25000"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* SECCIÓN: Vivienda y Referencias */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Vivienda y Referencias
                </Text>

                {/* Tipo de vivienda */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Tipo de vivienda
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowViviendaPicker(!showViviendaPicker)}
                    className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 text-base">
                      {formData.tipoVivienda}
                    </Text>
                    <Ionicons
                      name={showViviendaPicker ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {showViviendaPicker && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {TIPOS_VIVIENDA.map((tipo) => (
                        <TouchableOpacity
                          key={tipo}
                          onPress={() => {
                            setFormData({ ...formData, tipoVivienda: tipo });
                            setShowViviendaPicker(false);
                          }}
                          className="px-4 py-3 border-b border-gray-100"
                          activeOpacity={0.7}
                        >
                          <Text className={`text-base ${formData.tipoVivienda === tipo ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                            {tipo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Recomendado por */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Recomendado por
                  </Text>
                  <TextInput
                    value={formData.recomendadoPor}
                    onChangeText={(text) =>
                      setFormData({ ...formData, recomendadoPor: text })
                    }
                    placeholder="Nombre de quien recomienda al cliente"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* SECCIÓN: Notas y Firma */}
              <View className="mb-6">
                <Text className="text-gray-800 text-lg font-bold mb-4">
                  Información Adicional
                </Text>

                {/* Nota */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Notas
                  </Text>
                  <TextInput
                    value={formData.nota}
                    onChangeText={(text) =>
                      setFormData({ ...formData, nota: text })
                    }
                    placeholder="Información adicional relevante..."
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Firma */}
                <View className="mb-4">
                  <Text className="text-gray-800 text-sm font-medium mb-2">
                    Firma del cliente
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // TODO: Implementar captura de firma
                      alert("Funcionalidad de firma en desarrollo");
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm mt-2">
                      Toca para agregar firma
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón de registro */}
              <View className="px-6 pb-6 pt-4">
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

              {/* Spacer para teclado */}
              <View className="h-96" />
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </BlurView>
    </View>
  </Modal>
  );
}
