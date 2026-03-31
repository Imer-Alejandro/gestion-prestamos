import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import DrawerMenu from "../../components/home/DrawerMenu";
import NotificationModal from "../../components/home/NotificationModal";
import { PrestamoCard } from "../../components/prestamos_abonos/PrestamoCard";
import { AbonoCard } from "../../components/prestamos_abonos/AbonoCard";
import { NuevoPrestamoModal } from "../../components/prestamos_abonos/NuevoPrestamoModal";
import { RegistroAbonoModal } from "../../components/prestamos_abonos/RegistroAbonoModal";
import { DetallesPrestamoModal } from "../../components/prestamos_abonos/DetallesPrestamoModal";
import {
  formatCurrencyPrestamos,
  type Prestamo
} from "../../data/prestamosData";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";

// Importar servicios
import { getLoansByStatus, createLoan } from "../../services/loan.service";
import { createPayment } from "../../services/payment.service";
import { getClients } from "../../services/client.service";

/**
 * Pantalla de Préstamos y Abonos
 * Muestra listado de préstamos activos y abonos realizados
 */
export default function PrestamosScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
        getLoansByStatus(user!.id, 'active'),
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

  // Filtrar préstamos por búsqueda
  const filteredLoans = loans.filter(loan =>
    loan.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id.includes(searchQuery)
  );

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
      await createPayment({ ...paymentData, user_id: user!.id });
      await loadData(); // Recargar datos
      setShowRegistroAbono(false);
      setShowDetallesPrestamo(false);
    } catch (error) {
      console.error("Error registrando pago:", error);
      // TODO: Mostrar error al usuario
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
                Préstamos - activos ({filteredLoans.length})
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
    </View>
  );
}