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
  mockDailyTotals,
  mockNotifications,
  mockOperations,
  mockUserData
} from "../../data/homeData";

/**
 * Dashboard/Home Principal
 * Pantalla principal de la aplicación que muestra:
 * - Header con perfil de usuario
 * - Buscador de clientes
 * - Banner de promociones
 * - Resumen de totales (préstamos y abonos)
 * - Historial de operaciones recientes
 * - Bottom navigation bar
 */

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Datos de ejemplo - en producción vendrían del backend
  const userData = mockUserData;
  const notifications = mockNotifications;
  const operations = mockOperations;
  const dailyTotals = mockDailyTotals;

  // Maneja la búsqueda de clientes
  const handleSearch = () => {
    console.log("Buscando:", searchQuery);
    // TODO: Implementar búsqueda
  };

  // Navega al detalle de una operación
  const handleOperationPress = (operationId: string) => {
    console.log("Ver operación:", operationId);
    // TODO: Navegar al detalle
  };

  // Eliminar notificación
  const handleDeleteNotification = (notificationId: string) => {
    console.log("Eliminar notificación:", notificationId);
    // TODO: Implementar eliminación de notificación
  };

  // Navegar a nuevo abono
  const handleNuevoAbono = () => {
    setShowQuickActions(false);
    console.log("Navegar a nuevo abono");
    // TODO: Implementar navegación a nuevo abono
  };

  // Navegar a nuevo préstamo
  const handleNuevoPrestamo = () => {
    setShowQuickActions(false);
    console.log("Navegar a nuevo préstamo");
    // TODO: Implementar navegación a nuevo préstamo
  };

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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Banner de Promociones */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-gray-800 text-base font-semibold mb-3">
            Promociones
          </Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Ilustración de promociones */}
            <View className="items-center py-6">
              <View className="bg-[#13678A]/10 rounded-full p-6 mb-3">
                <Ionicons name="megaphone" size={48} color="#13678A" />
              </View>
              <Text className="text-gray-600 text-xs text-center">
                Aquí aparecerán las promociones activas
              </Text>
            </View>
          </View>
        </View>

        {/* Estado de hoy - Totales */}
        <View className="px-6 pb-4">
          <Text className="text-gray-800 text-base font-semibold mb-3">
            Estado de hoy
          </Text>
          <View className="flex-row gap-3">
            {/* Card Total de préstamos */}
            <View className="flex-1 bg-[#13678A] rounded-2xl p-5 shadow-md">
              <Text className="text-white/80 text-xs mb-2">
                Total de préstamos
              </Text>
              <Text className="text-white text-3xl font-bold">
                {dailyTotals.loans}
              </Text>
            </View>

            {/* Card Total de abonos */}
            <View className="flex-1 bg-[#0D8A7A] rounded-2xl p-5 shadow-md">
              <Text className="text-white/80 text-xs mb-2">
                Total de abonos
              </Text>
              <Text className="text-white text-3xl font-bold">
                {dailyTotals.payments}
              </Text>
            </View>
          </View>
        </View>

        {/* Historial de operaciones */}
        <View className="px-6 pb-24">
          <Text className="text-gray-800 text-base font-semibold mb-3">
            Historial de operaciones
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {operations.map((operation, index) => (
              <TouchableOpacity
                key={operation.id}
                onPress={() => handleOperationPress(operation.id)}
                className={`flex-row items-center px-4 py-4 ${
                  index !== operations.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
                activeOpacity={0.7}
              >
                {/* Icono de operación */}
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                    operation.type === "prestamo"
                      ? "bg-[#13678A]"
                      : "bg-[#0D8A7A]"
                  }`}
                >
                  <Ionicons
                    name={
                      operation.type === "prestamo"
                        ? "arrow-up"
                        : "arrow-down"
                    }
                    size={24}
                    color="#ffffff"
                  />
                </View>

                {/* Información de la operación */}
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-bold mb-0.5">
                    {operation.amount}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {operation.clientName}
                  </Text>
                </View>

                {/* Hora */}
                <Text className="text-gray-400 text-xs">
                  {operation.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción rápida flotantes */}
      {showQuickActions && (
        <>
          {/* Overlay para cerrar */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowQuickActions(false)}
            className="absolute inset-0 bg-black/20"
          />

          {/* Botón Nuevo Abono */}
          <TouchableOpacity
            onPress={handleNuevoAbono}
            className="absolute bottom-[220px] right-6 bg-[#10B981] rounded-full px-6 py-3 flex-row items-center shadow-lg"
            activeOpacity={0.8}
            style={{
              shadowColor: "#10B981",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="arrow-down-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">
              nuevo abono
            </Text>
          </TouchableOpacity>

          {/* Botón Nuevo Préstamo */}
          <TouchableOpacity
            onPress={handleNuevoPrestamo}
            className="absolute bottom-[160px] right-6 bg-[#0EA5E9] rounded-full px-6 py-3 flex-row items-center shadow-lg"
            activeOpacity={0.8}
            style={{
              shadowColor: "#0EA5E9",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="arrow-up-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">
              nuevo prestamo
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Botón flotante de agregar */}
      <TouchableOpacity
        onPress={() => setShowQuickActions(!showQuickActions)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#13678A] rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
        style={{
          shadowColor: "#13678A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons 
          name={showQuickActions ? "close" : "add"} 
          size={32} 
          color="#ffffff" 
        />
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
            <Ionicons name="home" size={24} color="#13678A" />
            <Text className="text-[#13678A] text-xs font-medium mt-1">
              home
            </Text>
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

          {/* Préstamos */}
          <TouchableOpacity
            onPress={() => router.push("/prestamos_abonos")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="cash-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 text-xs mt-1">préstamos</Text>
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
