import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  InteractionManager
} from "react-native";
import { Svg, Rect, Circle, Line } from "react-native-svg";
import AppHeader from "../../components/shared/AppHeader";
import NotificationModal from "../../components/home/NotificationModal";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import { getClients } from "../../services/client.service";
import { QuickActionFAB } from "../../components/shared/QuickActionFAB";
import { useAuth } from "../../contexts/AuthContext";

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - 80;
const chartHeight = 150;

export default function ReportesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<"prestamos" | "ganancias" | "clientes">("prestamos");
  const [timePeriod, setTimePeriod] = useState<"MENSUAL" | "TRIMESTRAL" | "ANUAL">("MENSUAL");

  // Estados de busqueda global
  const [clients, setClients] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        if (user?.id) {
          const clientsData = await getClients(user.id);
          setClients(clientsData);

          const { getPendingNotificationsUI } = await import("../../services/notification.service");
          const uiNotifications = await getPendingNotificationsUI(user.id);
          setNotifications(uiNotifications);
        }
      } catch (error) {
        console.error("Error cargando datos en Reportes:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [user]);

  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { dismissNotification, getPendingNotificationsUI } = await import("../../services/notification.service");
      await dismissNotification(notificationId);
      const updated = await getPendingNotificationsUI(user?.id || 0);
      setNotifications(updated);
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearchActive(text.length > 0);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.length > 0) setIsSearchActive(true);
  };

  const handleResultPress = (client: any) => {
    setIsSearchActive(false);
    setSearchQuery("");
    setSelectedClient(client);
  };

  const filteredClients = clients.filter(c =>
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.document_number && c.document_number.includes(searchQuery))
  );

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
        onSearchSubmit={handleSearchSubmit}
        hasNotifications={notifications.length > 0}
      />

      <SearchResultsOverlay
        isVisible={isSearchActive}
        results={filteredClients}
        onClose={() => setIsSearchActive(false)}
        onResultPress={handleResultPress}
      />

      {/* Tabs horizontales */}
      <View className="px-4 mt-4 mb-4">
        <View className="flex-row gap-3">
          {["prestamos", "ganancias", "clientes"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full ${activeTab === tab ? "bg-[#13678A]" : "bg-transparent border border-gray-300"}`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium capitalize ${activeTab === tab ? "text-white" : "text-gray-600"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenido Principal */}
      <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
        {/* Título y descripción según tab */}
        <View className="mb-4">
          <Text className="text-gray-900 text-xl font-bold mb-1">
            {activeTab === "prestamos" && "Estado de cartera financiera"}
            {activeTab === "ganancias" && "Estado de resultados financieros"}
            {activeTab === "clientes" && "Análisis de clientes"}
          </Text>
          <Text className="text-gray-500 text-xs">
            {activeTab === "prestamos" && "Análisis detallado de colocación y riesgos"}
            {activeTab === "ganancias" && "Seguimiento detallado de ingresos y rentabilidad"}
            {activeTab === "clientes" && "Visualización detallada del crecimiento de la base de usuarios"}
          </Text>
        </View>

        {/* Botones de período */}
        <View className="flex-row gap-2 mb-4">
          {["MENSUAL", "TRIMESTRAL", "ANUAL"].map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setTimePeriod(period as any)}
              className={`px-3 py-2 rounded-md ${timePeriod === period ? "bg-gray-800" : "bg-gray-200"}`}
              activeOpacity={0.7}
            >
              <Text className={`text-xs font-medium ${timePeriod === period ? "text-white" : "text-gray-600"}`}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity className="ml-auto px-3 py-2 rounded-md bg-gray-100">
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* SECCIÓN PRESTAMOS */}
        {activeTab === "prestamos" && (
          <>
            {/* Total Prestado */}
            <View className="bg-[#13678A] rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-medium mb-2">TOTAL PRESTADO</Text>
              <Text className="text-white text-3xl font-bold mb-1">2,384,000.00</Text>
              <Text className="text-blue-100 text-xs">+23% Vigente anterior</Text>
            </View>

            {/* Intereses Proyectados */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-700 text-xs font-medium mb-1">INTERESES PROYECTADOS</Text>
              <Text className="text-gray-900 text-2xl font-bold">165,400.00</Text>
              <Text className="text-gray-500 text-xs mt-1">Basado en cartera proyecta 0.3%</Text>
            </View>

            {/* Distribución por Estatus */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100 items-center">
              <Text className="text-gray-700 text-xs font-medium mb-3">DISTRIBUCIÓN POR ESTATUS</Text>
              <Text className="text-gray-900 text-4xl font-bold mb-2">314</Text>
              <Text className="text-gray-500 text-xs mb-4">Total de préstamos</Text>
              <View className="w-full">
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">activos</Text>
                  <Text className="text-gray-700 text-xs font-medium">68%</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">pagados</Text>
                  <Text className="text-gray-700 text-xs font-medium">27%</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">mora</Text>
                  <Text className="text-gray-700 text-xs font-medium">5%</Text>
                </View>
              </View>
            </View>

            {/* Gráfico de barras */}
            <View className="bg-[#13678A] rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-medium mb-3">DISTRIBUCIÓN DEL VOLUMEN DE PRÉSTAMOS</Text>
              <Svg width={chartWidth} height={120}>
                {[85, 120, 95, 110, 105, 130].map((height, i) => (
                  <Rect
                    key={i}
                    x={i * (chartWidth / 6) + 5}
                    y={120 - height}
                    width={chartWidth / 6 - 10}
                    height={height}
                    fill="#E0F2FE"
                    rx={3}
                  />
                ))}
              </Svg>
              <View className="flex-row justify-between mt-2">
                {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN"].map((mes, i) => (
                  <Text key={i} className="text-white text-xs">
                    {mes}
                  </Text>
                ))}
              </View>
            </View>

            {/* Comparativa entre periodos */}
            <View className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 text-sm font-bold">Comparativa entre periodos</Text>
                <Ionicons name="options-outline" size={20} color="#6B7280" />
              </View>
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity className="px-3 py-2 bg-blue-600 rounded-md">
                  <Text className="text-white text-xs font-medium">PERIODO #1</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-3 py-2 bg-gray-200 rounded-md">
                  <Text className="text-gray-700 text-xs font-medium">PERIODO #2</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 text-xs font-medium mb-3">ENERO</Text>
              {[
                { label: "clientes totales", value: "14" },
                { label: "préstamos", value: "112" },
                { label: "préstamos saldados", value: "68" },
                { label: "préstamos vencidos", value: "22" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.label}</Text>
                  <Text className="text-blue-600 text-xs font-medium">{item.value}</Text>
                </View>
              ))}
              {["promedio de pagos", "tasa promedio de intereses", "ganancias estimadas", "pérdidas estimadas"].map((item, i) => (
                <View key={i + 4} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item}</Text>
                  <Text className={`text-xs font-medium ${i < 2 ? "text-gray-600" : i === 2 ? "text-green-600" : "text-red-600"}`}>
                    {["86%", "5%", "461,900.00", "32,240.00"][i]}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* SECCIÓN GANANCIAS */}
        {activeTab === "ganancias" && (
          <>
            {/* Utilidad Neta */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-700 text-xs font-medium mb-1">UTILIDAD NETA</Text>
              <Text className="text-gray-900 text-3xl font-bold">165,400.00</Text>
              <Text className="text-green-600 text-xs mt-1">+52 de período anterior</Text>
            </View>

            {/* Retorno de Inversión */}
            <View className="bg-[#13678A] rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-medium mb-1">RETORNO DE INVERSIÓN</Text>
              <Text className="text-white text-3xl font-bold">22.8%</Text>
              <Text className="text-blue-100 text-xs mt-1">Mejor 50%</Text>
            </View>

            {/* Eficiencia Operativa */}
            <View className="bg-[#13678A] rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-medium mb-1">EFICIENCIA OPERATIVA</Text>
              <Text className="text-white text-3xl font-bold">82.8%</Text>
            </View>

            {/* Gráfico Ganancias vs Proyecciones */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-900 text-xs font-medium mb-3">GANANCIAS VS PROYECCIONES</Text>
              <Svg width={chartWidth} height={120}>
                {[65, 90, 75, 95, 85, 110].map((height, i) => (
                  <Rect
                    key={i}
                    x={i * (chartWidth / 6) + 5}
                    y={120 - height}
                    width={(chartWidth / 6 - 10) / 2 - 2}
                    height={height}
                    fill="#60A5FA"
                    rx={2}
                  />
                ))}
                {[75, 100, 85, 105, 95, 120].map((height, i) => (
                  <Rect
                    key={`dark-${i}`}
                    x={i * (chartWidth / 6) + 5 + (chartWidth / 6 - 10) / 2 + 2}
                    y={120 - height}
                    width={(chartWidth / 6 - 10) / 2 - 2}
                    height={height}
                    fill="#1E40AF"
                    rx={2}
                  />
                ))}
              </Svg>
              <View className="flex-row justify-between mt-2">
                {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN"].map((mes, i) => (
                  <Text key={i} className="text-gray-600 text-xs">
                    {mes}
                  </Text>
                ))}
              </View>
            </View>

            {/* Embudo de Cobro */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-900 text-xs font-medium mb-4">EMBUDO DE COBRO</Text>
              <Svg width={chartWidth} height={100}>
                <Line x1="10" y1="10" x2={chartWidth - 10} y2="10" stroke="#E5E7EB" strokeWidth="1" />
                <Line x1="10" y1="10" x2={chartWidth - 10} y2="10" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" />
              </Svg>
            </View>

            {/* Comparativa entre periodos */}
            <View className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 text-sm font-bold">Comparativa entre periodos</Text>
                <Ionicons name="options-outline" size={20} color="#6B7280" />
              </View>
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity className="px-3 py-2 bg-blue-600 rounded-md">
                  <Text className="text-white text-xs font-medium">PERIODO #1</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-3 py-2 bg-gray-200 rounded-md">
                  <Text className="text-gray-700 text-xs font-medium">PERIODO #2</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 text-xs font-medium mb-3">ENERO</Text>
              {[
                { label: "Total cobrado", value: "178,900.00" },
                { label: "Interés real cobrado", value: "+112%" },
                { label: "Mora cobrada", value: "+68%" },
                { label: "Capital recuperado", value: "+243,200.00" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.label}</Text>
                  <Text className={`text-xs font-medium ${item.value.startsWith("+") ? "text-green-600" : "text-gray-900"}`}>
                    {item.value}
                  </Text>
                </View>
              ))}
              {[
                { label: "Intereses proyectados generados", value: "+46%" },
                { label: "Pérdidas por asuaciones", value: "-5%" },
                { label: "ROI del período", value: "461,900.00" },
                { label: "Ganancias brutas", value: "32,240.00" },
              ].map((item, i) => (
                <View key={i + 4} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.label}</Text>
                  <Text className={`text-xs font-medium ${item.value.startsWith("+") ? "text-green-600" : item.value.startsWith("-") ? "text-red-600" : "text-gray-900"}`}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* SECCIÓN CLIENTES */}
        {activeTab === "clientes" && (
          <>
            {/* Nuevos Clientes */}
            <View className="bg-[#13678A] rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-medium mb-2">NUEVOS CLIENTES</Text>
              <Text className="text-white text-3xl font-bold">37</Text>
              <Text className="text-blue-100 text-xs">+1.65 % período anterior</Text>
            </View>

            {/* Tasa de Retención */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-700 text-xs font-medium mb-1">TASA DE RETENCIÓN</Text>
              <Text className="text-gray-900 text-2xl font-bold">89.2%</Text>
              <Text className="text-blue-500 text-xs mt-1 font-medium">OPTIMO</Text>
            </View>

            {/* Segmentación de Clientes */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-900 text-xs font-medium mb-3">SEGMENTACIÓN DE CLIENTES</Text>
              <Svg width={chartWidth} height={100}>
                <Line x1="10" y1="10" x2={chartWidth - 10} y2="10" stroke="#E5E7EB" strokeWidth="1" />
              </Svg>
            </View>

            {/* Representación del Volumen */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-900 text-xs font-medium mb-3">REPRESENTACIÓN DEL VOLUMEN</Text>
              <Svg width={chartWidth} height={100}>
                {[80, 110, 90, 105, 95, 125].map((height, i) => (
                  <Rect
                    key={i}
                    x={i * (chartWidth / 6) + 5}
                    y={100 - height}
                    width={chartWidth / 6 - 10}
                    height={height}
                    fill="#E0F2FE"
                    rx={3}
                  />
                ))}
              </Svg>
              <View className="flex-row justify-between mt-2">
                {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN"].map((mes, i) => (
                  <Text key={i} className="text-gray-600 text-xs">
                    {mes}
                  </Text>
                ))}
              </View>
            </View>

            {/* Distribución de Calidad Crediticia */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100 items-center">
              <Text className="text-gray-700 text-xs font-medium mb-3">DISTRIBUCIÓN DE CALIDAD CREDITICIA</Text>
              <Text className="text-gray-900 text-4xl font-bold mb-2">314</Text>
              <Text className="text-gray-500 text-xs mb-4">PUNTOS</Text>
              <View className="w-full">
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">activos</Text>
                  <Text className="text-gray-700 text-xs font-medium">68%</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">pagados</Text>
                  <Text className="text-gray-700 text-xs font-medium">27%</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-xs flex-1">mora</Text>
                  <Text className="text-gray-700 text-xs font-medium">5%</Text>
                </View>
              </View>
            </View>

            {/* Concentración Geográfica */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-700 text-xs font-medium mb-3">CONCENTRACIÓN GEOGRÁFICA</Text>
              {[
                { location: "Higüey", percentage: "68%" },
                { location: "El Almirante", percentage: "27%" },
                { location: "Villa mella", percentage: "5%" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between items-center mb-2 pb-2 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.location}</Text>
                  <Text className="text-gray-700 text-xs font-medium">{item.percentage}</Text>
                </View>
              ))}
            </View>

            {/* Comparativa entre periodos */}
            <View className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 text-sm font-bold">Comparativa entre periodos</Text>
                <Ionicons name="options-outline" size={20} color="#6B7280" />
              </View>
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity className="px-3 py-2 bg-blue-600 rounded-md">
                  <Text className="text-white text-xs font-medium">PERIODO #1</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-3 py-2 bg-gray-200 rounded-md">
                  <Text className="text-gray-700 text-xs font-medium">PERIODO #2</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 text-xs font-medium mb-3">ENERO</Text>
              {[
                { label: "Concentración demográfica", value: "Villa mella" },
                { label: "Incremento del período", value: "+112%" },
                { label: "Calidad crediticia", value: "+68%" },
                { label: "Segmento destacado", value: "Milloniar 18 / 20" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.label}</Text>
                  <Text className={`text-xs font-medium ${item.value.includes("+") ? "text-green-600" : "text-blue-600"}`}>
                    {item.value}
                  </Text>
                </View>
              ))}
              {[
                { label: "Cuotas en mora", value: "26%" },
                { label: "Tasa de retención", value: "+5%" },
              ].map((item, i) => (
                <View key={i + 4} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <Text className="text-gray-600 text-xs">{item.label}</Text>
                  <Text className={`text-xs font-medium ${item.value.includes("+") ? "text-green-600" : "text-gray-900"}`}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Botón flotante unificado con toda la lógica de registro */}
      <QuickActionFAB />

      {/* Bottom Navigation Bar - Respeta la barra de navegación del sistema en Android */}
      <View
        className="bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: insets.bottom - 14 }}   // Agrega padding respetando la barra del sistema
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

          {/* Reportes - activo */}
          <TouchableOpacity
            onPress={() => router.push("/reportes")}
            className="items-center py-2 flex-1"
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart" size={24} color="#13678A" />
            <Text className="text-[#13678A] text-xs font-medium mt-1">reportes</Text>
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
      />
    </View>
  );
}
