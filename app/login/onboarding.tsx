import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Pantalla de Onboarding - Carrusel de presentación
 * Muestra las características principales de la app
 * con slides deslizables
 */

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Mejore la productividad",
    description:
      "Gestione sus préstamos y abonos de manera eficiente mientras gestiona todo",
    icon: "trending-up",
    color: "#4CAF50",
  },
  {
    id: 2,
    title: "Control total",
    description:
      "Mantenga un registro detallado de todos sus clientes y transacciones en tiempo real",
    icon: "checkmark-circle",
    color: "#2196F3",
  },
  {
    id: 3,
    title: "Reportes detallados",
    description:
      "Genere reportes completos y analice el rendimiento de su negocio",
    icon: "bar-chart",
    color: "#FF9800",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Maneja el cambio de slide al hacer scroll
  const handleScroll = (event: any) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / width
    );
    setCurrentIndex(slideIndex);
  };

  // Navega al siguiente slide
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Omite el onboarding y va al home
  const handleSkip = () => {
    router.replace("/home");
  };

  // Finaliza el onboarding
  const handleFinish = () => {
    router.replace("/home");
  };

  return (
    <View className="flex-1 bg-[#13678A]">
      {/* Botón de omitir (solo si no es el último slide) */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-14 right-8 z-10 px-4 py-2"
          activeOpacity={0.7}
        >
          <Text className="text-white text-sm font-medium">omitir</Text>
        </TouchableOpacity>
      )}

      {/* ScrollView horizontal para los slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={{ width }}
            className="flex-1 items-center justify-center px-10"
          >
            {/* Ilustración con icono */}
            <View className="mb-12">
              {/* Imagen ilustrativa simulada */}
              <View className="bg-white/95 rounded-3xl p-12 items-center justify-center shadow-lg">
                <View
                  className="bg-[#13678A]/10 rounded-full p-8 mb-4"
                  style={{ width: 150, height: 150 }}
                >
                  <Ionicons
                    name={slide.icon as any}
                    size={80}
                    color="#13678A"
                  />
                </View>
                
                {/* Elementos decorativos según la imagen */}
                {slide.id === 1 && (
                  <View className="absolute bottom-8 right-8">
                    <Ionicons name="people" size={40} color="#FFA726" />
                  </View>
                )}
              </View>
            </View>

            {/* Título */}
            <Text className="text-white text-3xl font-bold text-center mb-4 leading-tight">
              {slide.title}
            </Text>

            {/* Descripción */}
            <Text className="text-white/80 text-base text-center leading-relaxed px-4">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores de página (dots) */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full mx-1 ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/30 w-2"
            }`}
          />
        ))}
      </View>

      {/* Botón de acción */}
      <View className="px-10 pb-12">
        <TouchableOpacity
          onPress={
            currentIndex === slides.length - 1 ? handleFinish : handleNext
          }
          className="bg-white/90 rounded-lg py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-[#13678A] font-semibold text-base">
            {currentIndex === slides.length - 1 ? "finalizar" : "siguiente"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
