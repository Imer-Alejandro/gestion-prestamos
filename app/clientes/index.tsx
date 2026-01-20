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
import RegistroClienteModal, { type ClienteFormData } from "../../components/clientes/RegistroClienteModal";
import {
  formatCurrency,
  mockClientesMora,
  mockClientesProximosMora,
  mockResumenDeudas,
  type Cliente
} from "../../data/clientesData";
import { mockUserData, mockNotifications } from "../../data/homeData";

/**
 * Pantalla de Clientes
 * Muestra listado de clientes con su estado de deuda
 */
export default function ClientesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showRegistroCliente, setShowRegistroCliente] = useState(false);
  const userData = mockUserData;
  const notifications = mockNotifications; // Notificaciones compartidas
  
  // Maneja la eliminación de notificaciones
  const handleDeleteNotification = (notificationId: string) => {
    console.log("Eliminar notificación:", notificationId);
    // TODO: Implementar eliminación de notificación
  };

  // Maneja la búsqueda de clientes
  const handleSearch = () => {
    console.log("Buscando cliente:", searchQuery);
    // TODO: Implementar búsqueda
  };

  // Navegar al detalle del cliente
  const handleClientePress = (clienteId: string) => {
    router.push(`/clientes/${clienteId}`);
  };

  // Abrir menú de opciones del cliente
  const handleClienteMenu = (clienteId: string) => {
    console.log("Menú cliente:", clienteId);
    // TODO: Abrir menú de opciones
  };

  // Navegar a registrar nuevo cliente
  const handleNuevoCliente = () => {
    setShowRegistroCliente(true);
  };

  // Manejar registro de nuevo cliente
  const handleRegistroCliente = (clienteData: ClienteFormData) => {
    console.log("Nuevo cliente registrado:", clienteData);
    // TODO: Guardar cliente en la base de datos
    // Por ahora solo mostramos los datos en consola
  };

  // Renderizar card de cliente
  const renderClienteCard = (cliente: Cliente) => (
    <TouchableOpacity
      key={cliente.id}
      onPress={() => handleClientePress(cliente.id)}
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
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="w-12 h-12 bg-[#13678A] rounded-lg items-center justify-center mr-3">
          <Text className="text-white text-base font-bold">
            {cliente.iniciales}
          </Text>
        </View>

        {/* Información del cliente */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 text-base font-semibold flex-1">
              {cliente.nombre}
            </Text>
            <TouchableOpacity
              onPress={() => handleClienteMenu(cliente.id)}
              className="p-1"
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Badge de estado */}
          <View className="mb-3">
            <View
              className={`self-start px-3 py-1 rounded-full ${
                cliente.estado === "en-mora"
                  ? "bg-red-500"
                  : cliente.estado === "proximo-mora"
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            >
              <Text className="text-white text-xs font-semibold">
                Estado: {cliente.estado === "en-mora" ? "en mora" : cliente.estado === "proximo-mora" ? "próximo" : "al día"}
              </Text>
            </View>
          </View>

          {/* Detalles financieros */}
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-500 text-xs mb-1">
                Total de las deudas
              </Text>
              <Text className="text-gray-900 text-sm font-semibold">
                {formatCurrency(cliente.totalDeudas)}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-gray-500 text-xs mb-1">
                Total abonado
              </Text>
              <Text className="text-gray-900 text-sm font-semibold">
                {formatCurrency(cliente.totalAbonado)}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-gray-500 text-xs mb-1">
                Deuda pendiente
              </Text>
              <Text className="text-red-600 text-sm font-bold">
                {formatCurrency(cliente.deudaPendiente)}
              </Text>
            </View>
          </View>
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
        hasNotifications={mockNotifications.length > 0}
      />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Botón registrar nuevo cliente */}
        <TouchableOpacity
          onPress={handleNuevoCliente}
          className="bg-[#10B981] rounded-xl py-4 flex-row items-center justify-center mt-6 mb-4"
          activeOpacity={0.8}
          style={{
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
          <Text className="text-white font-bold text-base ml-2">
            registrar nuevo cliente
          </Text>
        </TouchableOpacity>

        {/* Total de deudas pendientes */}
        <View
          className="bg-[#13678A] rounded-2xl p-6 mb-6"
          style={{
            shadowColor: "#13678A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white/80 text-sm mb-2 text-center">
            Total de deudas pendientes
          </Text>
          <Text className="text-white text-3xl font-bold text-center">
            {formatCurrency(mockResumenDeudas.totalPendiente)}
          </Text>
        </View>

        {/* Clientes en mora */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 text-lg font-bold">
              Clientes en mora
            </Text>
            <View className="bg-red-100 px-3 py-1 rounded-full">
              <Text className="text-red-600 text-sm font-semibold">
                {mockClientesMora.length}
              </Text>
            </View>
          </View>
          {mockClientesMora.map(cliente => renderClienteCard(cliente))}
        </View>

        {/* Clientes próximos a mora */}
        <View className="mb-24">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 text-lg font-bold">
              Clientes próximos a mora
            </Text>
            <View className="bg-yellow-100 px-3 py-1 rounded-full">
              <Text className="text-yellow-600 text-sm font-semibold">
                {mockClientesProximosMora.length}
              </Text>
            </View>
          </View>
          {mockClientesProximosMora.map(cliente => renderClienteCard(cliente))}
        </View>
      </ScrollView>

      {/* Botón flotante de agregar */}
      <TouchableOpacity
        onPress={handleNuevoCliente}
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
        <Ionicons name="add" size={32} color="#ffffff" />
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
            <Ionicons name="people" size={24} color="#13678A" />
            <Text className="text-[#13678A] text-xs font-medium mt-1">
              clientes
            </Text>
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

      {/* Modal de Registro de Cliente */}
      <RegistroClienteModal
        visible={showRegistroCliente}
        onClose={() => setShowRegistroCliente(false)}
        onSubmit={handleRegistroCliente}
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
