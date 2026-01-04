import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";

import { useColorScheme } from "../hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Pantalla inicial - Splash Screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Stack de login y registro */}
        <Stack.Screen 
          name="login/index" 
          options={{ 
            headerShown: false,
            animation: 'fade' 
          }} 
        />
        <Stack.Screen 
          name="login/registro" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/registro-organizacion" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/completar-informacion" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/recuperar-contrasena" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/validar-correo" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/firma-digital" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/agregar-empleados" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/onboarding" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false
          }} 
        />
        <Stack.Screen 
          name="login/registro-empleado" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />
        <Stack.Screen 
          name="login/validar-correo-empleado" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }} 
        />

        {/* Otras secciones de la app */}
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="clientes" options={{ headerShown: false }} />
        <Stack.Screen name="prestamos_abonos" options={{ headerShown: false }} />
        <Stack.Screen name="reportes" options={{ headerShown: false }} />
        <Stack.Screen name="configuracion" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
