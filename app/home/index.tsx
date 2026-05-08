import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  InteractionManager
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import Skeleton from "../../components/shared/Skeleton";
import NotificationModal from "../../components/home/NotificationModal";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";
import { getDailyDashboardData } from "../../services/dashboard.service";
import { getClients } from "../../services/client.service";
import { getPendingNotificationsUI } from "../../services/notification.service";
import { QuickActionFAB } from "../../components/shared/QuickActionFAB";
import { Modal, FlatList, Alert } from "react-native";

/**
 * Dashboard/Home Principal
 * Pantalla principal de la aplicación
 */

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Obtiene el espacio seguro de Android/iOS
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [summary, setSummary] = useState<any>({
    portfolioValue: "0",
    dailyCollection: "0",
    activeLoans: 0,
    pendingAgendaCount: 0
  });
  const [agenda, setAgenda] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Cargar datos reales de la bd y refrescarlos cuando vuelve a entrar
  useFocusEffect(
    useCallback(() => {
      async function loadDashboardData() {
        if (user?.id) {
          refreshDashboard();
        }
      }
      loadDashboardData();
    }, [user?.id])
  );

  const refreshDashboard = useCallback(async () => {
    if (!user?.id) return;

    // Diferir la carga hasta después de la interacción/transición
    InteractionManager.runAfterInteractions(async () => {
      try {
        const data = await getDailyDashboardData(user.id);
        setSummary(data.summary);
        setAgenda(data.agenda);
        setOperations(data.operations);

        const clientsData = await getClients(user.id);
        setClients(clientsData);

        const uiNotifications = await getPendingNotificationsUI(user.id);
        setNotifications(uiNotifications);

        setIsLoading(false);
      } catch (error) {
        console.error("Error refrescando dashboard:", error);
        setIsLoading(false);
      }
    });
  }, [user?.id]);

  // Datos del usuario para el header
  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatarUrl: user?.organization?.logo_path
  };

  // Obtener saludo dinámico
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Maneja la búsqueda de clientes
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearchActive(text.length > 0);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.length > 0) setIsSearchActive(true);
  };

  const filteredClients = clients.filter(c =>
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.document_number && c.document_number.includes(searchQuery))
  );

  const handleResultPress = (client: any) => {
    setIsSearchActive(false);
    setSearchQuery("");
    setSelectedClient(client);
  };

  const handleOperationPress = (operationId: string) => {
    console.log("Ver operación:", operationId);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { dismissNotification } = await import("../../services/notification.service");
      await dismissNotification(notificationId);
      refreshDashboard();
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };


  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      {/* Header compartido */}
      <AppHeader
        userData={userData}
        userId={user?.id}
        onNotificationsPress={() => setShowNotifications(true)}
        onProfilePress={() => router.push("/configuracion")}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        hasNotifications={notifications.length > 0}
      />

      <SearchResultsOverlay
        isVisible={isSearchActive}
        results={filteredClients}
        onClose={() => setIsSearchActive(false)}
        onResultPress={handleResultPress}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Bienvenida y Resumen Rápido */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-gray-400 text-sm font-medium uppercase tracking-widest">
            ESTADO DIARIO
          </Text>

          {summary.pendingAgendaCount > 0 && (
            <View className="flex-row items-center mt-2 bg-amber-50 self-start px-3 py-1 rounded-full border border-amber-100">
              <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
              <Text className="text-amber-800 text-xs font-semibold">
                Hoy tienes {summary.pendingAgendaCount} cobros pendientes
              </Text>
            </View>
          )}
        </View>

        {/* Carrusel de Métricas (KPIs) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
          snapToInterval={280}
          decelerationRate="fast"
        >
          {isLoading ? (
            <View className="flex-row">
              <Skeleton.Rect width={260} height={150} borderRadius={30} style={{ marginRight: 16 }} />
              <Skeleton.Rect width={260} height={150} borderRadius={30} style={{ marginRight: 16 }} />
              <Skeleton.Rect width={260} height={150} borderRadius={30} />
            </View>
          ) : (
            <>
              {/* Card: Capital en Calle */}
              <View className="bg-[#14688A] w-[260px] mr-4 rounded-3xl p-6 shadow-lg shadow-blue-900/20">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/20 p-2 rounded-xl">
                    <Ionicons name="wallet" size={20} color="white" />
                  </View>
                  <View className="bg-white/20 px-2 py-1 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">CARTERA</Text>
                  </View>
                </View>
                <Text className="text-white/70 text-xs font-medium">Capital en calle</Text>
                <Text className="text-white text-3xl font-bold mt-1">
                  ${summary.portfolioValue}
                </Text>
              </View>

              {/* Card: Recaudo Hoy */}
              <View className="bg-[#0D8A7A] w-[260px] mr-4 rounded-3xl p-6 shadow-lg shadow-teal-900/20">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/20 p-2 rounded-xl">
                    <Ionicons name="trending-up" size={20} color="white" />
                  </View>
                  <View className="bg-white/20 px-2 py-1 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">HOY</Text>
                  </View>
                </View>
                <Text className="text-white/70 text-xs font-medium">Recaudado hoy</Text>
                <Text className="text-white text-3xl font-bold mt-1">
                  ${summary.dailyCollection}
                </Text>
              </View>

              {/* Card: Salud de Cartera */}
              <View className="bg-slate-800 w-[260px] mr-4 rounded-3xl p-6 shadow-lg shadow-slate-900/20">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/20 p-2 rounded-xl">
                    <Ionicons name="people" size={20} color="white" />
                  </View>
                  <View className="bg-white/20 px-2 py-1 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">ESTADO</Text>
                  </View>
                </View>
                <Text className="text-white/70 text-xs font-medium">Clientes activos</Text>
                <Text className="text-white text-3xl font-bold mt-1">
                  {summary.activeLoans}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sección: Agenda de Cobros */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-lg font-bold">
              Agenda de hoy
            </Text>
            <TouchableOpacity onPress={() => router.push("/prestamos_abonos")}>
              <Text className="text-[#14688A] text-sm font-semibold">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton.Rect key={i} height={80} borderRadius={20} />
              ))}
            </View>
          ) : agenda.length === 0 ? (
            <View className="bg-gray-50 rounded-3xl p-8 items-center border border-dashed border-gray-200">
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm mt-2 text-center">
                No tienes cobros programados para hoy.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {agenda.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center shadow-sm"
                  onPress={() => router.push("/prestamos_abonos")}
                >
                  <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center mr-4">
                    <Text className="text-gray-400 font-bold text-lg">
                      {item.clientName.substring(0, 1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-base leading-none mb-1">
                      {item.clientName}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Cuota pendiente
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#14688A] font-bold text-base">
                      ${item.amount}
                    </Text>
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const itemDate = item.due_date.split('T')[0];
                      const isOverdue = itemDate < today;
                      return (
                        <View className={`${isOverdue ? 'bg-red-50' : 'bg-blue-50'} px-2 py-0.5 rounded-md mt-1`}>
                          <Text className={`${isOverdue ? 'text-red-600' : 'text-[#14688A]'} text-[9px] font-black uppercase`}>
                            {isOverdue ? 'VENCIDO' : 'HOY'}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Historial de operaciones */}
        <View className="px-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">
            Actividad reciente
          </Text>
          <View className="bg-gray-50 rounded-3xl p-2">
            {isLoading ? (
              <View className="gap-2 p-2">
                {[1, 2, 3, 4].map(i => (
                  <View key={i} className="flex-row items-center p-2">
                    <Skeleton.Circle height={40} style={{ marginRight: 12 }} />
                    <View className="flex-1">
                      <Skeleton.Rect width="60%" height={14} style={{ marginBottom: 6 }} />
                      <Skeleton.Rect width="40%" height={10} />
                    </View>
                    <Skeleton.Rect width={60} height={20} />
                  </View>
                ))}
              </View>
            ) : operations.length === 0 ? (
              <View className="items-center justify-center p-8">
                <Text className="text-gray-400 text-sm">Sin movimientos recientes.</Text>
              </View>
            ) : (
              operations.slice(0, 5).map((operation, index) => (
                <TouchableOpacity
                  key={operation.id}
                  onPress={() => handleOperationPress(operation.id)}
                  className="flex-row items-center px-4 py-4"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${operation.type === "prestamo"
                      ? "bg-amber-100"
                      : "bg-teal-100"
                      }`}
                  >
                    <Ionicons
                      name={
                        operation.type === "prestamo"
                          ? "arrow-up"
                          : "arrow-down"
                      }
                      size={20}
                      color={operation.type === "prestamo" ? "#B45309" : "#0D8A7A"}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-900 text-sm font-bold">
                      {operation.clientName}
                    </Text>
                    <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">
                      {operation.type === 'prestamo' ? 'Desembolso' : 'Recaudo'} • {operation.time}
                    </Text>
                  </View>

                  <Text className={`text-sm font-black ${operation.type === "prestamo" ? "text-amber-600" : "text-teal-600"
                    }`}>
                    {operation.type === "prestamo" ? "-" : "+"}${operation.amount}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Botón flotante unificado con toda la lógica de registro */}
      <QuickActionFAB onRefresh={refreshDashboard} />

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
            <Ionicons name="home" size={24} color="#13678A" />
            <Text className="text-[#13678A] text-xs font-medium mt-1">
              inicio
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

      {/* Modal de Detalles del Cliente */}
      <ClientDetailsModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onRefresh={refreshDashboard}
      />

      {/* Los modales ahora se gestionan internamente en QuickActionFAB */}
    </View>
  );
}
