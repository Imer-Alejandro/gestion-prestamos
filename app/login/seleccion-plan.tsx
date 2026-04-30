import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect, memo } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

const PlanCard = memo(({ item, isSelected, onSelect, scrollX, index, width, CARD_WIDTH }: any) => {
  const selectionAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    if (item.isDevelopment) return;

    // Animación de rebote (bounce)
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: false }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: false }),
    ]).start();

    onSelect(item.id);
  };

  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const cardScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: "clamp",
  });
  const cardOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: "clamp",
  });

  const animatedBorderWidth = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const planColor = item.isDevelopment ? "#94a3b8" : item.color;

  return (
    <View style={{ width: width, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          width: CARD_WIDTH + 12,
          height: 500, // Ajustado para 10 características
          padding: 6,
          borderRadius: 30,
          borderWidth: animatedBorderWidth,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isSelected ? 0.2 : 0,
          shadowRadius: 20,
          elevation: isSelected ? 15 : 0,
          opacity: cardOpacity,
          transform: [{ scale: cardScale }, { scale: bounceAnim }],
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', opacity: item.isDevelopment ? 0.7 : 1 }}>
          <TouchableOpacity activeOpacity={1} onPress={handlePress} className="flex-1 p-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[3px]">PLAN</Text>
              {item.isPopular && (
                <View className="bg-orange-500 px-3 py-1 rounded-lg">
                  <Text className="text-white text-[8px] font-black">POPULAR</Text>
                </View>
              )}
              {item.isDevelopment && (
                <View className="bg-gray-200 px-3 py-1 rounded-lg">
                  <Text className="text-gray-500 text-[8px] font-black">PRÓXIMAMENTE</Text>
                </View>
              )}
            </View>

            <Text className="text-3xl font-black mb-1" style={{ color: planColor }}>{item.name}</Text>
            <View className="flex-row items-baseline mb-4">
              <Text className={`${item.isDevelopment ? 'text-gray-400' : 'text-gray-900'} text-3xl font-black`}>{item.price}</Text>
              {item.id === 'standard' && <Text className="text-gray-500 text-sm font-bold ml-1">/ mes</Text>}
            </View>

            <View className="h-[2px] w-10 mb-4" style={{ backgroundColor: item.isDevelopment ? '#f1f5f9' : '#f3f4f6' }} />

            <View className="gap-y-3">
              {item.features.map((feature: any, idx: number) => (
                <View key={idx} className="flex-row items-center">
                  <View className={`${feature.negative ? 'bg-red-50' : 'bg-gray-50'} rounded-full p-1 mr-3`}>
                    <Ionicons
                      name={feature.negative ? "close" : "checkmark"}
                      size={12}
                      color={feature.negative ? "#ef4444" : planColor}
                    />
                  </View>
                  <Text
                    className={`${feature.negative ? 'text-red-400' : 'text-gray-700'} text-[13px] font-bold flex-1`}
                    numberOfLines={1}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {isSelected && (
              <View className="absolute bottom-6 right-6 bg-[#13678A] rounded-full p-2 shadow-lg">
                <Ionicons name="checkmark" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

export default function SeleccionPlanScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const CARD_WIDTH = width * 0.82;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(width)).current;
  const flatListRef = useRef<FlatList>(null);

  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: "Gratis",
      color: "#10b981",
      features: [
        { text: "Uso Offline" },
        { text: "Límite 20 clientes" },
        { text: "120 operaciones / mes" },
        { text: "Reportes básicos" },
        { text: "50 comprobantes / mes" },
        { text: "Marca de agua", negative: true },
        { text: "Sin exportación de datos", negative: true },
        { text: "Sin copia de seguridad", negative: true },
        { text: "Sin versión Web / Escritorio", negative: true },
        { text: "Sin multi-usuario", negative: true }
      ],
    },
    {
      id: "standard",
      name: "Estándar",
      price: "RD$ 820",
      color: "#13678A",
      isPopular: true,
      features: [
        { text: "Límite 150 clientes" },
        { text: "600 operaciones / mes" },
        { text: "Reportes profesionales" },
        { text: "Exportación masiva" },
        { text: "Copia de seguridad semanal" },
        { text: "Sin marca de agua" },
        { text: "200 comprobantes / mes" },
        { text: "Sin versión Web / Escritorio", negative: true },
        { text: "Sin sincronización tiempo real", negative: true },
        { text: "Sin multi-usuario", negative: true }
      ],
    },
    {
      id: "enterprise",
      name: "Empresarial",
      price: "En Desarrollo",
      color: "#64748b",
      isDevelopment: true,
      features: [
        { text: "Versión Web y Escritorio" },
        { text: "Usuarios ilimitados*" },
        { text: "Operaciones ilimitadas*" },
        { text: "Multi-usuario (Máx. 18 emp.)" },
        { text: "Enlaces personalizados" },
        { text: "Sincronización tiempo real" },
        { text: "Comprobantes ilimitados" },
        { text: "Copia de seguridad diaria" },
        { text: "Soporte 24/7" }
      ],
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleFinalizarRegistro = async () => {
    if (!selectedPlan) return;
    try {
      setIsLoading(true);
      const registroCompleto = {
        full_name: String(params.full_name || ""),
        email: String(params.email || ""),
        phone: String(params.phone || ""),
        password: String(params.password || ""),
        organizacion: {
          nombre: String(params.org_nombre || ""),
          eslogan: String(params.org_eslogan || ""),
          logo: String(params.org_logo || ""),
          tipo: String(params.org_tipo || ""),
          direccion: String(params.org_direccion || ""),
          rnc: String(params.org_rnc || ""),
          plan_type: selectedPlan!,
        },
      };
      await register(registroCompleto);
      Alert.alert("¡Bienvenido! 🎉", "Registro completado con éxito");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error en el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#13678A]">
      <View className="px-8 pt-12 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
          <Text className="text-white text-base ml-2 font-medium">Volver</Text>
        </TouchableOpacity>
      </View>

      <View className="px-8 mt-4 mb-4">
        <Text className="text-white text-3xl font-black text-center">Seleccione su Plan</Text>
        <Text className="text-white/70 text-sm font-medium text-center mt-2 px-6">
          Elija el plan que mejor se adapte a su volumen de trabajo.
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Animated.FlatList
          ref={flatListRef}
          data={plans}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <PlanCard
              item={item}
              index={index}
              isSelected={selectedPlan === item.id}
              onSelect={setSelectedPlan}
              scrollX={scrollX}
              width={width}
              CARD_WIDTH={CARD_WIDTH}
            />
          )}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        <View className="flex-row justify-center mt-[-10] mb-8 gap-2">
          {plans.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 18, 6],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={{
                  width: dotWidth,
                  height: 6,
                  opacity: dotOpacity,
                  backgroundColor: 'white',
                  borderRadius: 2,
                }}
              />
            );
          })}
        </View>
      </View>

      <View className="px-8 pb-10">
        <TouchableOpacity
          onPress={handleFinalizarRegistro}
          disabled={isLoading || !selectedPlan}
          className={`bg-white rounded-[20px] py-5 items-center justify-center shadow-2xl ${(!selectedPlan || isLoading) ? "opacity-30" : "opacity-100"
            }`}
        >
          <Text className="text-[#13678A] font-black text-lg tracking-[2px] uppercase">
            {isLoading ? "Procesando..." : "Confirmar Selección"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
