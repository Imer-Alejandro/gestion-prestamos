import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { initializeDatabase } from "../database/db.js";
import "../global.css";

/**
 * Splash Screen - Pantalla inicial de carga con el logo de Kanni Cash
 * Se muestra durante 3 segundos y luego redirige al login
 */
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al login después de 3 segundos
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function setup() {
      await initializeDatabase();
    }

    setup();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-[#13678A] relative">
      {/* K gigante de fondo en la esquina superior izquierda */}
      <Text className="absolute top-15 left-0 text-[#ffffff] opacity-10 text-[700px] font-bold leading-none">
        k
      </Text>

      {/* Logo principal de Kanni Cash */}
      <Text className="text-white text-5xl font-bold tracking-wider z-10 ">
        Kanni Cash
      </Text>
    </View>
  );
}
