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
import DrawerMenu from "../../components/home/DrawerMenu";
import NotificationModal from "../../components/home/NotificationModal";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import RegistroClienteModal, { type ClienteFormData } from "../../components/clientes/RegistroClienteModal";
import ProgressBar from "../../components/clientes/ProgressBar";
import { FiltrosClienteModal, DEFAULT_CLIENTE_FILTERS, type ClienteFilters } from "../../components/clientes/FiltrosClienteModal";
import { useAuth } from "../../contexts/AuthContext";
import { getClients, createClient } from "../../services/client.service";

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
  const [showDrawer, setShowDrawer] = useState(false);
  const [showRegistroCliente, setShowRegistroCliente] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filters, setFilters] = useState<ClienteFilters>(DEFAULT_CLIENTE_FILTERS);

  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };
  const notifications: any[] = [];

  // Cargar clientes del usuario desde la BD
  const loadClientes = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const clientesData = await getClients(user.id);
      setClientes(clientesData || []);
      console.log(`✅ ${clientesData?.length || 0} clientes cargados para ${user.full_name}`);
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

  // Maneja la eliminación de notificaciones
  const handleDeleteNotification = useCallback((notificationId: string) => {
    console.log("Eliminar notificación:", notificationId);
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
  const isFiltering =
    filters.status !== 'all' ||
    filters.hasActiveLoans !== 'all' ||
    filters.registeredFrom !== null;

  // Filtrar clientes según búsqueda Y filtros
  const clientesFiltrados = clientes.filter(cliente => {
    // Búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`.toLowerCase();
      const documento = cliente.document_number?.toLowerCase() || "";
      const telefono = (cliente.phone_primary || "").toLowerCase();
      const coincide = nombreCompleto.includes(query) || documento.includes(query) || telefono.includes(query);
      if (!coincide) return false;
    }

    // Filtro por estado
    if (filters.status !== 'all' && cliente.status !== filters.status) return false;

    // Filtro por préstamos activos
    if (filters.hasActiveLoans === 'yes' && !(cliente.activeLoansCount > 0)) return false;
    if (filters.hasActiveLoans === 'no' && cliente.activeLoansCount > 0) return false;

    // Filtro por fecha de registro desde
    if (filters.registeredFrom) {
      const registrado = new Date(cliente.created_at);
      const desde = new Date(filters.registeredFrom);
      if (registrado < desde) return false;
    }

    return true;
  });

  // Navegar al detalle del cliente
  const handleClientePress = (clienteId: string) => {
    router.push(`/clientes/${clienteId}`);
  };

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
    const iniciales = `${cliente.first_name[0]}${cliente.last_name[0]}`.toUpperCase();
    const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`;

    // Función para formatear moneda
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
      }).format(amount || 0);
    };

    // Función para formatear fecha
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    // Determinar color del estado
    const getStatusColor = () => {
      switch (cliente.status) {
        case 'en-mora':
          return { bg: 'bg-red-100', text: 'En mora', textColor: 'text-red-700' };
        case 'proximo-mora':
          return { bg: 'bg-yellow-100', text: 'Próximo a vencer', textColor: 'text-yellow-700' };
        default:
          return { bg: 'bg-emerald-100', text: 'Al día', textColor: 'text-emerald-700' };
      }
    };

    const statusColor = getStatusColor();

    return (
      <TouchableOpacity
        key={cliente.id}
        onPress={() => handleClientePress(cliente.id.toString())}
        className="bg-white rounded-[20px] p-4 mb-4 border border-slate-100/60"
        activeOpacity={0.7}
        style={{
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        {/* Header de la tarjeta */}
        <View className="flex-row items-start mb-3.5">
          {/* Avatar */}
          <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-3.5 border-2 border-slate-100 shadow-sm">
            <Text className="text-white text-sm font-bold tracking-wider">
              {iniciales}
            </Text>
          </View>

          {/* Información básica */}
          <View className="flex-1 pt-0.5">
            <Text className="text-slate-800 font-bold text-[15px] mb-0.5">
              {nombreCompleto}
            </Text>
            <Text className="text-slate-500 text-[11px] mb-1.5 font-medium">
              {cliente.document_type} • {cliente.document_number}
            </Text>
            <View className="flex-row items-center bg-slate-50 self-start px-2 py-0.5 rounded-md border border-slate-100">
              <Ionicons name="call" size={10} color="#64748b" />
              <Text className="text-slate-600 text-[11px] ml-1.5 font-medium">
                {cliente.phone_primary}
              </Text>
            </View>
          </View>

          {/* Badge de estado */}
          <View className={`${statusColor.bg} px-2.5 py-1 rounded-full border border-white/50`}>
            <Text className={`${statusColor.textColor} text-[10px] font-bold uppercase tracking-wider`}>
              {statusColor.text}
            </Text>
          </View>
        </View>

        {/* Información financiera */}
        <View className="bg-slate-50/80 rounded-xl p-3.5 mb-3 border border-slate-100">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-slate-500 text-[11px] uppercase tracking-wider mb-0.5">
                Deuda Total
              </Text>
              <Text className="text-slate-800 text-sm font-bold">
                {formatCurrency(cliente.totalDebt)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-500 text-[11px] uppercase tracking-wider mb-0.5">
                Pendiente
              </Text>
              <Text className="text-red-500 text-sm font-bold">
                {formatCurrency(cliente.pendingDebt)}
              </Text>
            </View>
          </View>
          
          <View className="mt-1">
            <ProgressBar 
              percentage={cliente.totalDebt > 0 ? (cliente.totalPaid / cliente.totalDebt) * 100 : 0} 
              color="#10B981" 
            />
            <View className="flex-row justify-between mt-1.5">
               <Text className="text-slate-400 text-[10px]">Total abonado</Text>
               <Text className="text-emerald-600 font-medium text-[10px]">{formatCurrency(cliente.totalPaid)}</Text>
            </View>
          </View>
        </View>

        {/* Footer - Info adicional */}
        <View className="flex-row justify-between items-center pt-1">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-[10px] ml-1 font-medium">
              Registrado: {formatDate(cliente.created_at)}
            </Text>
          </View>

          {cliente.activeLoansCount > 0 && (
            <View className="flex-row items-center bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <Ionicons name="document-text" size={10} color="#3b82f6" />
              <Text className="text-blue-600 text-[10px] font-bold ml-1">
                {cliente.activeLoansCount} {cliente.activeLoansCount === 1 ? 'préstamo' : 'préstamos'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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

        {/* Info Card - Resumen general */}
        <View
          className="bg-[#13678A] rounded-3xl p-5 mb-6 overflow-hidden relative"
          style={{
            shadowColor: "#13678A",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          {/* Decorative background elements */}
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <View className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full" />

          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="bg-white/20 p-2 rounded-xl mr-3">
                <Ionicons name="pie-chart" size={18} color="#ffffff" />
              </View>
              <Text className="text-white/90 text-xs uppercase tracking-widest font-semibold">
                Resumen de Cartera
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="people" size={12} color="#ffffff" style={{ opacity: 0.8 }} />
                <Text className="text-white/80 text-[10px] uppercase font-bold ml-1">Total</Text>
              </View>
              <Text className="text-white text-xl font-black">{clientes.length}</Text>
            </View>

            <View className="w-px h-10 bg-white/20" />

            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="warning" size={12} color="#fca5a5" />
                <Text className="text-red-200/90 text-[10px] uppercase font-bold ml-1">En mora</Text>
              </View>
              <Text className="text-red-300 text-xl font-black">
                {clientes.filter(c => c.status === 'en-mora').length}
              </Text>
            </View>

            <View className="w-px h-10 bg-white/20" />

            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="checkmark-circle" size={12} color="#86efac" />
                <Text className="text-green-200/90 text-[10px] uppercase font-bold ml-1">Al día</Text>
              </View>
              <Text className="text-green-300 text-xl font-black">
                {clientes.filter(c => c.status === 'al-dia').length}
              </Text>
            </View>
          </View>

          <View className="items-center mt-1">
            <Text className="text-white/70 text-[11px] uppercase tracking-wider mb-1 font-medium">
              Crédito Activo (Pendiente)
            </Text>
            <Text className="text-white text-3xl font-black tracking-tight drop-shadow-md">
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
              {searchQuery.trim() ? "Resultados" : isFiltering ? "Filtrado" : "Mis Clientes"}
            </Text>
            <View className="flex-row items-center gap-2">
              {/* Contador */}
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-600 text-sm font-semibold">
                  {clientesFiltrados.length}
                </Text>
              </View>
              {/* Botón de filtros */}
              <TouchableOpacity
                onPress={() => setShowFiltros(true)}
                className="w-9 h-9 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFiltering ? "options" : "options-outline"}
                  size={22}
                  color={isFiltering ? "#13678A" : "#374151"}
                />
                {isFiltering && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#EF4444',
                      borderWidth: 1,
                      borderColor: '#F9FAFB',
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

      {/* Modal de Filtros de Clientes */}
      <FiltrosClienteModal
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onClear={() => setFilters(DEFAULT_CLIENTE_FILTERS)}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        userData={userData}
      />

      {/* Modal de Detalles del Cliente */}
      <ClientDetailsModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </View>
  );
}
