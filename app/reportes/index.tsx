import React, { useState, useEffect } from "react";
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
import { Svg, Rect, Circle, Line, Path, Defs, LinearGradient as SvgGradient, Stop, G } from "react-native-svg";
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
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await ReportService.getLoanReport(user.id, {
        period: timePeriod,
        startDate: customRange.start?.toISOString(),
        endDate: customRange.end?.toISOString()
      });
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      // Pequeño delay para suavizar la transición
      setTimeout(() => setIsLoading(false), 300);
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
        setClients(clientsData);

        const { getPendingNotificationsUI } = await import("../../services/notification.service");
        const uiNotifications = await getPendingNotificationsUI(user.id);
        setNotifications(uiNotifications);
      } catch (error) {
        console.error("Error cargando datos en Reportes:", error);
      } finally {
        setIsLoading(false);
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
                ${reportData.metrics.totalAmount.toLocaleString()}
              </Text>
              <View className="flex-row items-center mt-1">
                 <Ionicons 
                    name={reportData.comparative.growth >= 0 ? "trending-up" : "trending-down"} 
                    size={14} 
                    color={reportData.comparative.growth >= 0 ? "#86efac" : "#fca5a5"} 
                 />
                 <Text className={`text-xs font-medium ml-1 ${reportData.comparative.growth >= 0 ? "text-green-300" : "text-red-300"}`}>
                   {reportData.comparative.growth >= 0 ? "+" : ""}{reportData.comparative.growth.toFixed(1)}% vs anterior
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

            {/* Intereses Proyectados y Cantidad (Grid) */}
            <View className="flex-row gap-4 mb-5">
              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">INTERÉS PROYECTADO</Text>
                <Text className="text-gray-800 text-xl font-black mb-1">
                  ${(reportData.metrics.totalInterest / 1000).toFixed(1)}k
                </Text>
                <Text className="text-gray-400 text-[10px]">Estimado del periodo</Text>
              </View>
              
              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">CANTIDAD OTORGADA</Text>
                <Text className="text-gray-800 text-xl font-black mb-1">{reportData.metrics.totalCount}</Text>
                <Text className={`text-[10px] font-bold ${reportData.comparative.countGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {reportData.comparative.countGrowth >= 0 ? "+" : ""}{reportData.comparative.countGrowth.toFixed(1)}% vs ant.
                </Text>
              </View>
            </View>

            {/* Distribución por Estatus (Donut Chart Premium) */}
            <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
              <Text className="text-gray-800 text-sm font-bold mb-6">Estatus de Cartera</Text>
              <View className="flex-row items-center justify-between">
                <View className="relative items-center justify-center">
                  <Svg width={130} height={130}>
                    <G rotation="-90" origin="65, 65">
                      {reportData.statusDistribution && reportData.statusDistribution.length > 0 ? (
                        (() => {
                          let currentAngle = 0;
                          return reportData.statusDistribution.map((item: any, i: number) => {
                            const angle = (item.percentage / 100) * 360;
                            const colors = ["#13678A", "#10B981", "#F59E0B", "#EF4444", "#9CA3AF"];
                            const color = colors[i % colors.length];
                            
                            const radius = 50;
                            const innerRadius = 35;
                            const centerX = 65;
                            const centerY = 65;

                            // Si es 100%, dibujamos un anillo completo de forma especial
                            if (angle >= 359.9) {
                              return (
                                <Path 
                                  key={i} 
                                  d={`M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY - 0.01} L ${centerX + innerRadius} ${centerY - 0.01} A ${innerRadius} ${innerRadius} 0 1 0 ${centerX + innerRadius} ${centerY} Z`} 
                                  fill={color} 
                                />
                              );
                            }

                            const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
                            const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
                            const x2 = centerX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                            const y2 = centerY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                            
                            const xi1 = centerX + innerRadius * Math.cos((currentAngle * Math.PI) / 180);
                            const yi1 = centerY + innerRadius * Math.sin((currentAngle * Math.PI) / 180);
                            const xi2 = centerX + innerRadius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                            const yi2 = centerY + innerRadius * Math.sin(((currentAngle + angle) * Math.PI) / 180);

                            const largeArc = angle > 180 ? 1 : 0;
                            const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
                            
                            currentAngle += angle;
                            return <Path key={i} d={d} fill={color} />;
                          });
                        })()
                      ) : (
                        // Estado Vacío: Anillo Gris
                        <Path 
                          d="M 115 65 A 50 50 0 1 1 115 64.99 L 100 64.99 A 35 35 0 1 0 100 65 Z" 
                          fill="#F1F5F9" 
                        />
                      )}
                    </G>
                  </Svg>
                  <View className="absolute items-center">
                    <Text className="text-gray-900 text-lg font-black">{reportData.metrics.totalCount}</Text>
                    <Text className="text-gray-400 text-[8px] font-bold uppercase">Total</Text>
                  </View>
                </View>

                <View className="flex-1 ml-6 gap-3">
                  {reportData.statusDistribution.map((item: any, i: number) => {
                    const colors = ["#13678A", "#10B981", "#F59E0B", "#EF4444", "#9CA3AF"];
                    const labels: any = { active: 'Activos', completed: 'Completados', overdue: 'En Mora', voided: 'Anulados' };
                    return (
                      <View key={i} className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }} />
                          <Text className="text-[11px] text-gray-600 font-medium">{labels[item.status] || item.status}</Text>
                        </View>
                        <Text className="text-[11px] text-gray-900 font-bold">{item.percentage.toFixed(0)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Nueva Sección: Diversificación por Tipo (Premium Horizontal Bars) */}
            <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
              <Text className="text-gray-800 text-sm font-bold mb-5">Diversificación de Cartera</Text>
              {reportData.typeDistribution.map((item: any, i: number) => {
                const maxAmount = Math.max(...reportData.typeDistribution.map((t: any) => t.amount), 1);
                const percentage = (item.amount / maxAmount) * 100;
                const labels: any = { personal: 'Personal', vehicle: 'Vehículo', housing: 'Vivienda', business: 'Negocio' };
                return (
                  <View key={i} className="mb-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600 text-[11px] font-medium">{labels[item.type] || item.type}</Text>
                      <Text className="text-gray-900 text-[11px] font-black">${item.amount.toLocaleString()}</Text>
                    </View>
                    <View className="h-2 bg-gray-50 rounded-full overflow-hidden">
                       <View 
                        className="h-full bg-[#13678A] rounded-full" 
                        style={{ width: `${percentage}%` as any }} 
                       />
                    </View>
                  </View>
                );
              })}
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
                {reportData.timeDistribution.length > 0 ? (
                  <>
                    <Svg width={chartWidth - 20} height={140}>
                      <Defs>
                        <SvgGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#13678A" stopOpacity="1" />
                          <Stop offset="1" stopColor="#13678A" stopOpacity="0.6" />
                        </SvgGradient>
                      </Defs>
                      {reportData.timeDistribution.map((item: any, i: number) => {
                        const maxAmount = Math.max(...reportData.timeDistribution.map((d: any) => d.amount), 1);
                        const h = (item.amount / maxAmount) * 120;
                        const barWidth = ((chartWidth - 20) / Math.max(reportData.timeDistribution.length, 4)) - 14;
                        const xPos = i * ((chartWidth - 20) / Math.max(reportData.timeDistribution.length, 4)) + 7;
                        return (
                          <Rect
                            key={i}
                            x={xPos}
                            y={140 - h}
                            width={barWidth}
                            height={h}
                            fill={i === reportData.timeDistribution.length - 1 ? "url(#barGradient)" : "#F1F5F9"}
                            rx={6}
                          />
                        );
                      })}
                    </Svg>
                    <View className="flex-row justify-between w-full mt-4 px-1">
                      {reportData.timeDistribution.map((item: any, i: number) => (
                        <Text key={i} className={`text-[9px] font-bold ${i === reportData.timeDistribution.length - 1 ? "text-[#13678A]" : "text-gray-400"}`}>
                          {item.label}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : (
                  <View className="h-[140px] items-center justify-center">
                    <Text className="text-gray-300 text-xs">Sin datos para este periodo</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Concentración de Riesgo: Top Deudores (NUEVO) */}
            <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-gray-800 text-sm font-bold">Concentración de Riesgo</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase">Top 3 Deudores</Text>
              </View>
              {reportData.topDebtors?.map((debtor: any, i: number) => (
                <View key={i} className={`flex-row justify-between items-center py-3 ${i !== reportData.topDebtors.length - 1 ? 'border-b border-gray-50' : ''}`}>
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
                    <Text className="text-gray-900 text-sm font-black">${debtor.totalDebt.toLocaleString()}</Text>
                    <Text className="text-[9px] text-slate-400">{( (debtor.totalDebt / (reportData.riskMetrics?.totalActiveBalance || 1)) * 100 ).toFixed(1)}% de la cartera</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Comparativa detallada */}
            <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
              <Text className="text-gray-800 text-sm font-bold mb-5">Comparativa vs Periodo Anterior</Text>
              {[
                { label: "Monto Promedio", current: reportData.metrics.avgAmount, prev: reportData.previousMetrics.avgAmount, unit: "$" },
                { label: "Capital Colocado", current: reportData.metrics.totalAmount, prev: reportData.previousMetrics.totalAmount, unit: "$" },
                { label: "Préstamos Realizados", current: reportData.metrics.totalCount, prev: reportData.previousMetrics.totalCount, unit: "" },
              ].map((item, i) => {
                const diff = item.prev > 0 ? ((item.current - item.prev) / item.prev) * 100 : 0;
                return (
                  <View key={i} className={`flex-row justify-between items-center py-4 ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                    <View>
                      <Text className="text-gray-500 text-xs font-medium">{item.label}</Text>
                      <Text className="text-[10px] text-gray-400">Prev: {item.unit}{item.prev.toLocaleString()}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-gray-800">
                        {item.unit}{item.current.toLocaleString()}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name={diff >= 0 ? "caret-up" : "caret-down"} size={10} color={diff >= 0 ? "#10B981" : "#EF4444"} />
                        <Text className={`text-[10px] font-bold ml-1 ${diff >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {Math.abs(diff).toFixed(1)}%
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
        {activeTab === "ganancias" && (
          <View className="animate-fade-in">
            {/* Utilidad Neta */}
            <View className="bg-[#10B981] rounded-[24px] p-6 mb-5 shadow-sm">
               <View className="flex-row items-center justify-between mb-3">
                 <Text className="text-white/90 text-xs font-bold tracking-wider">UTILIDAD NETA</Text>
                 <View className="bg-white/20 p-2 rounded-full">
                   <Ionicons name="trending-up" size={16} color="white" />
                 </View>
              </View>
              <Text className="text-white text-4xl font-black tracking-tight mb-2">$165,400</Text>
              <Text className="text-green-100 text-xs font-medium">+52% vs mes anterior</Text>
            </View>

            {/* Grid ROI y Eficiencia */}
            <View className="flex-row gap-4 mb-5">
              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">ROI</Text>
                <Text className="text-gray-800 text-2xl font-black mb-1">22.8%</Text>
                <Text className="text-blue-500 text-[10px] font-bold">Top 10%</Text>
              </View>
              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <Text className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">EFICIENCIA</Text>
                <Text className="text-gray-800 text-2xl font-black mb-1">82.8%</Text>
                <Text className="text-gray-400 text-[10px] font-medium">Operativa</Text>
              </View>
            </View>

            {/* Gráfico Combinado (Proyecciones) */}
            <View className="bg-white rounded-[24px] p-6 mb-5 shadow-sm border border-gray-100/50">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-800 text-sm font-bold">Proyección vs Realidad</Text>
                <View className="flex-row items-center gap-2">
                   <View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-[#13678A] mr-1"/><Text className="text-[10px] text-gray-500">Real</Text></View>
                   <View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-blue-100 mr-1"/><Text className="text-[10px] text-gray-500">Proy</Text></View>
                </View>
              </View>
              <View className="items-center">
                <Svg width={chartWidth - 20} height={140}>
                  {[65, 90, 75, 95, 85, 110].map((height, i) => {
                    const barWidth = ((chartWidth - 20) / 6) - 16;
                    const xCenter = i * ((chartWidth - 20) / 6) + 10;
                    return (
                      <React.Fragment key={i}>
                        {/* Proyectado (Fondo claro) */}
                        <Rect x={xCenter} y={140 - height - 15} width={barWidth} height={height + 15} fill="#DBEAFE" rx={6} />
                        {/* Real (Frente oscuro) */}
                        <Rect x={xCenter} y={140 - height} width={barWidth} height={height} fill="#13678A" rx={6} />
                      </React.Fragment>
                    );
                  })}
                </Svg>
                <View className="flex-row justify-between w-full mt-3 px-2">
                  {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN"].map((mes, i) => (
                    <Text key={i} className="text-[10px] font-bold text-gray-400">{mes}</Text>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Lista de Rendimiento */}
             <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100/50">
              <Text className="text-gray-800 text-sm font-bold mb-5">Desglose de Rendimiento</Text>
              {[
                { label: "Capital Recuperado", value: "$243.2k", trend: "up" },
                { label: "Interés Real Cobrado", value: "$178.9k", trend: "up" },
                { label: "Mora Recuperada", value: "$12.4k", trend: "neutral" },
              ].map((item, i) => (
                <View key={i} className={`flex-row justify-between items-center py-3 ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                  <Text className="text-gray-500 text-xs font-medium">{item.label}</Text>
                  <Text className="text-sm font-bold text-gray-800">{item.value}</Text>
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
                <Svg width={chartWidth - 20} height={80}>
                  <Path 
                    d={`M 10 60 Q ${(chartWidth-20)*0.25} 70, ${(chartWidth-20)*0.5} 40 T ${chartWidth-30} 10`} 
                    fill="none" 
                    stroke="#13678A" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                  <Circle cx={chartWidth-30} cy="10" r="4" fill="#13678A" />
                </Svg>
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
