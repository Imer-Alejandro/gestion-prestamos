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
  
  // Estados para detalle de provincia
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [provinceClients, setProvinceClients] = useState<any[]>([]);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [isProvinceLoading, setIsProvinceLoading] = useState(false);

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
      } else if (activeTab === "clientes") {
        data = await ReportService.getClientReport(user.id, {
          period: timePeriod,
          startDate: customRange.start?.toISOString(),
          endDate: customRange.end?.toISOString()
        });
      } else {
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

  const handleProvincePress = async (province: string) => {
    if (!user?.id) return;
    setSelectedProvince(province);
    setIsProvinceLoading(true);
    setShowProvinceModal(true);
    try {
      const data = await ReportService.getClientsByProvince(user.id, province);
      setProvinceClients(data);
    } catch (error) {
      console.error("Error fetching clients by province:", error);
    } finally {
      setIsProvinceLoading(false);
    }
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

                {/* NUEVO: Métodos de Pago */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Distribución por Método de Pago</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-6 gap-4">
                      {(reportData?.paymentMethods || []).map((pm: any, i: number) => {
                        const colors = ["#13678A", "#10B981", "#3B82F6", "#F59E0B"];
                        const labels: any = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', other: 'Otro' };
                        const total = (reportData?.paymentMethods || []).reduce((acc: any, curr: any) => acc + curr.amount, 0) || 1;
                        const percentage = (pm.amount / total) * 100;
                        return (
                          <View key={i}>
                            <View className="flex-row justify-between mb-1.5">
                              <Text className="text-[10px] text-gray-500 font-bold uppercase">{labels[pm.method] || pm.method}</Text>
                              <Text className="text-[10px] text-gray-900 font-black">{percentage.toFixed(0)}%</Text>
                            </View>
                            <View className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <View 
                                className="h-full rounded-full" 
                                style={{ width: `${percentage}%`, backgroundColor: colors[i % colors.length] }} 
                              />
                            </View>
                          </View>
                        );
                      })}
                      {(reportData?.paymentMethods || []).length === 0 && (
                        <Text className="text-gray-300 text-xs italic">Sin datos de pagos</Text>
                      )}
                    </View>
                    <View className="items-center">
                       <Ionicons name="card" size={48} color="#E2E8F0" />
                    </View>
                  </View>
                </View>

                {/* NUEVO: Rentabilidad por Tipo */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Utilidad por Tipo de Préstamo</Text>
                  <View className="items-center">
                    {(reportData?.profitByType || []).length > 0 ? (
                      <BarChart
                        data={(reportData?.profitByType || []).map((item: any) => ({
                          value: item.profit,
                          label: item.type === 'personal' ? 'Pers.' : item.type === 'vehicle' ? 'Veh.' : item.type === 'business' ? 'Neg.' : 'Otros',
                          frontColor: '#10B981',
                        }))}
                        width={chartWidth - 120}
                        height={140}
                        barWidth={30}
                        spacing={40}
                        noOfSections={3}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        yAxisLabelPrefix="$"
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                      />
                    ) : (
                      <View className="h-20 justify-center">
                        <Text className="text-gray-300 text-xs">Sin datos de rentabilidad</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* NUEVO: Top Clientes Rentables */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-gray-800 text-sm font-black">Top Clientes Rentables</Text>
                    <Ionicons name="trophy" size={18} color="#F59E0B" />
                  </View>
                  {(reportData?.topProfitableClients || []).map((client: any, i: number) => (
                    <View key={i} className={`flex-row items-center justify-between py-3 ${i !== (reportData?.topProfitableClients?.length - 1) ? 'border-b border-gray-50' : ''}`}>
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center mr-3">
                          <Text className="text-gray-400 font-bold text-[10px]">{i + 1}</Text>
                        </View>
                        <View>
                          <Text className="text-gray-900 text-[11px] font-bold">{client.name}</Text>
                          <Text className="text-gray-400 text-[9px]">{client.paymentCount} pagos realizados</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-[#10B981] text-[11px] font-black">+${(client.profit || 0).toLocaleString()}</Text>
                        <Text className="text-gray-400 text-[8px] font-medium uppercase">Utilidad Generada</Text>
                      </View>
                    </View>
                  ))}
                  {(reportData?.topProfitableClients || []).length === 0 && (
                    <Text className="text-gray-300 text-xs text-center py-4">Sin datos disponibles</Text>
                  )}
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
                        <View className="w-8 h-8 rounded-xl items-center justify-center mr-3 bg-gray-50">
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

            {activeTab === "clientes" && reportData && (
              <View className="animate-fade-in">
                {/* Hero Card: Total Clientes */}
                <View className="bg-[#13678A] rounded-[32px] p-8 mb-6 shadow-xl relative overflow-hidden">
                  <View className="absolute -right-10 -top-10 opacity-10">
                    <Ionicons name="people" size={180} color="white" />
                  </View>
                  
                  <View className="flex-row items-center justify-between mb-4 relative z-10">
                    <Text className="text-white/80 text-[10px] font-black tracking-[2px] uppercase">BASE TOTAL DE CLIENTES</Text>
                    <View className="bg-white/20 p-2 rounded-2xl">
                      <Ionicons name="people-circle" size={18} color="white" />
                    </View>
                  </View>

                  <View className="relative z-10">
                    <Text className="text-white text-5xl font-black tracking-tighter mb-2">
                      {reportData?.metrics?.total || 0}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-green-400/30 flex-row items-center px-2.5 py-1 rounded-full">
                        <Ionicons name="add" size={12} color="white" />
                        <Text className="text-white text-[11px] font-bold ml-1">
                          {reportData?.metrics?.newClients || 0}
                        </Text>
                      </View>
                      <Text className="text-white/60 text-[10px] font-medium ml-2 uppercase tracking-wider">Nuevos este periodo</Text>
                    </View>
                  </View>
                </View>

                {/* Grid: Demografía y Retención */}
                <View className="flex-row gap-4 mb-6">
                   <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                    <Text className="text-gray-400 text-[9px] font-black tracking-widest uppercase mb-4 text-center">Género</Text>
                    <View className="items-center">
                      <PieChart
                        data={(reportData?.genderDistribution || []).map((item: any, i: number) => {
                          const g = (item.gender || '').toLowerCase();
                          return {
                            value: item.count,
                            color: g === 'masculino' || g === 'm' ? '#3B82F6' : g === 'femenino' || g === 'f' ? '#EC4899' : '#94A3B8',
                          };
                        })}
                        radius={35}
                        innerRadius={25}
                        donut
                      />
                      <View className="flex-row gap-2 mt-4 justify-center">
                        <View className="flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                          <Text className="text-[8px] text-gray-500 font-bold">M</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-1" />
                          <Text className="text-[8px] text-gray-500 font-bold">F</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50 items-center justify-center">
                    <Ionicons name="ribbon-outline" size={24} color="#13678A" />
                    <Text className="text-gray-400 text-[9px] font-black tracking-widest uppercase mt-2 mb-1">Fidelidad</Text>
                    <Text className="text-gray-900 text-2xl font-black">{reportData?.metrics?.retentionRate || 0}%</Text>
                    <Text className="text-gray-400 text-[8px] font-medium text-center">Tasa de retorno</Text>
                  </View>
                </View>

                {/* Tendencia de Crecimiento */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Crecimiento de Cartera</Text>
                  <View className="items-center">
                    {(reportData?.growthTrend || []).length > 0 ? (
                      <LineChart
                        data={(reportData?.growthTrend || []).map((item: any) => ({
                          value: item.count,
                          label: item.label,
                          dataPointLabelComponent: () => (
                            <View style={{ marginBottom: 10, width: 30, marginLeft: -10 }}>
                              <Text className="text-[8px] font-black text-[#13678A] text-center">{item.count}</Text>
                            </View>
                          ),
                        }))}
                        width={chartWidth - 100}
                        height={100}
                        thickness={3}
                        color="#13678A"
                        dataPointsColor="#13678A"
                        noOfSections={3}
                        hideRules
                        yAxisThickness={0}
                        xAxisThickness={0}
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                        isAnimated
                        curved
                        spacing={45}
                      />
                    ) : (
                      <View className="h-20 justify-center">
                        <Text className="text-gray-300 text-xs">Sin datos de tendencia</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* NUEVO: Distribución por Edad */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Distribución por Edad</Text>
                  <View className="items-center">
                    {(reportData?.ageDistribution || []).length > 0 ? (
                      <BarChart
                        data={(reportData?.ageDistribution || []).map((item: any, i: number) => ({
                          value: item.count,
                          label: item.label,
                          frontColor: ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#818CF8"][i % 5],
                        }))}
                        width={chartWidth - 100}
                        height={120}
                        barWidth={35}
                        spacing={15}
                        noOfSections={3}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 8, fontWeight: 'bold' }}
                      />
                    ) : (
                      <View className="h-20 justify-center">
                        <Text className="text-gray-300 text-xs">Sin datos demográficos</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Perfil Laboral (Ocupaciones) */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Perfil por Ocupación</Text>
                  {(reportData?.occupationDistribution || []).map((item: any, i: number) => {
                    const total = (reportData?.occupationDistribution || []).reduce((acc: any, curr: any) => acc + curr.count, 0) || 1;
                    const percentage = (item.count / total) * 100;
                    return (
                      <View key={i} className="mb-4">
                        <View className="flex-row justify-between mb-1.5">
                          <Text className="text-[10px] text-gray-500 font-bold uppercase">{item.label || 'Otros'}</Text>
                          <Text className="text-[10px] text-gray-900 font-black">{item.count} Clientes</Text>
                        </View>
                        <View className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <View 
                            className="h-full bg-[#13678A] rounded-full" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* NUEVO: Segmentación por Calidad Crediticia */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-gray-800 text-sm font-black">Calidad Crediticia (A-B-C)</Text>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <PieChart
                      data={(reportData?.qualitySegmentation || []).map((item: any) => ({
                        value: item.count,
                        color: item.label === 'Clase A' ? '#10B981' : 
                               item.label === 'Clase B' ? '#F59E0B' : 
                               item.label === 'Clase C' ? '#EF4444' : '#94A3B8',
                      }))}
                      radius={45}
                      innerRadius={30}
                      donut
                    />
                    <View className="flex-1 ml-8 gap-3">
                      {(reportData?.qualitySegmentation || []).map((item: any, i: number) => (
                        <View key={i} className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className={`w-2 h-2 rounded-full mr-2 ${
                              item.label === 'Clase A' ? 'bg-green-500' : 
                              item.label === 'Clase B' ? 'bg-amber-500' : 
                              item.label === 'Clase C' ? 'bg-red-500' : 'bg-slate-400'
                            }`} />
                            <Text className="text-gray-600 text-[10px] font-bold uppercase">{item.label}</Text>
                          </View>
                          <Text className="text-gray-900 text-[10px] font-black">{item.count} Clientes</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* NUEVO: Distribución de Ingresos */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <Text className="text-gray-800 text-sm font-black mb-6">Nivel Socioeconómico (Ingresos)</Text>
                  <View className="items-center">
                    {(reportData?.incomeDistribution || []).length > 0 ? (
                      <BarChart
                        data={(reportData?.incomeDistribution || []).map((item: any, i: number) => ({
                          value: item.count,
                          label: item.label.split(' ')[0], // Solo la primera palabra para el eje X
                          frontColor: '#13678A',
                          topLabelComponent: () => (
                            <Text className="text-[8px] font-bold text-gray-400 mb-1">{item.count}</Text>
                          )
                        }))}
                        width={chartWidth - 100}
                        height={100}
                        barWidth={40}
                        spacing={15}
                        noOfSections={3}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        hideRules
                        yAxisTextStyle={{ color: '#94A3B8', fontSize: 8 }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 7, fontWeight: 'bold' }}
                      />
                    ) : (
                      <View className="h-20 justify-center">
                        <Text className="text-gray-300 text-xs">Sin datos de ingresos</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Concentración Geográfica - Interactivo */}
                <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-5">
                    <View>
                      <Text className="text-gray-800 text-sm font-black">Concentración Geográfica</Text>
                      <Text className="text-gray-400 text-[9px] uppercase font-bold">Toca para ver sectores y clientes</Text>
                    </View>
                    <Ionicons name="map-outline" size={18} color="#13678A" />
                  </View>
                  {(reportData?.geographicDistribution || []).map((item: any, i: number) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => handleProvincePress(item.label || 'No especificada')}
                      activeOpacity={0.6}
                      className={`flex-row justify-between items-center py-3 ${i !== (reportData?.geographicDistribution?.length - 1) ? 'border-b border-gray-50' : ''}`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-blue-50 w-7 h-7 rounded-lg items-center justify-center mr-3">
                          <Ionicons name="location-outline" size={14} color="#13678A" />
                        </View>
                        <Text className="text-gray-600 text-xs font-medium">{item.label || 'No especificada'}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="bg-gray-50 px-2 py-1 rounded-md mr-2">
                          <Text className="text-gray-900 text-[10px] font-black">{item.count} clientes</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={12} color="#CBD5E1" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Top Clientes Fieles (Leadboard) */}
                <View className="bg-white rounded-[24px] p-6 mb-10 shadow-sm border border-gray-100/50">
                  <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-gray-800 text-sm font-black">Top Clientes Fieles</Text>
                    <Ionicons name="star" size={18} color="#F59E0B" />
                  </View>
                  {(reportData?.topLoyalClients || []).map((client: any, i: number) => (
                    <View key={i} className={`flex-row items-center justify-between py-4 ${i !== (reportData?.topLoyalClients?.length - 1) ? 'border-b border-gray-50' : ''}`}>
                      <View className="flex-row items-center flex-1">
                        <View className="w-9 h-9 bg-teal-50 rounded-full items-center justify-center mr-3">
                          <Text className="text-teal-600 font-bold text-xs">{i + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 text-xs font-bold" numberOfLines={1}>{client.name}</Text>
                          <Text className="text-gray-400 text-[9px] uppercase font-medium">{client.loanCount} préstamos completados</Text>
                        </View>
                      </View>
                      <View className="items-end ml-2">
                        <Text className="text-[#13678A] text-xs font-black">${(client.totalValue || 0).toLocaleString()}</Text>
                        <Text className="text-gray-400 text-[8px] uppercase">Operado Total</Text>
                      </View>
                    </View>
                  ))}
                  {(reportData?.topLoyalClients || []).length === 0 && (
                    <Text className="text-gray-300 text-xs text-center py-4 italic">No hay historial suficiente</Text>
                  )}
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

      {/* Modal de Detalle por Provincia */}
      <Modal
        visible={showProvinceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[32px] h-[70%] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-900 text-xl font-bold">{selectedProvince}</Text>
                <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest mt-1">Listado de Clientes y Sectores</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowProvinceModal(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isProvinceLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400 text-xs font-bold uppercase animate-pulse">Consultando zona...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {(provinceClients || []).length > 0 ? (
                  (provinceClients || []).map((client: any, i: number) => (
                    <View key={i} className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center justify-between border border-gray-100">
                      <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-sm">{client.name}</Text>
                        <View className="flex-row items-center mt-1.5">
                          <Ionicons name="map" size={12} color="#13678A" />
                          <Text className="text-gray-500 text-[10px] font-medium ml-1.5" numberOfLines={1}>{client.address_line || 'Sector no especificado'}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowProvinceModal(false);
                          // Pequeño delay para dejar que el modal anterior se cierre
                          setTimeout(() => setSelectedClient(client), 300);
                        }}
                        className="bg-white w-10 h-10 rounded-xl items-center justify-center shadow-sm border border-gray-100 ml-3"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye" size={18} color="#13678A" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View className="items-center py-20">
                    <Ionicons name="people-outline" size={48} color="#E2E8F0" />
                    <Text className="text-gray-400 text-xs mt-4">No hay clientes registrados en esta provincia</Text>
                  </View>
                )}
                <View className="h-10" />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
