import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from "react-native";
import { Svg, Rect, Circle } from "react-native-svg";
import AppHeader from "../../components/shared/AppHeader";
import DrawerMenu from "../../components/home/DrawerMenu";
import NotificationModal from "../../components/home/NotificationModal";
import {
  formatCurrencyReportes,
  mockEstadisticasPrestamos,
  mockEstadisticasGanancias,
  mockHistorialOperaciones,
  mockComparacionPeriodos,
  type EstadisticaMensual,
} from "../../data/reportesData";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - 80;
const chartHeight = 150;

/**
 * Pantalla de Reportes y Consultas
 * Muestra estadísticas, gráficos y reportes financieros
 */
export default function ReportesScreen() {
  const router = useRouter();
  const { user } = useAuth(); // 👈 Acceder al usuario logueado
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<"prestamos" | "ganancias" | "clientes" | "empleados">("prestamos");
  const [showFiltros, setShowFiltros] = useState(false);
  
  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };
  const notifications = mockNotifications;

  // Calcular monto total según el tab activo
  const calcularMontoTotal = () => {
    if (activeTab === "prestamos") {
      return 127560.0;
    } else if (activeTab === "ganancias") {
      return 34780.0;
    }
    return 0;
  };

  // Obtener estadísticas según el tab activo
  const obtenerEstadisticas = (): EstadisticaMensual[] => {
    if (activeTab === "prestamos") {
      return mockEstadisticasPrestamos;
    } else if (activeTab === "ganancias") {
      return mockEstadisticasGanancias;
    }
    return [];
  };

  // Maneja la eliminación de notificaciones
  const handleDeleteNotification = (notificationId: string) => {
    console.log("Eliminar notificación:", notificationId);
  };

  // Maneja la búsqueda
  const handleSearch = () => {
    console.log("Buscando:", searchQuery);
  };

  // Renderizar gráfico de barras
  const renderBarChart = (data: EstadisticaMensual[]) => {
    const maxValue = Math.max(...data.map(d => d.valor));
    const barWidth = (chartWidth / data.length) - 10;
    const padding = 2;

    return (
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="mb-4">
          <Text className="text-gray-500 text-xs mb-1">
            Monto total de los préstamos
          </Text>
          <Text className="text-gray-900 text-2xl font-bold">
            ${formatCurrencyReportes(calcularMontoTotal())}
          </Text>
        </View>

        <Svg width={chartWidth} height={chartHeight}>
          {data.map((item, index) => {
            const barHeight = (item.valor / maxValue) * (chartHeight - 30);
            const x = index * (barWidth + 10) + padding;
            const y = chartHeight - barHeight - 20;

            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3B82F6"
                rx={4}
              />
            );
          })}
        </Svg>

        {/* Labels de meses */}
        <View className="flex-row justify-between mt-2">
          {data.map((item, index) => (
            <Text key={index} className="text-gray-400 text-xs">
              {item.mes}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar gráfico circular (donut)
  const renderDonutChart = (gananciaNeta: number, gananciaPorMora: number, periodo: string) => {
    const size = 100;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const total = gananciaNeta + gananciaPorMora;
    const netaPercentage = (gananciaNeta / total) * 100;
    const moraPercentage = (gananciaPorMora / total) * 100;

    return (
      <View className="flex-1 bg-white rounded-xl p-4 items-center">
        <Text className="text-gray-700 text-sm font-medium mb-3">
          {periodo}
        </Text>

        <View className="relative items-center justify-center mb-3">
          <Svg width={size} height={size}>
            {/* Círculo de fondo */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            
            {/* Ganancia neta (verde) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#10B981"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${(netaPercentage / 100) * circumference} ${circumference}`}
              strokeDashoffset={0}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
            
            {/* Ganancia por mora (rojo) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#EF4444"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${(moraPercentage / 100) * circumference} ${circumference}`}
              strokeDashoffset={-((netaPercentage / 100) * circumference)}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
        </View>

        {/* Leyenda */}
        <View className="w-full">
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 bg-green-500 rounded-sm mr-2" />
            <Text className="text-gray-600 text-xs">ganancia neta</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-sm mr-2" />
            <Text className="text-gray-600 text-xs">ganancia por mora</Text>
          </View>
        </View>
      </View>
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

      {/* Tabs horizontales */}
      <View className="px-4 mt-4 mb-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 24 }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("prestamos")}
            className="pb-2"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "prestamos" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              préstamos
            </Text>
            {activeTab === "prestamos" && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("ganancias")}
            className="pb-2"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "ganancias" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              ganancias
            </Text>
            {activeTab === "ganancias" && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("clientes")}
            className="pb-2"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "clientes" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              clientes
            </Text>
            {activeTab === "clientes" && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("empleados")}
            className="pb-2"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "empleados" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              empleados
            </Text>
            {activeTab === "empleados" && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenido */}
      <ScrollView className="flex-1 px-4 mt-3" showsVerticalScrollIndicator={false}>
        {/* Estadísticas con gráfico de barras */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600 text-xs font-medium">
              {activeTab === "prestamos" ? "Estadísticas de préstamos" : 
               activeTab === "ganancias" ? "Estadísticas de ganancias" :
               `Estadísticas de ${activeTab}`}
            </Text>
            <TouchableOpacity
              onPress={() => setShowFiltros(!showFiltros)}
              className="w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {renderBarChart(obtenerEstadisticas())}
        </View>

        {/* Historial de operaciones */}
        {activeTab === "prestamos" && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 text-sm font-medium">
                Historial de operaciones
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-xs mr-2">enero 2025</Text>
                <TouchableOpacity
                  className="w-10 h-10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="options-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {mockHistorialOperaciones.map((operacion) => (
              <View
                key={operacion.id}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View className="w-10 h-10 bg-blue-600 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="cash-outline" size={20} color="white" />
                </View>

                <View className="flex-1">
                  <Text className="text-blue-600 text-base font-bold mb-1">
                    {formatCurrencyReportes(operacion.monto)}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {operacion.descripcion}
                  </Text>
                </View>

                <Text className="text-gray-400 text-xs">
                  fecha de pago{"\n"}{operacion.fecha}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Comparación entre periodo */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-700 text-sm font-medium">
              Comparación entre periodo
            </Text>
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            {mockComparacionPeriodos.map((comparacion, index) => (
              <View key={index} className="flex-1">
                {renderDonutChart(
                  comparacion.gananciaNeta,
                  comparacion.gananciaPorMora,
                  comparacion.periodo
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Espaciador para el bottom bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Botón flotante para nuevo reporte */}
      <TouchableOpacity
        onPress={() => console.log("Nuevo reporte")}
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

      {/* Drawer Menu */}
      <DrawerMenu
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        userData={userData}
      />
    </View>
  );
}
