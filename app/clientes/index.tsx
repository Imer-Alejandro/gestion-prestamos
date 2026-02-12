import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
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
import RegistroClienteModal, { type ClienteFormData } from "../../components/clientes/RegistroClienteModal";
import { useAuth } from "../../contexts/AuthContext";
import { getClients, createClient } from "../../services/client.service";

/**
 * Pantalla de Clientes
 * Muestra listado de clientes del usuario logueado
 */
export default function ClientesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showRegistroCliente, setShowRegistroCliente] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Maneja la búsqueda de clientes
  const handleSearch = () => {
    console.log("Buscando cliente:", searchQuery);
  };

  // Filtrar clientes según búsqueda
  const clientesFiltrados = searchQuery.trim() 
    ? clientes.filter(cliente => {
        const query = searchQuery.toLowerCase();
        const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`.toLowerCase();
        const documento = cliente.document_number?.toLowerCase() || "";
        const telefono = cliente.phones?.[0]?.number || "";
        
        return nombreCompleto.includes(query) || 
               documento.includes(query) || 
               telefono.includes(query);
      })
    : clientes;

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
        address_line: clienteData.direccion || null,
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
      Alert.alert("Error", error.message || "No se pudo registrar el cliente");
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
          return { bg: 'bg-red-500', text: 'En mora' };
        case 'proximo-mora':
          return { bg: 'bg-yellow-500', text: 'Próximo a vencer' };
        default:
          return { bg: 'bg-green-500', text: 'Al día' };
      }
    };

    const statusColor = getStatusColor();
    
    return (
      <TouchableOpacity
        key={cliente.id}
        onPress={() => handleClientePress(cliente.id.toString())}
        className="bg-white rounded-2xl p-4 mb-3"
        activeOpacity={0.7}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Header de la tarjeta */}
        <View className="flex-row items-start mb-3">
          {/* Avatar */}
          <View className="w-12 h-12 bg-[#13678A] rounded-lg items-center justify-center mr-3">
            <Text className="text-white text-base font-bold">
              {iniciales}
            </Text>
          </View>

          {/* Información básica */}
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base mb-1">
              {nombreCompleto}
            </Text>
            <Text className="text-gray-500 text-xs mb-2">
              {cliente.document_type} {cliente.document_number}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={14} color="#6B7280" />
              <Text className="text-gray-600 text-xs ml-1">
                {cliente.phone_primary}
              </Text>
            </View>
          </View>

          {/* Badge de estado */}
          <View className={`${statusColor.bg} px-3 py-1 rounded-full`}>
            <Text className="text-white text-xs font-semibold">
              {statusColor.text}
            </Text>
          </View>
        </View>

        {/* Información financiera */}
        <View className="bg-gray-50 rounded-lg p-3 mb-2">
          <View className="flex-row justify-between mb-2">
            <View className="flex-1">
              <Text className="text-gray-500 text-xs mb-1">
                Total deuda
              </Text>
              <Text className="text-gray-900 text-sm font-semibold">
                {formatCurrency(cliente.totalDebt)}
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-xs mb-1">
                Total abonado
              </Text>
              <Text className="text-green-600 text-sm font-semibold">
                {formatCurrency(cliente.totalPaid)}
              </Text>
            </View>

            <View className="flex-1 items-end">
              <Text className="text-gray-500 text-xs mb-1">
                Pendiente
              </Text>
              <Text className="text-red-600 text-sm font-bold">
                {formatCurrency(cliente.pendingDebt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer - Info adicional */}
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">
              Registrado: {formatDate(cliente.created_at)}
            </Text>
          </View>
          
          {cliente.activeLoansCount > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={14} color="#13678A" />
              <Text className="text-[#13678A] text-xs font-medium ml-1">
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
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        hasNotifications={notifications.length > 0}
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
          className={`bg-[#10B981] rounded-xl py-4 flex-row items-center justify-center mt-6 mb-4 ${
            isLoading ? "opacity-50" : ""
          }`}
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

        {/* Info Card - Resumen general */}
        <View
          className="bg-[#13678A] rounded-2xl p-5 mb-6"
          style={{
            shadowColor: "#13678A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white/80 text-sm mb-4 text-center">
            Resumen de cartera
          </Text>
          
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/80 text-xs mb-1">Total clientes</Text>
              <Text className="text-white text-2xl font-bold">{clientes.length}</Text>
            </View>
            
            <View className="w-px bg-white/20" />
            
            <View className="flex-1 items-center">
              <Text className="text-white/80 text-xs mb-1">En mora</Text>
              <Text className="text-red-300 text-2xl font-bold">
                {clientes.filter(c => c.status === 'en-mora').length}
              </Text>
            </View>
            
            <View className="w-px bg-white/20" />
            
            <View className="flex-1 items-end">
              <Text className="text-white/80 text-xs mb-1">Al día</Text>
              <Text className="text-green-300 text-2xl font-bold">
                {clientes.filter(c => c.status === 'al-dia').length}
              </Text>
            </View>
          </View>

          <View className="border-t border-white/20 pt-3 mt-2">
            <Text className="text-white/80 text-xs mb-1 text-center">
              Deuda total pendiente
            </Text>
            <Text className="text-white text-xl font-bold text-center">
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
              {searchQuery.trim() ? "Resultados" : "Mis Clientes"}
            </Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-sm font-semibold">
                {clientesFiltrados.length}
              </Text>
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
