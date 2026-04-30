import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import NotificationModal from "../../components/home/NotificationModal";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import RegistroClienteModal, { type ClienteFormData } from "../../components/clientes/RegistroClienteModal";
import ProgressBar from "../../components/clientes/ProgressBar";
import { useAuth } from "../../contexts/AuthContext";
import { getClients, createClient, deactivateClient } from "../../services/client.service";
import { FiltrosClienteModal, type ClienteFilters, DEFAULT_CLIENTE_FILTERS } from "../../components/clientes/FiltrosClienteModal";
import { ClienteCard } from "../../components/clientes/ClienteCard";

/**
 * Pantalla de Clientes
 * Muestra listado de clientes del usuario logueado
 */
export default function ClientesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Obtiene el espacio seguro de Android/iOS
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRegistroCliente, setShowRegistroCliente] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filters, setFilters] = useState<ClienteFilters>(DEFAULT_CLIENTE_FILTERS);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };
  const [notifications, setNotifications] = useState<any[]>([]);

  // Cargar clientes del usuario desde la BD
  const loadClientes = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const clientesData = await getClients(user.id);
      setClientes(clientesData || []);

      // Cargar notificaciones reales
      const { getPendingNotificationsUI } = await import("../../services/notification.service");
      const uiNotifications = await getPendingNotificationsUI(user.id);
      setNotifications(uiNotifications);

      console.log(`✅ ${clientesData?.length || 0} clientes cargados`);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      Alert.alert("Error", "No se pudieron cargar los clientes");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    if (user) {
      loadClientes();
    }
  }, [user, loadClientes]);

  // Refrescar clientes
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientes();
    setRefreshing(false);
  };

  // Maneja la eliminación de notificaciones de forma persistente
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { dismissNotification, getPendingNotificationsUI } = await import("../../services/notification.service");
      await dismissNotification(notificationId);
      const updated = await getPendingNotificationsUI(user?.id || 0);
      setNotifications(updated);
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  }, []);

  // Maneja la búsqueda de clientes (Overlay)
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearchActive(text.length > 0);
  };

  const handleSearch = () => {
    if (searchQuery.length > 0) setIsSearchActive(true);
  };

  const handleResultPress = (client: any) => {
    setIsSearchActive(false);
    setSearchQuery("");
    setSelectedClient(client);
  };

  // Determinar si hay filtros activos
  const isFiltering = filters.status !== 'all' ||
    filters.hasActiveLoans !== 'all' ||
    filters.registeredFrom !== null;

  // Filtrar clientes según búsqueda y filtros
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`.toLowerCase();
      const documento = cliente.document_number?.toLowerCase() || "";
      const telefono = cliente.phone_primary?.toLowerCase() || cliente.phones?.[0]?.number || "";

      const matchSearch = nombreCompleto.includes(query) ||
        documento.includes(query) ||
        telefono.includes(query);

      if (!matchSearch) return false;
    }

    // Filtro por estado
    if (filters.status !== 'all') {
      const statusToMatch = !cliente.status ? 'al-dia' : cliente.status;
      if (statusToMatch !== filters.status) return false;
    }

    // Filtro por préstamos activos
    if (filters.hasActiveLoans !== 'all') {
      const hasLoans = (cliente.activeLoansCount || 0) > 0;
      if (filters.hasActiveLoans === 'yes' && !hasLoans) return false;
      if (filters.hasActiveLoans === 'no' && hasLoans) return false;
    }

    // Filtro por fecha de registro desde
    if (filters.registeredFrom) {
      const clientDate = new Date(cliente.created_at);
      const filterDate = new Date(filters.registeredFrom);
      clientDate.setHours(0, 0, 0, 0);
      filterDate.setHours(0, 0, 0, 0);

      if (clientDate < filterDate) return false;
    }

    return true;
  });

  // Abrir detalle del cliente en el modal (mismo componente que en búsqueda)
  const handleClientePress = useCallback((clienteId: string) => {
    const cliente = clientes.find(c => c.id.toString() === clienteId);
    if (cliente) {
      setSelectedClient(cliente);
    }
  }, [clientes]);

  // Desactivar cliente (soft delete)
  const handleDeactivateClient = useCallback(async (clienteId: string, activeLoansCount: number) => {
    if (activeLoansCount > 0) {
      // Por si la validación falla antes
      Alert.alert(
        "Acción denegada",
        "No puedes anular un cliente con préstamos activos. Por favor salda o anula sus préstamos primero."
      );
      return;
    }

    try {
      setIsLoading(true);
      await deactivateClient(clienteId);
      
      // Recargar la lista local
      setClientes(prev => prev.filter(c => c.id.toString() !== clienteId));
      
      Alert.alert("Éxito", "El cliente ha sido anulado correctamente.");
    } catch (error) {
      console.error("Error anulando cliente:", error);
      Alert.alert("Error", "Ocurrió un problema al anular el cliente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Navegar a registrar nuevo cliente
  const handleNuevoCliente = () => {
    setShowRegistroCliente(true);
  };

  // Manejar registro de nuevo cliente
  const handleRegistroCliente = async (clienteData: ClienteFormData) => {
    if (!user) {
      Alert.alert("Error", "Debes estar logueado para registrar clientes");
      return;
    }

    try {
      setIsLoading(true);

      // Separar nombre completo en nombre y apellido
      const nombres = clienteData.nombreCompleto.trim().split(" ");
      const firstName = nombres[0];
      const lastName = nombres.slice(1).join(" ") || firstName;

      // Preparar datos para el service
      const nuevoCliente = {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        document_type: clienteData.tipoDocumento,
        document_number: clienteData.numeroDocumento,
        phone_primary: clienteData.celularWhatsapp,
        phone_secondary: clienteData.telefonoCasa || null,
        email: clienteData.email || null,
        address_line: clienteData.direccion || "",
        city: clienteData.municipio || null,
        province: clienteData.provincia || null,
        country: clienteData.nacionalidad || null,
        birth_date: clienteData.fechaNacimiento || null,
        gender: clienteData.sexo || null,
        occupation: clienteData.ocupacion || null,
        workplace: clienteData.direccionTrabajo || null,
        monthly_income: clienteData.ingresos ? parseFloat(clienteData.ingresos) : null,
        reference_name: clienteData.recomendadoPor || null,
        reference_phone: clienteData.telefonoOtro || null,
        signature_svg: clienteData.firma || null,
        notes: clienteData.nota || null,
        credit_limit: 0,
      };

      const clienteId = await createClient(nuevoCliente);
      console.log("✅ Cliente creado con ID:", clienteId);

      const nombreCompleto = `${firstName} ${lastName}`;

      Alert.alert(
        "Éxito",
        `Cliente registrado correctamente\n\n${nombreCompleto}\n${clienteData.tipoDocumento}: ${clienteData.numeroDocumento}`
      );

      // Recargar lista de clientes
      await loadClientes();

    } catch (error: any) {
      console.error("Error registrando cliente:", error);

      const errorMsg = error.message || "";
      if (errorMsg.includes("UNIQUE constraint failed: clients.document_number")) {
        Alert.alert(
          "Documento duplicado",
          "El número de documento que ingresaste ya se encuentra registrado para otro cliente."
        );
      } else {
        Alert.alert("Error", errorMsg || "No se pudo registrar el cliente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar card de cliente
  const renderClienteCard = (cliente: any) => {
    return (
      <ClienteCard
        key={cliente.id}
        cliente={cliente}
        onPress={() => handleClientePress(cliente.id.toString())}
        onVoid={handleDeactivateClient}
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      {/* Header compartido */}
      <AppHeader
        userData={userData}
        userId={user?.id}
        onNotificationsPress={() => setShowNotifications(true)}
        onProfilePress={() => router.push("/configuracion")}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearch}
        hasNotifications={notifications.length > 0}
      />

      <SearchResultsOverlay
        isVisible={isSearchActive}
        results={clientesFiltrados}
        onClose={() => setIsSearchActive(false)}
        onResultPress={handleResultPress}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Botón registrar nuevo cliente */}
        <TouchableOpacity
          onPress={handleNuevoCliente}
          disabled={isLoading}
          className={`bg-[#10B981] rounded-2xl py-4 flex-row items-center justify-center mt-6 mb-5 ${isLoading ? "opacity-50" : ""
            }`}
          activeOpacity={0.8}
          style={{
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Ionicons name="person-add" size={20} color="#ffffff" />
          <Text className="text-white font-bold text-sm ml-2 uppercase tracking-wide">
            Registrar Nuevo Cliente
          </Text>
        </TouchableOpacity>

        {/* Info Card - Resumen de Cartera (Versión Compacta) */}
        <View
          className="bg-[#13678A] rounded-3xl p-4 mb-4 overflow-hidden relative"
          style={{
            shadowColor: "#13678A",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Decorative background elements */}
          <View className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full" />
          <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full" />

          <View className="flex-row items-center mb-3">
            <View className="bg-white/20 p-1.5 rounded-lg mr-2">
              <Ionicons name="pie-chart" size={14} color="#ffffff" />
            </View>
            <Text className="text-white/90 text-[10px] uppercase tracking-widest font-bold">
              Resumen de Cartera
            </Text>
          </View>

          <View className="flex-row justify-between items-center bg-white/10 rounded-xl p-3 mb-3 border border-white/10">
            <View className="items-center flex-1">
              <Text className="text-white/80 text-[9px] uppercase font-bold mb-0.5">Total</Text>
              <Text className="text-white text-lg font-black">{clientes.length}</Text>
            </View>

            <View className="w-px h-8 bg-white/20" />

            <View className="items-center flex-1">
              <Text className="text-red-200/90 text-[9px] uppercase font-bold mb-0.5">En mora</Text>
              <Text className="text-red-300 text-lg font-black">
                {clientes.filter(c => c.status === 'en-mora').length}
              </Text>
            </View>

            <View className="w-px h-8 bg-white/20" />

            <View className="items-center flex-1">
              <Text className="text-green-200/90 text-[9px] uppercase font-bold mb-0.5">Al día</Text>
              <Text className="text-green-300 text-lg font-black">
                {clientes.filter(c => c.status === 'al-dia').length}
              </Text>
            </View>
          </View>

          <View className="items-center">
            <Text className="text-white/70 text-[10px] uppercase tracking-wider font-medium">
              Crédito Activo (Pendiente)
            </Text>
            <Text className="text-white text-2xl font-black tracking-tight">
              {new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency: 'DOP',
              }).format(clientes.reduce((sum, c) => sum + (c.pendingDebt || 0), 0))}
            </Text>
          </View>
        </View>

        {/* Lista de clientes */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 text-lg font-bold">
              {searchQuery.trim() || isFiltering ? "Resultados" : "Mis Clientes"}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                <Text className="text-blue-600 text-sm font-semibold">
                  {clientesFiltrados.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFiltros(true)}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFiltering ? "options" : "options-outline"}
                  size={24}
                  color={isFiltering ? "#13678A" : "#374151"}
                />
                {isFiltering && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#EF4444',
                      borderWidth: 1,
                      borderColor: '#F9FAFB'
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isLoading && clientes.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-gray-400">Cargando clientes...</Text>
            </View>
          ) : clientesFiltrados.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">
                {searchQuery.trim()
                  ? "No se encontraron clientes"
                  : "No tienes clientes registrados"}
              </Text>
              <Text className="text-gray-400 text-sm mt-2">
                {searchQuery.trim()
                  ? "Intenta con otro término de búsqueda"
                  : "Presiona el botón verde para agregar tu primer cliente"}
              </Text>
            </View>
          ) : (
            clientesFiltrados.map(renderClienteCard)
          )}
        </View>

        {/* Espaciador para el bottom bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Navigation Bar - Respeta la barra de navegación del sistema en Android */}
      <View
        className="bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: insets.bottom - 14 }} // Agrega padding respetando la barra del sistema
      >
        <View className="flex-row items-center justify-around px-6 py-3">
          {/* Home */}
          <TouchableOpacity
            onPress={() => router.push("/home")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 text-xs mt-1">inicio</Text>
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

      {/* Modal de Filtros de Cliente */}
      <FiltrosClienteModal
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onClear={() => setFilters(DEFAULT_CLIENTE_FILTERS)}
      />

      {/* Modal de Detalles del Cliente */}
      <ClientDetailsModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onRefresh={loadClientes}
      />
    </View>
  );
}
