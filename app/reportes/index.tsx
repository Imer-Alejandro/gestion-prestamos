import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  InteractionManager,
  Modal
} from "react-native";
import { Svg, Rect, Circle, Line, Path, Polyline, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, G } from "react-native-svg";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import AppHeader from "../../components/shared/AppHeader";
import NotificationModal from "../../components/home/NotificationModal";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import ReportSkeleton from "../../components/reportes/ReportSkeleton";
import { getClients } from "../../services/client.service";
import { QuickActionFAB } from "../../components/shared/QuickActionFAB";
import { useAuth } from "../../contexts/AuthContext";
import { ReportService } from "../../services/report.service";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [reportData, setReportData] = useState<any>(null);
  const [customRange, setCustomRange] = useState<{ start?: Date; end?: Date }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [dateStep, setDateStep] = useState<"start" | "end">("start");
  const [tempRange, setTempRange] = useState<{ start?: Date; end?: Date }>({});

  // Estados de busqueda global
  const [clients, setClients] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Resetear periodo al cambiar de pestaña
    if (activeTab) {
      setTimePeriod("MENSUAL");
      setCustomRange({});
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, timePeriod, customRange, user?.id]);

  const fetchReportData = async () => {
    if (!user?.id || !isMounted.current) return;
    setReportData(null); // Limpiar datos previos para evitar errores de estructura
    setIsLoading(true);
    try {
      let data;
      if (activeTab === "prestamos") {
        data = await ReportService.getLoanReport(user.id, {
          period: timePeriod,
          startDate: customRange.start?.toISOString(),
          endDate: customRange.end?.toISOString()
        });
      } else if (activeTab === "ganancias") {
        data = await ReportService.getProfitReport(user.id, {
          period: timePeriod,
          startDate: customRange.start?.toISOString(),
          endDate: customRange.end?.toISOString()
        });
      } else {
        // Fallback or other tabs
        data = await ReportService.getLoanReport(user.id, {
          period: timePeriod,
          startDate: customRange.start?.toISOString(),
          endDate: customRange.end?.toISOString()
        });
      }

      if (isMounted.current) {
        setReportData(data);
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      if (isMounted.current) {
        // Pequeño delay para suavizar la transición
        setTimeout(() => {
          if (isMounted.current) setIsLoading(false);
        }, 300);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    if (dateStep === "start") {
      setTempRange({ start: selectedDate });
      setDateStep("end");
    } else {
      setTempRange(prev => ({ ...prev, end: selectedDate }));
    }
  };

  const applyCustomRange = () => {
    if (tempRange.start) {
      setCustomRange(tempRange);
      setShowRangeModal(false);
    }
  };

  const clearCustomRange = () => {
    setCustomRange({});
    setTempRange({});
    setDateStep("start");
    setTimePeriod("MENSUAL");
  };

  const fetchData = async () => {
    if (!user?.id) return;
    InteractionManager.runAfterInteractions(async () => {
      try {
        const clientsData = await getClients(user.id);
        if (isMounted.current) setClients(clientsData);

        const { getPendingNotificationsUI } = await import("../../services/notification.service");
        const uiNotifications = await getPendingNotificationsUI(user.id);
        if (isMounted.current) setNotifications(uiNotifications);
      } catch (error) {
        console.error("Error cargando datos en Reportes:", error);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    });
  };

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
      <ScrollView className="flex-1 mt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {isLoading ? (
          <ReportSkeleton />
        ) : (
          <>
            {/* Título y descripción según tab */}
            <View className="mb-6">
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

            {/* Botones de período - Diseño pill premium */}
            <View className="bg-white rounded-full flex-row items-center p-1 mb-6 shadow-sm border border-gray-100">
              <View className="flex-row flex-1 justify-around items-center">
                {["MENSUAL", "TRIMESTRAL", "ANUAL"].map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => {
                      setTimePeriod(period as any);
                      setCustomRange({});
                    }}
                    className={`px-4 py-2.5 rounded-full ${timePeriod === period && !customRange.start ? "bg-gray-50" : "bg-transparent"}`}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-[11px] font-black tracking-tighter ${timePeriod === period && !customRange.start ? "text-[#13678A]" : "text-gray-900"}`}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="w-[1px] h-6 bg-gray-200 mx-1" />

              <TouchableOpacity
                className={`px-5 py-2.5 rounded-full flex-row items-center ${customRange.start ? "bg-[#13678A]/10" : "bg-transparent"}`}
                activeOpacity={0.7}
                onPress={() => setShowRangeModal(true)}
              >
                <Ionicons
                  name={customRange.start ? "calendar" : "calendar-outline"}
                  size={18}
                  color={customRange.start ? "#13678A" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            {/* Indicador de Rango Minimalista debajo de la barra */}
            {customRange.start && (
              <View className="items-end -mt-5 mb-6 pr-1">
                <View className="items-center mr-4">
                  {/* Triangulito indicador */}
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      backgroundColor: 'transparent',
                      borderStyle: 'solid',
                      borderLeftWidth: 5,
                      borderRightWidth: 5,
                      borderBottomWidth: 5,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderBottomColor: '#F1F5F9',
                    }}
                  />
                  <View className="bg-slate-50 px-3 py-1.5 rounded-xl flex-row items-center shadow-sm border border-slate-200/50">
                    <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {customRange.start.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      {customRange.end ? ` - ${customRange.end.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}` : ""}
                    </Text>
                    <TouchableOpacity
                      onPress={clearCustomRange}
                      className="ml-2 bg-slate-200 rounded-full p-0.5"
                    >
                      <Ionicons name="close" size={10} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SECCIÓN PRESTAMOS */}
            {activeTab === "prestamos" && reportData && (
              <View className="animate-fade-in">
                {/* Total Prestado */}
                <View className="bg-[#13678A] rounded-[24px] p-6 mb-5 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white/80 text-xs font-semibold tracking-wider">CAPITAL DESEMBOLSADO</Text>
                    <View className="bg-white/20 p-2 rounded-full">
                      <Ionicons name="cash" size={16} color="white" />
                    </View>
                  </View>
                  <Text className="text-white text-4xl font-black mb-2 tracking-tight">
                    ${(reportData.metrics?.totalAmount || 0).toLocaleString()}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons
                      name={(reportData?.comparative?.growth || 0) >= 0 ? "trending-up" : "trending-down"}
                      size={14}
                      color={(reportData?.comparative?.growth || 0) >= 0 ? "#86efac" : "#fca5a5"}
                    />
                    <Text className={`text-xs font-medium ml-1 ${(reportData?.comparative?.growth || 0) >= 0 ? "text-green-300" : "text-red-300"}`}>
                      {(reportData?.comparative?.growth || 0) >= 0 ? "+" : ""}{(reportData?.comparative?.growth || 0).toFixed(1)}% vs anterior
                    </Text>
                  </View>
                </View>

                {/* Salud de Cartera y Riesgo (NUEVO) */}
                <View className="flex-row gap-4 mb-5">
                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">Índice de Mora</Text>
                      <View className={`w-2 h-2 rounded-full ${(reportData.riskMetrics?.parPercentage || 0) > 10 ? 'bg-red-500' : (reportData.riskMetrics?.parPercentage || 0) > 5 ? 'bg-amber-500' : 'bg-green-500'}`} />
                    </View>
                    <Text className={`text-2xl font-black ${(reportData.riskMetrics?.parPercentage || 0) > 10 ? 'text-red-600' : 'text-gray-800'}`}>
                      {(reportData.riskMetrics?.parPercentage || 0).toFixed(1)}%
                    </Text>
                    <Text className="text-gray-400 text-[9px] mt-1 font-medium">PAR (Portfolio at Risk)</Text>
                  </View>

                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-2">Recuperación</Text>
                    <Text className="text-gray-800 text-2xl font-black">
                      {(reportData.recoveryRate?.rate || 0).toFixed(0)}%
                    </Text>
                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <View className="h-full bg-[#10B981]" style={{ width: `${Math.min(reportData.recoveryRate?.rate || 0, 100)}%` as any }} />
                    </View>
                  </View>
                </View>

                {/* Eficiencia de Cartera (NUEVO) */}
                <View className="flex-row gap-4 mb-5">
                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-1">Interés Promedio</Text>
                    <View className="flex-row items-end">
                      <Text className="text-gray-800 text-xl font-black">
                        {(reportData.efficiency?.avgRate || 0).toFixed(1)}%
                      </Text>
                      <Text className="text-gray-400 text-[9px] mb-1.5 ml-1">p/m</Text>
                    </View>
                  </View>

                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-1">Ticket Promedio</Text>
                    <Text className="text-gray-800 text-xl font-black">
                      ${(reportData.efficiency?.avgTicket || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                </View>

                {/* Intereses Proyectados y Cantidad (Grid) */}
                <View className="flex-row gap-4 mb-5">
                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">INTERÉS PROYECTADO</Text>
                    <Text className="text-gray-800 text-xl font-black mb-1">
                      ${((reportData?.metrics?.totalInterest || 0) / 1000).toFixed(1)}k
                    </Text>
                    <Text className="text-gray-400 text-[10px]">Estimado del periodo</Text>
                  </View>

                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">CANTIDAD OTORGADA</Text>
                    <Text className="text-gray-800 text-xl font-black mb-1">{reportData?.metrics?.totalCount || 0}</Text>
                    <Text className={`text-[10px] font-bold ${(reportData?.comparative?.countGrowth || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {(reportData?.comparative?.countGrowth || 0) >= 0 ? "+" : ""}{(reportData?.comparative?.countGrowth || 0).toFixed(1)}% vs ant.
                    </Text>
                  </View>
                </View>

                {/* Distribución por Estatus (Donut Chart Premium) */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-bold mb-6">Estatus de Cartera</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="relative items-center justify-center">
                      <PieChart
                        data={(reportData?.statusDistribution || []).length > 0 ? (
                          (reportData?.statusDistribution || []).map((item: any, i: number) => {
                            const colors = ["#13678A", "#10B981", "#F59E0B", "#EF4444", "#9CA3AF"];
                            return {
                              value: item.percentage,
                              color: colors[i % colors.length],
                            };
                          })
                        ) : [{ value: 100, color: '#F1F5F9' }]}
                        donut
                        radius={55}
                        innerRadius={40}
                        centerLabelComponent={() => (
                          <View className="items-center">
                            <Text className="text-gray-900 text-lg font-black">{reportData?.metrics?.totalCount || 0}</Text>
                            <Text className="text-gray-400 text-[8px] font-bold uppercase">Total</Text>
                          </View>
                        )}
                      />
                    </View>

                    <View className="flex-1 ml-6 gap-3">
                      {(reportData?.statusDistribution || []).map((item: any, i: number) => {
                        const colors = ["#13678A", "#10B981", "#F59E0B", "#EF4444", "#9CA3AF"];
                        const labels: any = { active: 'Activos', completed: 'Completados', overdue: 'En Mora', voided: 'Anulados' };
                        return (
                          <View key={i} className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }} />
                              <Text className="text-[11px] text-gray-600 font-medium">{labels[item.status] || item.status}</Text>
                            </View>
                            <Text className="text-[11px] text-gray-900 font-bold">{(item.percentage || 0).toFixed(0)}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Nueva Sección: Diversificación por Tipo (Premium Horizontal Bars) */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-bold mb-5">Diversificación de Cartera</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="relative items-center justify-center">
                      {(reportData?.typeDistribution || []).length > 0 ? (
                        <PieChart
                          data={(reportData?.typeDistribution || []).map((item: any, i: number) => {
                            const colors = ["#13678A", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
                            return {
                              value: item.amount,
                              color: colors[i % colors.length],
                            };
                          })}
                          donut
                          radius={60}
                          innerRadius={45}
                          centerLabelComponent={() => (
                            <View className="items-center">
                              <Text className="text-gray-900 text-[9px] font-black">
                                RD${((reportData?.typeDistribution?.reduce((acc: any, curr: any) => acc + (curr.amount || 0), 0) || 0) / 1000).toFixed(0)}k
                              </Text>
                              <Text className="text-gray-400 text-[6px] font-bold uppercase">Total</Text>
                            </View>
                          )}
                        />
                      ) : (
                        <View className="h-[120px] w-[120px] rounded-full bg-gray-50 items-center justify-center border border-dashed border-gray-200">
                          <Text className="text-gray-300 text-[10px]">Sin datos</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-1 ml-6 gap-3">
                      {(reportData?.typeDistribution || []).map((item: any, i: number) => {
                        const colors = ["#13678A", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
                        const labels: any = { personal: 'Personal', vehicle: 'Vehículos', housing: 'Vivienda', business: 'Negocios' };
                        const total = (reportData?.typeDistribution || []).reduce((acc: any, curr: any) => acc + (curr.amount || 0), 0) || 1;
                        const percentage = ((item.amount || 0) / total) * 100;
                        return (
                          <View key={i} className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }} />
                              <Text className="text-[10px] text-gray-600 font-medium" numberOfLines={1}>{labels[item.type] || item.type}</Text>
                            </View>
                            <Text className="text-[10px] text-gray-900 font-black ml-2">{(percentage || 0).toFixed(0)}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Gráfico de barras de volumen */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-gray-800 text-sm font-bold">Volumen por Periodo</Text>
                    <View className="bg-gray-50 px-2 py-1 rounded-md">
                      <Text className="text-[10px] text-gray-500 font-bold">{timePeriod}</Text>
                    </View>
                  </View>
                  <View className="items-center">
                    {(reportData?.timeDistribution || []).length > 0 ? (
                      <BarChart
                        data={(reportData?.timeDistribution || []).map((item: any) => ({
                          value: item.amount,
                          label: item.label,
                          frontColor: '#13678A',
                          topLabelComponent: () => (
                            <View style={{ marginBottom: 4 }}>
                              <Text className="text-[6px] font-black text-slate-500 text-center">
                                {(item.amount || 0) >= 1000 ? `${((item.amount || 0) / 1000).toFixed(0)}k` : (item.amount || 0)}
                              </Text>
                            </View>
                          ),
                        }))}
                        maxValue={Math.max(...(reportData?.timeDistribution || []).map((i: any) => i.amount || 0), 1) * 1.3}
                        width={screenWidth - 130}
                        height={160}
                        barWidth={20}
                        spacing={22}
                        initialSpacing={20}
                        noOfSections={4}
                        yAxisLabelWidth={45}
                        formatYLabel={(label) => {
                          const val = parseInt(label);
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                          return val.toString();
                        }}
                        barBorderRadius={4}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        isAnimated
                      />
                    ) : (
                      <View className="h-[150px] items-center justify-center">
                        <Text className="text-gray-300 text-xs">Sin datos para este periodo</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Antigüedad de la Mora */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-6">
                    <View>
                      <Text className="text-gray-800 text-sm font-bold">Antigüedad de la Mora</Text>
                      <Text className="text-gray-400 text-[9px]">Distribución de capital vencido</Text>
                    </View>
                    <View className="bg-red-50 px-2 py-1 rounded-lg">
                      <Text className="text-red-600 text-[9px] font-black uppercase">Riesgo Alto</Text>
                    </View>
                  </View>

                  <View className="items-center">
                    {(reportData?.arrearsAging || []).some((b: any) => (b.amount || 0) > 0) ? (
                      <BarChart
                        data={(reportData?.arrearsAging || []).map((item: any, i: number) => ({
                          value: item.amount,
                          label: item.label,
                          frontColor: ["#60A5FA", "#FBBF24", "#F87171", "#B91C1C"][i] || "#13678A",
                          topLabelComponent: () => (
                            <Text className="text-[7px] font-black text-slate-500 mb-1">
                              RD${(item.amount || 0).toLocaleString()}
                            </Text>
                          ),
                        }))}
                        maxValue={Math.max(...(reportData?.arrearsAging || []).map((i: any) => i.amount || 0), 1) * 1.3}
                        width={screenWidth - 130}
                        height={140}
                        barWidth={35}
                        spacing={30}
                        initialSpacing={20}
                        noOfSections={3}
                        yAxisLabelWidth={45}
                        formatYLabel={(label) => {
                          const val = parseInt(label);
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                          return val.toString();
                        }}
                        barBorderRadius={6}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        isAnimated
                      />
                    ) : (
                      <View className="h-[120px] items-center justify-center">
                        <Text className="text-gray-300 text-xs">Sin mora activa</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Flujo de Capital: Colocación vs Recuperación (NUEVO) */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-bold mb-5">Flujo de Capital (Capital)</Text>
                  <View className="flex-row gap-6">
                    <View className="flex-1">
                      <Text className="text-gray-400 text-[9px] font-bold uppercase mb-2">Desembolsado</Text>
                      <Text className="text-amber-600 text-lg font-black">${(reportData?.flowEfficiency?.disbursed || 0).toLocaleString()}</Text>
                      <View className="h-1 bg-amber-100 rounded-full mt-2 w-full" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-[9px] font-bold uppercase mb-2">Recuperado</Text>
                      <Text className="text-teal-600 text-lg font-black">${(reportData?.flowEfficiency?.collectedCapital || 0).toLocaleString()}</Text>
                      <View className="h-1 bg-teal-100 rounded-full mt-2 w-full" />
                    </View>
                  </View>
                  <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center">
                    <Text className="text-gray-400 text-[10px]">Ratio de Retorno de Capital</Text>
                    <Text className="text-gray-800 text-xs font-bold">
                      {(reportData?.flowEfficiency?.disbursed || 0) > 0
                        ? (((reportData?.flowEfficiency?.collectedCapital || 0) / (reportData?.flowEfficiency?.disbursed || 1)) * 100).toFixed(0)
                        : 100}%
                    </Text>
                  </View>
                </View>

                {/* Concentración de Riesgo: Top Deudores (NUEVO) */}
                <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-gray-800 text-sm font-bold">Concentración de Riesgo</Text>
                    <Text className="text-[10px] text-gray-400 font-bold uppercase">Top 3 Deudores</Text>
                  </View>
                  {(reportData.topDebtors || []).map((debtor: any, i: number) => (
                    <View key={i} className={`flex-row justify-between items-center py-3 ${i !== (reportData.topDebtors?.length || 0) - 1 ? 'border-b border-gray-50' : ''}`}>
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center mr-3">
                          <Text className="text-slate-500 text-[10px] font-black">{debtor.first_name[0]}{debtor.last_name[0]}</Text>
                        </View>
                        <View>
                          <Text className="text-gray-800 text-xs font-bold">{debtor.first_name} {debtor.last_name}</Text>
                          <Text className="text-gray-400 text-[9px]">{debtor.loanCount} préstamos activos</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 text-sm font-black">${(debtor.totalDebt || 0).toLocaleString()}</Text>
                        <Text className="text-[9px] text-slate-400">{(((debtor.totalDebt || 0) / (reportData?.riskMetrics?.totalActiveBalance || 1)) * 100).toFixed(1)}% de la cartera</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Comparativa detallada */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-bold mb-5">Comparativa vs Periodo Anterior</Text>
                  {[
                    { label: "Monto Promedio", current: reportData?.metrics?.avgAmount || 0, prev: reportData?.previousMetrics?.avgAmount || 0, unit: "$" },
                    { label: "Capital Colocado", current: reportData?.metrics?.totalAmount || 0, prev: reportData?.previousMetrics?.totalAmount || 0, unit: "$" },
                    { label: "Préstamos Realizados", current: reportData?.metrics?.totalCount || 0, prev: reportData?.previousMetrics?.totalCount || 0, unit: "" },
                  ].map((item, i) => {
                    const diff = item.prev > 0 ? ((item.current - item.prev) / item.prev) * 100 : 0;
                    return (
                      <View key={i} className={`flex-row justify-between items-center py-4 ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                        <View>
                          <Text className="text-gray-500 text-xs font-medium">{item.label}</Text>
                          <Text className="text-[10px] text-gray-400">Prev: {item.unit}{(item.prev || 0).toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-bold text-gray-800">
                            {item.unit}{item.current.toLocaleString()}
                          </Text>
                          <View className="flex-row items-center">
                            <Ionicons name={diff >= 0 ? "caret-up" : "caret-down"} size={10} color={diff >= 0 ? "#10B981" : "#EF4444"} />
                            <Text className={`text-[10px] font-bold ml-1 ${diff >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {Math.abs(diff || 0).toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SECCIÓN GANANCIAS */}
            {activeTab === "ganancias" && reportData && (
              <View className="animate-fade-in">
                {/* Utilidad Neta - Hero Card Premium */}
                <View className="bg-[#10B981] rounded-[32px] p-8 mb-6 shadow-xl relative overflow-hidden">
                  {/* Decoración de fondo */}
                  <View className="absolute -right-10 -bottom-10 opacity-20">
                    <Ionicons name="trending-up" size={180} color="white" />
                  </View>

                  <View className="flex-row items-center justify-between mb-4 relative z-10">
                    <Text className="text-white/80 text-[10px] font-black tracking-[2px] uppercase">UTILIDAD NETA TOTAL</Text>
                    <View className="bg-white/20 p-2 rounded-2xl">
                      <Ionicons name="stats-chart" size={18} color="white" />
                    </View>
                  </View>

                  <View className="relative z-10">
                    <Text className="text-white text-5xl font-black tracking-tighter mb-2">
                      ${(reportData?.metrics?.netProfit || 0).toLocaleString()}
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`flex-row items-center px-2.5 py-1 rounded-full ${(reportData?.comparative?.profitGrowth || 0) >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
                        <Ionicons
                          name={(reportData?.comparative?.profitGrowth || 0) >= 0 ? "arrow-up" : "arrow-down"}
                          size={12}
                          color="white"
                        />
                        <Text className="text-white text-[11px] font-bold ml-1">
                          {Math.abs(reportData?.comparative?.profitGrowth || 0).toFixed(1)}%
                        </Text>
                      </View>
                      <Text className="text-white/60 text-[10px] font-medium ml-2 uppercase tracking-wider">vs periodo anterior</Text>
                    </View>
                  </View>
                </View>

                {/* Grid de KPIs Financieros */}
                <View className="flex-row gap-4 mb-6">
                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-4">
                      <Ionicons name="pie-chart" size={20} color="#13678A" />
                    </View>
                    <Text className="text-gray-400 text-[9px] font-black tracking-widest uppercase mb-1">ROI Est.</Text>
                    <Text className="text-gray-900 text-2xl font-black">{(reportData?.roi?.current || 0).toFixed(1)}%</Text>
                    <Text className="text-blue-500 text-[9px] font-bold mt-1">Rentabilidad</Text>
                  </View>

                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <View className="bg-teal-50 w-10 h-10 rounded-2xl items-center justify-center mb-4">
                      <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    </View>
                    <Text className="text-gray-400 text-[9px] font-black tracking-widest uppercase mb-1">Eficiencia</Text>
                    <Text className="text-gray-900 text-2xl font-black">{(reportData?.efficiency?.rate || 0).toFixed(1)}%</Text>
                    <Text className="text-teal-500 text-[9px] font-bold mt-1">Operativa</Text>
                  </View>
                </View>

                {/* Embudo de Cobros - Visualización Premium */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-6">
                    <View>
                      <Text className="text-gray-800 text-sm font-black">Embudo de Cobros</Text>
                      <Text className="text-gray-400 text-[9px] font-medium uppercase tracking-tighter">Proceso de conversión de activos</Text>
                    </View>
                    <View className="bg-gray-50 px-2.5 py-1.5 rounded-xl">
                      <Text className="text-[#13678A] text-[10px] font-black">{(reportData?.efficiency?.rate || 0).toFixed(0)}% Eficacia</Text>
                    </View>
                  </View>

                  <View className="items-center py-4">
                    {(reportData?.funnel || []).map((item: any, i: number) => {
                      const maxWidth = screenWidth - 100;
                      const width = maxWidth * (1 - i * 0.12);
                      return (
                        <View key={i} className="items-center mb-1">
                          <View
                            className="h-10 rounded-xl flex-row items-center justify-center px-4"
                            style={{ width: width as any, backgroundColor: item.color }}
                          >
                            <Text className="text-white text-[10px] font-black uppercase flex-1">{item.label}</Text>
                            <Text className="text-white text-xs font-black">${(item.value || 0).toLocaleString()}</Text>
                          </View>
                          {i < (reportData?.funnel || []).length - 1 && (
                            <View className="h-2 w-[1px] bg-gray-200" />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Comparativa: Proyecciones vs Realidad */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-8">
                    <View>
                      <Text className="text-gray-800 text-sm font-black">Ganancias vs Proyecciones</Text>
                      <Text className="text-gray-400 text-[9px] font-medium">Cumplimiento de metas de interés</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-[#13678A] mr-1.5" />
                        <Text className="text-[9px] text-gray-500 font-bold uppercase">Real</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-blue-100 mr-1.5" />
                        <Text className="text-[9px] text-gray-500 font-bold uppercase">Proy.</Text>
                      </View>
                    </View>
                  </View>

                  <View className="items-center mb-4">
                    {reportData?.projections && (reportData?.projections || []).length > 0 ? (
                      <LineChart
                        data={(reportData?.projections || []).map((item: any) => ({
                          value: item.real,
                          label: item.label,
                        }))}
                        data2={(reportData?.projections || []).map((item: any) => ({
                          value: item.projected,
                        }))}
                        width={chartWidth - 100}
                        height={180}
                        thickness={3}
                        color="#13678A"
                        color2="#DBEAFE"
                        dataPointsColor="#13678A"
                        dataPointsColor2="#3B82F6"
                        noOfSections={4}
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 9 }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        yAxisLabelPrefix="$"
                        yAxisLabelContainerStyle={{ width: 45 }}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        isAnimated
                        curved
                      />
                    ) : (
                      <View className="h-[180px] items-center justify-center">
                        <Text className="text-gray-300 text-xs">Sin proyecciones disponibles</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Fuentes de Ingreso</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="relative items-center justify-center">
                      <PieChart
                        data={(reportData?.revenueSources || []).map((source: any) => ({
                          value: source.amount,
                          color: source.color,
                          label: source.label,
                        })) || [{ value: 100, color: '#F1F5F9' }]}
                        radius={60}
                        innerRadius={45}
                        donut
                        centerLabelComponent={() => (
                          <View className="items-center">
                            <Text className="text-gray-900 text-[10px] font-black">${(reportData?.metrics?.netProfit || 0) >= 1000 ? `${((reportData?.metrics?.netProfit || 0) / 1000).toFixed(1)}k` : (reportData?.metrics?.netProfit || 0)}</Text>
                            <Text className="text-gray-400 text-[7px] font-bold uppercase">Utilidad</Text>
                          </View>
                        )}
                      />
                    </View>
                    <View className="flex-1 ml-6 gap-3">
                      {(reportData.revenueSources || []).map((source: any, i: number) => {
                        const total = reportData.metrics?.netProfit || 1;
                        const perc = (source.amount / total) * 100;
                        return (
                          <View key={i} className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: source.color }} />
                              <Text className="text-[10px] text-gray-600 font-medium">{source.label}</Text>
                            </View>
                            <Text className="text-[10px] text-gray-900 font-bold">{(perc || 0).toFixed(0)}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Desglose Detallado */}
                <View className="bg-white rounded-[24px] p-6 mb-10 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-5">Rendimiento Operativo</Text>
                  {[
                    { label: "Capital Recuperado", value: reportData?.funnel?.[2]?.value || 0, icon: "cash-outline", color: "blue" },
                    { label: "Intereses Cobrados", value: reportData?.metrics?.interestProfit || 0, icon: "trending-up-outline", color: "green" },
                    { label: "Mora Recaudada", value: reportData?.metrics?.lateFeeProfit || 0, icon: "timer-outline", color: "red" },
                    { label: "Total Recaudado", value: reportData?.metrics?.totalCollected || 0, icon: "wallet-outline", color: "slate" },
                  ].map((item, i) => (
                    <View key={i} className={`flex-row justify-between items-center py-4 ${i !== 3 ? 'border-b border-gray-50' : ''}`}>
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 bg-${item.color}-50`}>
                          <Ionicons name={item.icon as any} size={16} color={item.color === 'slate' ? '#475569' : item.color} />
                        </View>
                        <Text className="text-gray-600 text-xs font-medium">{item.label}</Text>
                      </View>
                      <Text className="text-sm font-black text-gray-900">${(item.value || 0).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SECCIÓN CLIENTES */}
            {activeTab === "clientes" && (
              <View className="animate-fade-in">
                {/* Nuevos Clientes Hero - Simplificado y Reducido */}
                <View className="bg-[#13678A] rounded-[24px] p-6 mb-4 shadow-sm relative">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white/70 text-[10px] font-bold tracking-wider mb-1">TOTAL CLIENTES</Text>
                      <Text className="text-white text-3xl font-black">412</Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1.5 rounded-xl">
                      <Text className="text-white text-xs font-bold">+12%</Text>
                    </View>
                  </View>
                </View>

                {/* Métricas Principales (Más compactas) */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                    <Text className="text-gray-400 text-[9px] font-bold mb-1 uppercase">Retención</Text>
                    <Text className="text-gray-800 text-lg font-black">89.2%</Text>
                  </View>

                  <View className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                    <Text className="text-gray-400 text-[9px] font-bold mb-1 uppercase">Morosidad</Text>
                    <Text className="text-gray-800 text-lg font-black">5.2%</Text>
                  </View>
                </View>

                {/* Gráfico de Tendencia (Más simple) */}
                <View className="bg-white rounded-[20px] p-5 mb-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-800 text-xs font-bold mb-5">Tendencia de Adquisición</Text>
                  <View className="items-center">
                    <LineChart
                      data={[
                        { value: 10, label: 'Ene' }, { value: 25, label: 'Feb' },
                        { value: 18, label: 'Mar' }, { value: 40, label: 'Abr' },
                        { value: 35, label: 'May' }, { value: 50, label: 'Jun' }
                      ]}
                      width={chartWidth - 100}
                      height={80}
                      thickness={2}
                      color="#13678A"
                      noOfSections={3}
                      hideRules
                      hideDataPoints
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                      xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                      isAnimated
                      curved
                    />
                  </View>
                </View>

                {/* Calidad Crediticia (Simplificado) */}
                <View className="bg-white rounded-[20px] p-5 mb-4 shadow-sm border border-gray-100">
                  <Text className="text-gray-800 text-xs font-bold mb-4">Cartera por Riesgo</Text>
                  {[
                    { label: "Excelente", p: "65%", color: "bg-green-500" },
                    { label: "Regular", p: "25%", color: "bg-blue-400" },
                    { label: "Riesgo", p: "10%", color: "bg-red-400" }
                  ].map((item, i) => (
                    <View key={i} className="flex-row items-center mb-3">
                      <Text className="text-gray-500 text-[10px] w-16">{item.label}</Text>
                      <View className="flex-1 h-1 bg-gray-50 rounded-full mx-2">
                        <View className={`h-full ${item.color} rounded-full`} style={{ width: item.p as any }} />
                      </View>
                      <Text className="text-gray-800 text-[10px] font-bold w-8 text-right">{item.p}</Text>
                    </View>
                  ))}
                </View>

                {/* Zonas Geográficas (Blanco y Simple) */}
                <View className="bg-white rounded-[20px] p-5 mb-6 shadow-sm border border-gray-100">
                  <Text className="text-gray-800 text-xs font-bold mb-4">Zonas Principales</Text>
                  {[
                    { label: "Higüey", p: "68%" },
                    { label: "Bávaro", p: "22%" },
                    { label: "Punta Cana", p: "10%" }
                  ].map((item, i) => (
                    <View key={i} className="flex-row justify-between mb-2">
                      <Text className="text-gray-500 text-[11px]">{item.label}</Text>
                      <Text className="text-gray-800 text-[11px] font-bold">{item.p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
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

      {/* Modal de Rango de Fechas */}
      <Modal
        visible={showRangeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRangeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-[32px] p-6 shadow-xl">
            <Text className="text-gray-900 text-lg font-black mb-1">Seleccionar Rango</Text>
            <Text className="text-gray-400 text-xs mb-6">Define el periodo personalizado para el reporte.</Text>

            <View className="gap-4 mb-8">
              {/* Fecha Inicio */}
              <TouchableOpacity
                onPress={() => { setDateStep("start"); setShowDatePicker(true); }}
                className={`p-4 rounded-2xl border ${dateStep === "start" ? "border-[#13678A] bg-[#13678A]/5" : "border-gray-100 bg-gray-50"}`}
              >
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Inicial</Text>
                <Text className={`text-sm font-bold ${tempRange.start ? "text-gray-900" : "text-gray-300"}`}>
                  {tempRange.start ? tempRange.start.toLocaleDateString(undefined, { dateStyle: 'long' }) : "Seleccionar inicio..."}
                </Text>
              </TouchableOpacity>

              <View className="items-center">
                <Ionicons name="arrow-down" size={20} color="#E5E7EB" />
              </View>

              {/* Fecha Fin */}
              <TouchableOpacity
                onPress={() => { setDateStep("end"); setShowDatePicker(true); }}
                className={`p-4 rounded-2xl border ${dateStep === "end" ? "border-[#13678A] bg-[#13678A]/5" : "border-gray-100 bg-gray-50"}`}
                disabled={!tempRange.start}
              >
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Final (Opcional)</Text>
                <Text className={`text-sm font-bold ${tempRange.end ? "text-gray-900" : "text-gray-300"}`}>
                  {tempRange.end ? tempRange.end.toLocaleDateString(undefined, { dateStyle: 'long' }) : "Seleccionar fin..."}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRangeModal(false)}
                className="flex-1 py-4 items-center"
              >
                <Text className="text-gray-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyCustomRange}
                disabled={!tempRange.start}
                className={`flex-[2] py-4 rounded-2xl items-center ${tempRange.start ? "bg-[#13678A]" : "bg-gray-200"}`}
              >
                <Text className="text-white font-black">Aplicar Filtro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={dateStep === "start" ? (tempRange.start || new Date()) : (tempRange.end || tempRange.start || new Date())}
            mode="date"
            display="default"
            minimumDate={dateStep === "end" && tempRange.start ? tempRange.start : undefined}
            onChange={handleDateChange}
          />
        )}
      </Modal>

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
