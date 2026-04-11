import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import DrawerMenu from "../../components/home/DrawerMenu";
import NotificationModal from "../../components/home/NotificationModal";
import { PrestamoCard } from "../../components/prestamos_abonos/PrestamoCard";
import { AbonoCard } from "../../components/prestamos_abonos/AbonoCard";
import { NuevoPrestamoModal } from "../../components/prestamos_abonos/NuevoPrestamoModal";
import  RegistroAbonoModal  from "../../components/prestamos_abonos/RegistroAbonoModal";
import { DetallesPrestamoModal } from "../../components/prestamos_abonos/DetallesPrestamoModal";
import {
  formatCurrencyPrestamos,
  type Prestamo
} from "../../data/prestamosData";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";

// Importar servicios
import { getAllUserLoans, createLoan } from "../../services/loan.service";
import { createPayment } from "../../services/payment.service";
import { getClients } from "../../services/client.service";

/**
 * Pantalla de Préstamos y Abonos
 * Muestra listado de préstamos activos y abonos realizados
 */
export default function PrestamosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Obtiene el espacio seguro de Android/iOS
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNuevoPrestamo, setShowNuevoPrestamo] = useState(false);
  const [showRegistroAbono, setShowRegistroAbono] = useState(false);
  const [showDetallesPrestamo, setShowDetallesPrestamo] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);

  // Estado de datos
  const [loans, setLoans] = useState<Prestamo[]>([]);
  const [abonos, setAbonos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };

  const [activeTab, setActiveTab] = useState<"prestamos" | "abonos">("prestamos");
  const [showFiltros, setShowFiltros] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterFrequency, setFilterFrequency] = useState<string>("todos");
  const [filterNearDue, setFilterNearDue] = useState<boolean>(false);
  const [filterDateBase, setFilterDateBase] = useState<string>("todos");

  const notifications = mockNotifications;

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [loansData, clientsData] = await Promise.all([
        getAllUserLoans(user!.id),
        getClients(user!.id)
      ]);

      // Transformar datos de loans al formato Prestamo
      const transformedLoans: Prestamo[] = loansData.map((loan: any) => ({
        id: loan.id.toString(),
        clienteId: loan.client_id.toString(),
        clienteNombre: clientsData.find((c: any) => c.id === loan.client_id)?.first_name + ' ' +
                      clientsData.find((c: any) => c.id === loan.client_id)?.last_name || 'Cliente',
        clienteIniciales: (clientsData.find((c: any) => c.id === loan.client_id)?.first_name?.[0] || '') +
                         (clientsData.find((c: any) => c.id === loan.client_id)?.last_name?.[0] || ''),
        totalPrestamo: loan.principal_amount,
        totalAbonado: loan.total_paid,
        deudaPendiente: loan.current_balance,
        deudaPendientePorcentaje: loan.current_balance / loan.principal_amount,
        cuotas: loan.installments,
        estado: loan.status === 'active' ? 'activo' as const :
               loan.status === 'completed' ? 'completado' as const : 'mora' as const,
        fechaCreacion: loan.created_at,
        frecuenciaPago: loan.payment_frequency || "monthly",
        fechaVencimiento: loan.due_date || "",
      }));

      setLoans(transformedLoans);
      setClients(clientsData);
      setAbonos([]); // TODO: Implementar obtener abonos
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  // Calcular total de deudas pendientes
  const totalDeudasPendientes = loans.reduce(
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

  // Filtrar préstamos por búsqueda y filtros
  const filteredLoans = loans.filter(loan => {
    // Búsqueda por texto
    if (searchQuery && !loan.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) && !loan.id.includes(searchQuery)) return false;

    // Filtro por estado
    if (filterStatus !== "todos" && loan.estado !== filterStatus) return false;

    // Filtro por frecuencia
    if (filterFrequency !== "todos" && loan.frecuenciaPago !== filterFrequency) return false;

    // Filtro próximos a vencer (próximos 7 días)
    if (filterNearDue) {
      if (loan.estado !== "activo") return false; // Solo activos pueden "vencer pronto" en este caso
      const dueDate = new Date(loan.fechaVencimiento);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > 7) return false;
    }

    // Filtro por fecha de creación
    if (filterDateBase !== "todos") {
      const creationDate = new Date(loan.fechaCreacion);
      const today = new Date();
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      if (filterDateBase === "esteMes" && creationDate < firstDayThisMonth) return false;
      if (filterDateBase === "anteriores" && creationDate >= firstDayThisMonth) return false;
    }

    return true;
  });

  // Navegar al detalle del préstamo
  const handlePrestamoPress = (prestamoId: string) => {
    const prestamo = loans.find(p => p.id === prestamoId);
    if (prestamo) {
      setSelectedPrestamo(prestamo);
      setShowDetallesPrestamo(true);
    }
  };

  // Abrir menú de opciones del préstamo
  const handlePrestamoMenu = (prestamoId: string) => {
    Alert.alert(
      "Opciones del Préstamo",
      "¿Qué acción deseas realizar?",
      [
        { text: "Ver Detalles", onPress: () => handlePrestamoPress(prestamoId) },
        { text: "Registrar Pago", onPress: () => {
          const prestamo = loans.find(p => p.id === prestamoId);
          if (prestamo) {
            setSelectedPrestamo(prestamo);
            setShowRegistroAbono(true);
          }
        }},
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // Registrar pago/abono
  const handleRegisterPayment = async (paymentData: any) => {
    try {
      console.log('📋 Datos del pago:', paymentData);

      if (!user?.id) {
        Alert.alert('Error', 'Usuario no identificado');
        return;
      }

      if (!paymentData.loan_id) {
        Alert.alert('Error', 'Préstamo no identificado');
        return;
      }

      const dataToSave = {
        ...paymentData,
        user_id: user.id,
      };

      console.log('💾 Guardando:', dataToSave);
      await createPayment(dataToSave);

      Alert.alert('Éxito', 'Pago registrado correctamente');
      await loadData();
      setShowRegistroAbono(false);
      setShowDetallesPrestamo(false);
    } catch (error: any) {
      console.error('❌ Error registrando pago:', error);
      Alert.alert('Error', error.message || 'No se pudo registrar el pago');
    }
  };

  // Crear nuevo préstamo
  const handleCreateLoan = async (loanData: any) => {
    try {
      await createLoan({ ...loanData, user_id: user!.id });
      await loadData(); // Recargar datos
      setShowNuevoPrestamo(false);
    } catch (error) {
      console.error("Error creando préstamo:", error);
      // TODO: Mostrar error al usuario
    }
  };

  // Renderizar card de préstamo
  const renderPrestamoCard = (prestamo: Prestamo) => (
    <PrestamoCard
      key={prestamo.id}
      prestamo={prestamo}
      onPress={() => handlePrestamoPress(prestamo.id)}
      onMenuPress={() => handlePrestamoMenu(prestamo.id)}
    />
  );

  // Renderizar card de abono
  const renderAbonoCard = (abono: any) => (
    <AbonoCard
      key={abono.id}
      abono={abono}
    />
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
      <View className="bg-[#13678A] mx-4 mt-4 mb-3 rounded-2xl p-6 shadow-md"
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
            Préstamos ({filteredLoans.length})
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
                Préstamos {filterStatus !== "todos" ? `- ${filterStatus}` : ""} ({filteredLoans.length})
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
            {filteredLoans.map(renderPrestamoCard)}
          </>
        ) : (
          /* Lista de abonos */
          <View className="pb-6">
            {abonos.map(renderAbonoCard)}
          </View>
        )}

        {/* Espaciador para el bottom bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Botón flotante para nuevo préstamo */}
      <TouchableOpacity
        onPress={() => setShowNuevoPrestamo(true)}
        className="absolute bottom-32 right-6 w-14 h-14 bg-[#13678A] rounded-full items-center justify-center shadow-lg"
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

      {/* Bottom Navigation Bar - Respeta la barra de navegación del sistema en Android */}
      <View
        className="bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: insets.bottom - 14}} // Agrega padding respetando la barra del sistema
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

      {/* Modal Nuevo Préstamo */}
      <NuevoPrestamoModal
        visible={showNuevoPrestamo}
        onClose={() => setShowNuevoPrestamo(false)}
        onSave={handleCreateLoan}
        clients={clients}
      />

      {/* Modal Detalles Préstamo */}
      <DetallesPrestamoModal
        visible={showDetallesPrestamo}
        onClose={() => setShowDetallesPrestamo(false)}
        loanId={selectedPrestamo ? parseInt(selectedPrestamo.id) : undefined}
        onRegisterPayment={(loanId) => {
          const prestamo = loans.find(p => p.id === loanId.toString());
          if (prestamo) {
            setSelectedPrestamo(prestamo);
            setShowRegistroAbono(true);
          }
        }}
      />

      {/* Modal Registro Abono */}
      <RegistroAbonoModal
        visible={showRegistroAbono}
        onClose={() => setShowRegistroAbono(false)}
        onSave={handleRegisterPayment}
        loanId={selectedPrestamo ? parseInt(selectedPrestamo.id) : undefined}
        maxAmount={selectedPrestamo?.deudaPendiente}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        userData={userData}
      />

      {/* Modal de Filtros */}
      <Modal
        visible={showFiltros}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltros(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity 
            className="absolute inset-0 bg-black/30" 
            activeOpacity={1} 
            onPress={() => setShowFiltros(false)} 
          />
          <View className="bg-white rounded-t-3xl p-6 shadow-xl h-4/5 pt-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Filtrar Préstamos</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* Estado */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">Estado</Text>
              <View className="flex-row flex-wrap mb-5">
                {['todos', 'activo', 'mora', 'completado'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilterStatus(status)}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${filterStatus === status ? 'bg-[#13678A] border-[#13678A]' : 'bg-white border-gray-300'}`}
                  >
                    <Text className={`capitalize ${filterStatus === status ? 'text-white font-semibold' : 'text-gray-600'}`}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Frecuencia de Pago */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">Frecuencia de Pago</Text>
              <View className="flex-row flex-wrap mb-5">
                {['todos', 'daily', 'weekly', 'biweekly', 'monthly'].map((freq) => {
                  const labels: Record<string, string> = {
                    todos: 'Todos', daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual'
                  };
                  return (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setFilterFrequency(freq)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-full border ${filterFrequency === freq ? 'bg-[#13678A] border-[#13678A]' : 'bg-white border-gray-300'}`}
                    >
                      <Text className={`${filterFrequency === freq ? 'text-white font-semibold' : 'text-gray-600'}`}>
                        {labels[freq]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Fecha de Creación */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">Fecha de Creación</Text>
              <View className="flex-row flex-wrap mb-5">
                {['todos', 'esteMes', 'anteriores'].map((dateBase) => {
                  const labels: Record<string, string> = {
                    todos: 'Todos', esteMes: 'Este Mes', anteriores: 'Meses Anteriores'
                  };
                  return (
                    <TouchableOpacity
                      key={dateBase}
                      onPress={() => setFilterDateBase(dateBase)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-full border ${filterDateBase === dateBase ? 'bg-[#13678A] border-[#13678A]' : 'bg-white border-gray-300'}`}
                    >
                      <Text className={`${filterDateBase === dateBase ? 'text-white font-semibold' : 'text-gray-600'}`}>
                        {labels[dateBase]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Próximos a Vencer */}
              <TouchableOpacity
                onPress={() => setFilterNearDue(!filterNearDue)}
                className={`flex-row justify-between items-center p-4 rounded-xl border mb-8 mt-2 ${filterNearDue ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}
              >
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={20} color={filterNearDue ? '#F59E0B' : '#9CA3AF'} />
                  <Text className={`ml-2 font-medium ${filterNearDue ? 'text-orange-700' : 'text-gray-700'}`}>
                    Próximos a vencer (7 días)
                  </Text>
                </View>
                <View className={`w-6 h-6 rounded-md border items-center justify-center ${filterNearDue ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-gray-300'}`}>
                  {filterNearDue && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </TouchableOpacity>

            </ScrollView>

            <View className="flex-row border-t border-gray-100 pt-5 pb-6">
              <TouchableOpacity
                className="flex-1 py-4 px-4 mr-2 bg-gray-100 rounded-xl items-center"
                onPress={() => {
                  setFilterStatus('todos');
                  setFilterFrequency('todos');
                  setFilterNearDue(false);
                  setFilterDateBase('todos');
                }}
              >
                <Text className="text-gray-700 font-semibold text-base">Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] py-4 px-4 ml-2 bg-[#10B981] rounded-xl items-center shadow-sm"
                onPress={() => setShowFiltros(false)}
              >
                <Text className="text-white font-bold text-base">Ver Resultados ({filteredLoans.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}