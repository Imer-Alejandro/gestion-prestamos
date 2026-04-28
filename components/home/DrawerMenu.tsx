import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { sendLocalNotification } from "../../services/notification.service";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  userData: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
}

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
}

const DRAWER_WIDTH = 320;

/**
 * Menú lateral de navegación (Drawer)
 * Se abre de derecha a izquierda con blur en el fondo
 * Soporta cierre por swipe y toque fuera
 */
export default function DrawerMenu({ visible, onClose, userData }: DrawerMenuProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Menú principal de navegación
  const mainMenu: MenuItem[] = [
    { id: "home", label: "Inicio", icon: "home-outline", route: "/home" },
    { id: "clientes", label: "Clientes", icon: "people-outline", route: "/clientes" },
    { id: "prestamos", label: "Préstamos y abonos", icon: "cash-outline", route: "/prestamos_abonos" },
    { id: "reportes", label: "Reportes y consultas", icon: "bar-chart-outline", route: "/reportes" },
    //  {id: "empleados", label: "Empleados", icon: "briefcase-outline", route: "/empleados" }
  ];

  // Menú inferior
  const bottomMenu: MenuItem[] = [
    { id: "config", label: "Configuración y cuenta", icon: "settings-outline", route: "/configuracion" },
    { id: "ayuda", label: "Ayuda", icon: "help-circle-outline", route: "/ayuda" },
  ];

  // Animación de apertura/cierre mejorada
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // PanResponder para swipe hacia la derecha
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
          opacityAnim.setValue(Math.max(0, 1 - gestureState.dx / DRAWER_WIDTH));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > DRAWER_WIDTH / 3) {
          onClose();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(opacityAnim, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Navegar a una sección
  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  // Cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            onClose();
            await logout();
            // AuthContext se encarga de la navegación
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Blur Background */}
        <Animated.View
          style={[
            { flex: 1 },
            { opacity: opacityAnim }
          ]}
        >
          <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={onClose}
            />
          </BlurView>
        </Animated.View>

        {/* Drawer desde la derecha */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <View className="flex-1 bg-white shadow-2xl">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Header con perfil */}
              <View className="bg-[#13678A] px-6 pt-16 pb-8 rounded-bl-3xl">
                <View className="flex-row items-center">
                  {/* Avatar con sombra suave */}
                  <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm mr-4 overflow-hidden">
                    {userData.avatarUrl ? (
                      <Image 
                        source={{ uri: userData.avatarUrl }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-[#13678A] text-2xl font-bold">
                        {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  {/* Nombre y rol */}
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold" numberOfLines={1}>
                      {userData.name}
                    </Text>
                    <Text className="text-teal-100 text-sm font-medium mt-0.5">
                      {userData.role}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menú principal */}
              <View className="py-6 px-4">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-4">
                  Principal
                </Text>
                {mainMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item.route)}
                    className="flex-row items-center px-4 py-3.5 mb-1 rounded-xl active:bg-blue-50"
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#13678A"
                      />
                    </View>
                    <Text className="text-gray-800 font-medium text-base flex-1">
                      {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>

              <View className="h-px bg-gray-100 mx-8" />

              {/* Menú inferior */}
              <View className="py-6 px-4 flex-1">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-4">
                  Preferencias
                </Text>
                {bottomMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item.route)}
                    className="flex-row items-center px-4 py-3.5 mb-1 rounded-xl active:bg-gray-50"
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#6B7280"
                      />
                    </View>
                    <Text className="text-gray-600 font-medium text-base flex-1">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botón de cerrar sesión */}
              <View className="px-6 pb-10 pt-4">
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-row items-center justify-center py-4 bg-red-50 rounded-2xl border border-red-100"
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                  <Text className="text-red-500 font-bold text-base ml-2">
                    Cerrar sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
