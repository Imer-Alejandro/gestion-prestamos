import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import DrawerMenu from "../../components/home/DrawerMenu";
import NotificationModal from "../../components/home/NotificationModal";
import {
  formatCurrencyPrestamos,
  mockAbonos,
  mockPrestamosActivos,
  type Prestamo
} from "../../data/prestamosData";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Pantalla de Préstamos y Abonos
 * Muestra listado de préstamos activos y abonos realizados
 */
export default function PrestamosScreen() {
  const router = useRouter();
  const { user } = useAuth(); // 👈 Acceder al usuario logueado
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNuevoPrestamo, setShowNuevoPrestamo] = useState(false);
  
  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };
  const [activeTab, setActiveTab] = useState<"prestamos" | "abonos">("prestamos");
  const [showFiltros, setShowFiltros] = useState(false);
  
  const notifications = mockNotifications;

  // Calcular total de deudas pendientes
  const totalDeudasPendientes = mockPrestamosActivos.reduce(
    (sum, prestamo) => sum + prestamo.deudaPendiente,
    0
  );

  // Maneja la eliminación de notificaciones
  const handleDeleteNotification = (notificationId: string) => {
    console.log("Eliminar notificación:", notificationId);
  };

  // Maneja la búsqueda
  const handleSearch = () => {
    console.log("Buscando:", searchQuery);
  };

  // Navegar al detalle del préstamo
  const handlePrestamoPress = (prestamoId: string) => {
    console.log("Ver préstamo:", prestamoId);
    // TODO: Navegar al detalle del préstamo
  };

  // Abrir menú de opciones del préstamo
  const handlePrestamoMenu = (prestamoId: string) => {
    console.log("Menú préstamo:", prestamoId);
    // TODO: Abrir menú de opciones
  };

  // Renderizar card de préstamo
  const renderPrestamoCard = (prestamo: Prestamo) => (
    <TouchableOpacity
      key={prestamo.id}
      onPress={() => handlePrestamoPress(prestamo.id)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      activeOpacity={0.7}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header con monto total y menú */}
      <View className="flex-row items-start justify-between mb-3">
        <View>
          <Text className="text-gray-500 text-xs mb-1">Total del prestamo</Text>
          <Text className="text-blue-600 text-2xl font-bold">
            {formatCurrencyPrestamos(prestamo.totalPrestamo)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handlePrestamoMenu(prestamo.id)}
          className="w-8 h-8 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Nombre del cliente con avatar */}
      <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
        <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-2">
          <Text className="text-white text-sm font-bold">
            {prestamo.clienteIniciales}
          </Text>
        </View>
        <Text className="text-gray-700 text-sm">{prestamo.clienteNombre}</Text>
      </View>

      {/* Grid de información financiera */}
      <View className="flex-row flex-wrap">
        <View className="w-1/2 mb-3">
          <Text className="text-gray-500 text-xs mb-1">Total abonado</Text>
          <Text className="text-gray-900 text-sm font-semibold">
            {formatCurrencyPrestamos(prestamo.totalAbonado)}
          </Text>
        </View>

        <View className="w-1/2 mb-3">
          <Text className="text-gray-500 text-xs mb-1">Deuda pendiente</Text>
          <Text className="text-gray-900 text-sm font-semibold">
            {formatCurrencyPrestamos(prestamo.deudaPendiente)}
          </Text>
        </View>

        <View className="w-1/2">
          <Text className="text-gray-500 text-xs mb-1">Deuda pendiente</Text>
          <Text className="text-gray-900 text-sm font-semibold">
            {(prestamo.deudaPendientePorcentaje * 100).toFixed(3)}%
          </Text>
        </View>

        <View className="w-1/2">
          <Text className="text-gray-500 text-xs mb-1">Cuotas</Text>
          <Text className="text-gray-900 text-sm font-semibold">
            {prestamo.cuotas}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      {/* Header compartido */}
      <AppHeader
        userData={userData}
        onNotificationsPress={() => setShowNotifications(true)}
        onMenuPress={() => setShowDrawer(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        hasNotifications={notifications.length > 0}
      />

      {/* Total de deudas pendientes */}
      <View className="bg-blue-600 mx-4 mt-4 mb-3 rounded-2xl p-6 shadow-md"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text className="text-white/80 text-sm mb-2">
          Total de deudas pendientes
        </Text>
        <Text className="text-white text-3xl font-bold">
          {formatCurrencyPrestamos(totalDeudasPendientes)}
        </Text>
      </View>

      {/* Tabs de Préstamos y Abonos */}
      <View className="flex-row px-4 mb-3">
        <TouchableOpacity
          onPress={() => setActiveTab("prestamos")}
          className={`flex-1 py-3 mr-2 rounded-lg ${
            activeTab === "prestamos" ? "bg-white" : "bg-transparent"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "prestamos" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Préstamos ({mockPrestamosActivos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("abonos")}
          className={`flex-1 py-3 ml-2 rounded-lg ${
            activeTab === "abonos" ? "bg-white" : "bg-transparent"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "abonos" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Abonos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === "prestamos" ? (
          <>
            {/* Header de préstamos activos con filtro */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 text-sm font-medium">
                Préstamos - activos ({mockPrestamosActivos.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowFiltros(!showFiltros)}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Lista de préstamos */}
            {mockPrestamosActivos.map(renderPrestamoCard)}
          </>
        ) : (
          /* Lista de abonos */
          <View className="pb-6">
            {mockAbonos.map((abono) => (
              <View
                key={abono.id}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View className="flex-1">
                  <Text className="text-blue-600 text-xl font-bold mb-1">
                    {formatCurrencyPrestamos(abono.monto)}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    fecha de pago: {abono.fechaPago}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => console.log("Menú abono", abono.id)}
                  className="w-8 h-8 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Espaciador para el bottom bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Botón flotante para nuevo préstamo */}
      <TouchableOpacity
        onPress={() => setShowNuevoPrestamo(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#13678A] rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
        style={{
          shadowColor: "#13678A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <View className="flex-row items-center justify-around px-6 py-3">
          {/* Home */}
          <TouchableOpacity
            onPress={() => router.push("/home")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 text-xs mt-1">home</Text>
          </TouchableOpacity>

          {/* Clientes */}
          <TouchableOpacity
            onPress={() => router.push("/clientes")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 text-xs mt-1">clientes</Text>
          </TouchableOpacity>

          {/* Préstamos - activo */}
          <TouchableOpacity
            onPress={() => router.push("/prestamos_abonos")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="cash" size={24} color="#13678A" />
            <Text className="text-[#13678A] text-xs font-medium mt-1">préstamos</Text>
          </TouchableOpacity>

          {/* Reportes */}
          <TouchableOpacity
            onPress={() => router.push("/reportes")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 text-xs mt-1">reportes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Notificaciones */}
      <NotificationModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onDeleteNotification={handleDeleteNotification}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        userData={userData}
      />
    </View>
  );
}
