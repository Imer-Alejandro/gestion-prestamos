import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Pantalla de Registro de Organización - Paso 1
 * Permite ingresar datos básicos de la organización:
 * - Nombre de la organización
 * - Eslogan
 * - Logo (URL o file picker)
 * - Tipo de organización (Prestamistas, Comercios, Venta a crédito)
 */
export default function RegistroOrganizacionScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombreOrganizacion: "",
    eslogan: "",
    logo: "",
    tipoOrganizacion: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Tipos de organización disponibles
  const tiposOrganizacion = [
    {
      id: "prestamistas",
      label: "Prestamistas",
      icon: "cash",
    },
    {
      id: "comercios",
      label: "Comercios",
      icon: "storefront",
    },
    {
      id: "venta-credito",
      label: "Venta a crédito",
      icon: "card",
    },
  ];

  // Maneja la selección del tipo de organización
  const handleSelectTipo = (tipoId: string) => {
    setFormData({ ...formData, tipoOrganizacion: tipoId });
    if (errors.tipoOrganizacion) setErrors({ ...errors, tipoOrganizacion: "" });
  };

  // Valida y continúa al siguiente paso
  const handleContinuar = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreOrganizacion.trim()) {
      newErrors.nombreOrganizacion = "El nombre de la organización es obligatorio";
    }

    if (!formData.tipoOrganizacion) {
      newErrors.tipoOrganizacion = "Debe seleccionar un tipo de organización";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Continuar al siguiente paso con los datos
    router.push({
      pathname: "/login/completar-informacion",
      params: formData,
    });
  };

  return (
    <View className="flex-1 bg-[#13678A]">
      {/* Botón Volver - Posición fija arriba a la izquierda */}
      <View className="px-8 pt-14 pb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center self-start"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
          <Text className="text-white text-base ml-2 font-medium">Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-bold mb-2">
            Comience a registrar
          </Text>
          <Text className="text-white text-4xl font-bold">
            su organización
          </Text>
        </View>

        {/* Formulario */}
        <View className="mb-6">
          {/* Campo: Nombre de la organización - Altura fija para evitar movimiento */}
          <View className="mb-4">
            <Text className="text-white/80 text-base mb-2">
              Nombre organización *
            </Text>
            <TextInput
              value={formData.nombreOrganizacion}
              onChangeText={(text) => {
                setFormData({ ...formData, nombreOrganizacion: text });
                if (errors.nombreOrganizacion) setErrors({ ...errors, nombreOrganizacion: "" });
              }}
              placeholder=""
              placeholderTextColor="#ffffff40"
              className={`bg-white/10 border ${errors.nombreOrganizacion ? 'border-red-400' : 'border-white/30'} rounded-lg px-6 text-white text-lg`}
              style={{ height: 56, paddingVertical: 0 }}
            />
            {errors.nombreOrganizacion && (
              <Text className="text-red-300 text-xs mt-1 ml-1">{errors.nombreOrganizacion}</Text>
            )}
          </View>

          {/* Campo: Eslogan - Altura fija para evitar movimiento */}
          <View className="mb-4">
            <Text className="text-white/80 text-sm mb-2">Eslogan</Text>
            <TextInput
              value={formData.eslogan}
              onChangeText={(text) =>
                setFormData({ ...formData, eslogan: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 text-white text-base"
              style={{ height: 52, paddingVertical: 0 }}
            />
          </View>

          {/* Campo: Logo - Altura fija para mantener consistencia visual */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">Logo</Text>
            <TouchableOpacity
              className="bg-white/10 border border-white/30 rounded-lg px-4 flex-row items-center justify-between"
              style={{ height: 52 }}
              activeOpacity={0.7}
            >
              <Text className="text-white/40 text-base">
                {formData.logo || "Seleccionar imagen..."}
              </Text>
              <Ionicons name="cloud-upload-outline" size={22} color="#ffffff80" />
            </TouchableOpacity>
          </View>

          {/* Selector: Tipo de organización */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-white/80 text-sm mr-2">
                Tipo de organización *
              </Text>
              {/* Info tooltip */}
              <TouchableOpacity
                onPress={() => setShowInfoTooltip(!showInfoTooltip)}
                className="w-5 h-5 rounded-full border border-white/50 items-center justify-center"
              >
                <Text className="text-white/70 text-xs">?</Text>
              </TouchableOpacity>
            </View>

            {/* Tooltip desplegable */}
            {showInfoTooltip && (
              <View className="bg-white/10 border border-white/20 rounded-lg p-3 mb-3">
                <Text className="text-white/70 text-xs leading-relaxed">
                  Seleccione el tipo de organización que mejor describe su
                  negocio. Esto ayudará a personalizar la experiencia.
                </Text>
              </View>
            )}

            {/* Grid de tipos de organización */}
            <View className="flex-row flex-wrap gap-3">
              {tiposOrganizacion.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  onPress={() => handleSelectTipo(tipo.id)}
                  className={`flex-1 min-w-[100px] items-center bg-white/10 border ${
                    formData.tipoOrganizacion === tipo.id
                      ? "border-white/80 bg-white/20"
                      : "border-white/30"
                  } rounded-xl p-4`}
                  activeOpacity={0.7}
                >
                  {/* Icono */}
                  <View
                    className={`w-14 h-14 rounded-full ${
                      formData.tipoOrganizacion === tipo.id
                        ? "bg-white/30"
                        : "bg-white/10"
                    } items-center justify-center mb-2`}
                  >
                    <Ionicons
                      name={tipo.icon as any}
                      size={28}
                      color="#ffffff"
                    />
                  </View>
                  {/* Label */}
                  <Text className="text-white text-xs font-medium text-center">
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.tipoOrganizacion && (
              <Text className="text-red-300 text-xs mt-2 ml-1">{errors.tipoOrganizacion}</Text>
            )}
          </View>

          {/* Botón continuar - Altura fija para mantener consistencia */}
          <TouchableOpacity
            onPress={handleContinuar}
            className="bg-white/90 rounded-lg items-center justify-center mt-4"
            style={{ height: 56 }}
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-base">
              continuar
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}
