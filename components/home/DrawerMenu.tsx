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
    View
} from "react-native";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  userData: {
    name: string;
    role: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Menú principal de navegación
  const mainMenu: MenuItem[] = [
    { id: "home", label: "Inicio", icon: "home-outline", route: "/home" },
    { id: "clientes", label: "Clientes", icon: "people-outline", route: "/clientes" },
    { id: "prestamos", label: "Préstamos y abonos", icon: "cash-outline", route: "/prestamos_abonos" },
    { id: "reportes", label: "Reportes y consultas", icon: "bar-chart-outline", route: "/reportes" },
    { id: "empleados", label: "Empleados", icon: "briefcase-outline", route: "/empleados" },
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
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  // Búsqueda de clientes
  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log("Buscando cliente:", searchQuery);
      onClose();
      // TODO: Implementar búsqueda y navegar a resultados
    }
  };

  // Registrar abono
  const handleRegistrarAbono = () => {
    onClose();
    console.log("Registrar abono");
    // TODO: Navegar a pantalla de registro de abono
  };

  // Registrar préstamo
  const handleRegistrarPrestamo = () => {
    onClose();
    console.log("Registrar préstamo");
    // TODO: Navegar a pantalla de registro de préstamo
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
          onPress: () => {
            onClose();
            setTimeout(() => {
              router.replace("/login");
            }, 300);
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
              <View className="bg-[#13678A] px-6 pt-16 pb-6">
                <View className="flex-row items-center mb-4">
                  {/* Avatar */}
                  <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center border-2 border-white/30 mr-3">
                    <Text className="text-white text-xl font-bold">
                      {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </Text>
                  </View>
                  {/* Nombre y rol */}
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      Hola, {userData.name}
                    </Text>
                    <Text className="text-white/80 text-sm">
                      {userData.role}
                    </Text>
                  </View>
                </View>

                {/* Buscador */}
                <View className="bg-white/95 rounded-xl px-4 py-3 flex-row items-center">
                  <Ionicons name="search" size={20} color="#13678A" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar clientes..."
                    placeholderTextColor="#999"
                    className="flex-1 ml-2 text-gray-800 text-sm"
                    onSubmitEditing={handleSearch}
                  />
                </View>
              </View>

              {/* Menú principal */}
              <View className="py-4">
                {mainMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item.route)}
                    className="flex-row items-center px-6 py-4 active:bg-gray-50"
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={24} 
                      color="#13678A" 
                    />
                    <Text className="text-gray-700 text-base ml-4 flex-1">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Separador */}
              <View className="h-px bg-gray-200 mx-6 my-2" />

              {/* Botones de acción rápida */}
              <View className="px-6 py-4">
                <TouchableOpacity
                  onPress={handleRegistrarAbono}
                  className="bg-[#13678A] rounded-xl py-3.5 flex-row items-center justify-center mb-3"
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-down-circle-outline" size={22} color="#ffffff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Registro de abonos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRegistrarPrestamo}
                  className="bg-[#13678A] rounded-xl py-3.5 flex-row items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up-circle-outline" size={22} color="#ffffff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Registro de préstamos
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Separador */}
              <View className="h-px bg-gray-200 mx-6 my-2" />

              {/* Menú inferior */}
              <View className="py-2">
                {bottomMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item.route)}
                    className="flex-row items-center px-6 py-4 active:bg-gray-50"
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={24} 
                      color="#13678A" 
                    />
                    <Text className="text-gray-700 text-base ml-4 flex-1">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botón de cerrar sesión */}
              <View className="px-6 py-4 pb-8">
                <TouchableOpacity
                  onPress={handleLogout}
                  className="bg-gray-100 rounded-xl py-4 items-center border border-gray-200"
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-semibold text-base">
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
