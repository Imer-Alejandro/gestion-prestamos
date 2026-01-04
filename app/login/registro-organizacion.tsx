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
  };

  // Valida y continúa al siguiente paso
  const handleContinuar = () => {
    // Validación de campos requeridos
    if (!formData.nombreOrganizacion.trim()) {
      Alert.alert("Error", "El nombre de la organización es requerido");
      return;
    }

    if (!formData.tipoOrganizacion) {
      Alert.alert("Error", "Debe seleccionar un tipo de organización");
      return;
    }

    // Continuar al siguiente paso con los datos
    router.push({
      pathname: "/login/completar-informacion",
      params: formData,
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#13678A]">
      <View className="px-8 pt-16 pb-10">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold mb-1">
            Comience a registrar
          </Text>
          <Text className="text-white text-3xl font-bold">
            su organización
          </Text>
        </View>

        {/* Formulario */}
        <View className="mb-6">
          {/* Campo: Nombre de la organización */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">
              Nombre organización
            </Text>
            <TextInput
              value={formData.nombreOrganizacion}
              onChangeText={(text) =>
                setFormData({ ...formData, nombreOrganizacion: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
            />
          </View>

          {/* Campo: Eslogan */}
          <View className="mb-5">
            <Text className="text-white/80 text-sm mb-2">Eslogan</Text>
            <TextInput
              value={formData.eslogan}
              onChangeText={(text) =>
                setFormData({ ...formData, eslogan: text })
              }
              placeholder=""
              placeholderTextColor="#ffffff40"
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 text-white text-base"
            />
          </View>

          {/* Campo: Logo */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">Logo</Text>
            <TouchableOpacity
              className="bg-white/10 border border-white/30 rounded-lg px-4 py-3.5 flex-row items-center justify-between"
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
                Tipo de organización
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
          </View>

          {/* Botón continuar */}
          <TouchableOpacity
            onPress={handleContinuar}
            className="bg-white/90 rounded-lg py-4 items-center mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-[#13678A] font-semibold text-base">
              continuar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón volver */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center py-3 mt-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff90" />
          <Text className="text-white/70 text-sm ml-2">Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
