import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import RegistroAbonoModal, { type AbonoFormData } from "../../components/clientes/RegistroAbonoModal";
import DetallesAbonoModal from "../../components/clientes/DetallesAbonoModal";
import DetallesClienteModal from "../../components/clientes/DetallesClienteModal";
import ProgressBar from "../../components/clientes/ProgressBar";
import { getClientById } from "../../services/client.service";
import { getLoansByClient } from "../../services/loan.service";
import { getPaymentsByLoan } from "../../services/payment.service";
import { generateClientStatusReport } from "../../services/pdf.service";
import { ConfirmationModal } from "../../components/shared/ConfirmationModal";
import { useAuth } from "../../contexts/AuthContext";

// Paleta de colores principal de la app
const COLORS = {
  primary: '#13678A',        // Azul principal
  success: '#10B981',        // Verde para pagos
  secondary: '#0D8A7A',      // Verde azulado
  warning: '#F59E0B',        // Amarillo para pendiente
  danger: '#EF4444',         // Rojo para mora
  light: '#F3F4F6',          // gris claro 
  text: '#111827',           // Texto oscuro
  textSecondary: '#6B7280',  // Texto gris
  border: '#E5E7EB',         // Borde gris
};

interface Prestamo {
  id: number;
  principal_amount: number;
  interest_rate: number;
  installments: number;
  created_at: string;
  status: string;
  current_balance: number;
}

interface Abono {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
}

/**
 * Pantalla de Detalle de Cliente
 * Carga datos reales del cliente, sus préstamos activos y abonos registrados
 */
export default function ClienteDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  // Estado de datos
  const [cliente, setCliente] = useState<any>(null);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<"prestamos" | "abonos">("prestamos");
  const [showRegistroAbono, setShowRegistroAbono] = useState(false);
  const [showDetallesAbono, setShowDetallesAbono] = useState(false);
  const [showDetallesCliente, setShowDetallesCliente] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cargar datos del cliente al montar el componente
  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  // Obtener datos reales del cliente, préstamos y abonos desde la BD
  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientId = parseInt(id as string);

      // Cargar cliente y sus préstamos
      const clientData = await getClientById(clientId);
      if (!clientData) {
        Alert.alert('Error', 'Cliente no encontrado');
        router.back();
        return;
      }

      // Cargar préstamos del cliente
      const loansData = await getLoansByClient(clientId);

      // Cargar abonos de todos los préstamos
      let allPayments: Abono[] = [];
      if (loansData && loansData.length > 0) {
        const paymentPromises = loansData.map((loan: any) =>
          getPaymentsByLoan(loan.id)
        );
        const paymentResults = await Promise.all(paymentPromises);
        // Aplanar all payments en un solo array
        allPayments = paymentResults.flat().filter(Boolean);
      }

      setCliente(clientData);
      setPrestamos(loansData || []);
      setAbonos(allPayments);
    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda colombiana
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fecha a formato legible
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Obtener estado del cliente basado en sus deudas pendientes
  const getEstadoCliente = () => {
    if (!cliente) return { color: COLORS.success, text: "Sin datos" };

    const totalDeuda = cliente.pendingDebt || 0;
    if (totalDeuda === 0) return { color: COLORS.success, text: "Al día" };
    if (totalDeuda > 0) return { color: COLORS.danger, text: "En mora" };
    return { color: COLORS.success, text: "Al día" };
  };

  // Calcular totales del cliente
  const getTotales = () => {
    const totalDeuda = cliente?.totalDebt || 0;
    const totalAbonado = cliente?.totalPaid || 0;
    const deudaPendiente = cliente?.pendingDebt || 0;

    return { totalDeuda, totalAbonado, deudaPendiente };
  };

  // Manejar registro de nuevo abono
  const handleRegistroAbono = async (abonoData: AbonoFormData) => {
    try {
      console.log("Nuevo abono registrado:", abonoData);
      Alert.alert('Éxito', 'Abono registrado correctamente');
      // Recargar datos después de registrar el abono
      await loadClientData();
    } catch (error) {
      console.error('Error registrando abono:', error);
      Alert.alert('Error', 'No se pudo registrar el abono');
    }
  };

  // Generar reporte de estado
  const handleGenerateStatusReport = async () => {
    try {
      setIsGenerating(true);
      const activeLoans = prestamos.filter(p => p.current_balance > 0);
      await generateClientStatusReport(cliente, activeLoans, user?.organization || undefined);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error', 'No se pudo generar el reporte de estado');
    } finally {
      setIsGenerating(false);
    }
  };
  // Abrir confirmación de reporte
  const handleOpenReportConfirmation = () => {
    // Alert.alert("Depuración", "Abriendo modal...");
    setShowConfirmation(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!cliente) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light }}>
        <Text style={{ color: COLORS.text, textAlign: 'center', marginTop: 20 }}>
          Cliente no encontrado
        </Text>
      </SafeAreaView>
    );
  }

  const estado = getEstadoCliente();
  const { totalDeuda, totalAbonado, deudaPendiente } = getTotales();
  const iniciales = `${cliente.first_name?.[0] || ''}${cliente.last_name?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ConfirmationModal
        visible={showConfirmation}
        title="Reporte de Estado"
        message={`¿Deseas generar un reporte detallado del estado de cuenta de ${cliente?.first_name || 'este cliente'}?`}
        promptText="El reporte incluirá todos los préstamos activos y el balance total."
        confirmButtonText="Generar Reporte"
        onClose={() => setShowConfirmation(false)}
        onGenerateReceipt={handleGenerateStatusReport}
        isGenerating={isGenerating}
      />

      {/* Card de información del cliente con datos reales - Rediseñada */}
      <View className="px-4 pt-4 pb-3" style={{ marginTop: 24 }}>
        <View
          className="bg-[#13678A] rounded-3xl p-5 overflow-hidden relative"
          style={{
            shadowColor: "#13678A",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          {/* Elementos decorativos de fondo */}
          <View pointerEvents="none" className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <View pointerEvents="none" className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full" />

          {/* Header con avatar, nombre y botón cerrar */}
          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-row items-center flex-1">
              {/* Avatar con iniciales */}
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-3 border-2 border-white/30">
                <Text className="text-white text-lg font-bold tracking-wider">
                  {iniciales}
                </Text>
              </View>

              {/* Nombre completo y estado */}
              <View className="flex-1">
                <Text className="text-white text-lg font-bold mb-1.5" numberOfLines={1}>
                  {cliente.first_name} {cliente.last_name}
                </Text>

                <View className="self-start px-2.5 py-1 rounded-full border border-white/50" style={{ backgroundColor: estado.color }}>
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                    {estado.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Resumen financiero con datos reales */}
          <View className="bg-white/10 rounded-2xl p-4 mb-5 border border-white/10">
            <View className="flex-row justify-between mb-2">
              <View>
                <Text className="text-white/70 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Crédito Activo
                </Text>
                <Text className="text-white text-lg font-black">
                  {formatCurrency(totalDeuda)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white/70 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Pendiente
                </Text>
                <Text className="text-red-300 text-lg font-black">
                  {formatCurrency(deudaPendiente)}
                </Text>
              </View>
            </View>
          </View>

          {/* Botones de acción rápida - Flotantes Modernos */}
          <View className="flex-row justify-around px-1">
            {/* Abonar */}
            <TouchableOpacity
              className="items-center"
              activeOpacity={0.7}
              onPress={() => setShowRegistroAbono(true)}
            >
              <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-1.5 border border-white/10">
                <Ionicons name="add" size={28} color="white" />
              </View>
              <Text className="text-white/90 text-[11px] font-semibold tracking-wide">Abonar</Text>
            </TouchableOpacity>

            {/* Editar */}
            <TouchableOpacity
              className="items-center"
              activeOpacity={0.7}
              onPress={() => setShowDetallesCliente(true)}
            >
              <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-1.5 border border-white/10">
                <Ionicons name="create" size={24} color="white" />
              </View>
              <Text className="text-white/90 text-[11px] font-semibold tracking-wide">Editar</Text>
            </TouchableOpacity>

            {/* Estado */}
            <TouchableOpacity
              className="items-center"
              activeOpacity={0.7}
              onPress={() => setShowConfirmation(true)}
            >
              <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-1.5 border border-white/10">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <Text className="text-white/90 text-[11px] font-semibold tracking-wide">Estado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs Modernos Segmentados */}
      <View className="px-4 pb-4">
        <View className="flex-row bg-slate-200/60 p-1 rounded-2xl">
          <TouchableOpacity
            onPress={() => setActiveTab("prestamos")}
            className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === "prestamos" ? "bg-white shadow-sm" : ""}`}
            activeOpacity={0.7}
            style={activeTab === "prestamos" ? {
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
            } : {}}
          >
            <Text className={`font-bold ${activeTab === "prestamos" ? "text-slate-800" : "text-slate-500"}`}>
              Préstamos ({prestamos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("abonos")}
            className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === "abonos" ? "bg-white shadow-sm" : ""}`}
            activeOpacity={0.7}
            style={activeTab === "abonos" ? {
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
            } : {}}
          >
            <Text className={`font-bold ${activeTab === "abonos" ? "text-slate-800" : "text-slate-500"}`}>
              Abonos ({abonos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido con scroll - Préstamos o Abonos */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {/* Lista de PRÉSTAMOS */}
        {activeTab === "prestamos" && (
          <View>
            {prestamos.length > 0 ? (
              prestamos.map((prestamo) => (
                <TouchableOpacity
                  key={prestamo.id}
                  className="bg-white rounded-[20px] p-4 mb-4 border border-slate-100/60"
                  activeOpacity={0.7}
                  style={{
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                  onPress={() => console.log("Ver préstamo", prestamo.id)}
                >
                  <View className="flex-row items-center mb-3">
                    {/* Icono soft */}
                    <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                      <Ionicons name="wallet" size={18} color="#3b82f6" />
                    </View>

                    {/* Información cabecera */}
                    <View className="flex-1">
                      <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Préstamo Capital
                      </Text>
                      <Text className="text-slate-800 text-base font-black">
                        {formatCurrency(prestamo.principal_amount)}
                      </Text>
                    </View>

                    <View className="items-end bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Text className="text-slate-500 text-[10px] font-bold">
                        {prestamo.interest_rate}% INT
                      </Text>
                      <Text className="text-slate-400 text-[10px]">
                        {prestamo.installments} cuotas
                      </Text>
                    </View>
                  </View>

                  {/* Barra e info de deuda */}
                  <View className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-slate-500 text-[11px] font-medium">Deuda Actual</Text>
                      <Text className="text-red-500 font-bold">{formatCurrency(prestamo.current_balance)}</Text>
                    </View>
                    <ProgressBar
                      percentage={prestamo.principal_amount > 0 ? ((prestamo.principal_amount - prestamo.current_balance) / prestamo.principal_amount) * 100 : 0}
                      color="#10B981"
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-[10px] ml-1">{formatDate(prestamo.created_at)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.border} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 14 }}>
                  No hay préstamos registrados
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Lista de ABONOS */}
        {activeTab === "abonos" && (
          <View>
            {abonos.length > 0 ? (
              abonos.map((abono) => (
                <TouchableOpacity
                  key={abono.id}
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-100/60"
                  activeOpacity={0.7}
                  style={{
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.03,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                  onPress={() => setShowDetallesAbono(true)}
                >
                  <View className="flex-row items-center">
                    {/* Icono de pago exitoso soft */}
                    <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>

                    {/* Información del abono */}
                    <View className="flex-1">
                      <Text className="text-slate-800 text-[15px] font-bold mb-0.5">
                        {formatCurrency(abono.amount)}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="card" size={10} color="#94a3b8" />
                        <Text className="text-slate-500 text-[11px] ml-1">
                          {abono.payment_method || 'Método no especificado'}
                        </Text>
                      </View>
                    </View>

                    {/* Fecha del abono */}
                    <View className="items-end">
                      <View className="bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 mb-1">
                        <Text className="text-emerald-700 text-[10px] font-bold uppercase">
                          Pagado
                        </Text>
                      </View>
                      <Text className="text-slate-400 text-[10px]">
                        {formatDate(abono.payment_date)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <Ionicons name="cash-outline" size={48} color={COLORS.border} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 14 }}>
                  No hay abonos registrados
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Registro de Abono */}
      <RegistroAbonoModal
        visible={showRegistroAbono}
        onClose={() => setShowRegistroAbono(false)}
        onSubmit={handleRegistroAbono}
        clienteId={id}
      />

      {/* Modal de Detalles de Abono */}
      <DetallesAbonoModal
        visible={showDetallesAbono}
        onClose={() => setShowDetallesAbono(false)}
        onEdit={() => setShowDetallesAbono(false)}
        totalAbonado={totalAbonado}
        cantidadAbonos={abonos.length}
        detalles={[]}
        nota=""
      />

      {/* Modal de Detalles del Cliente */}
      <DetallesClienteModal
        visible={showDetallesCliente}
        onClose={() => setShowDetallesCliente(false)}
        cliente={{
          nombre: `${cliente.first_name} ${cliente.last_name}`,
          iniciales: iniciales,
          estado: estado.text as any,
          totalDeuda: totalDeuda,
          totalAbonado: totalAbonado,
          totalPendiente: deudaPendiente,
          fechaRegistro: formatDate(cliente.created_at) + " - " + new Date(cliente.created_at).toLocaleTimeString('es-CO'),
          telefono: cliente.phones?.[0]?.number || 'No disponible',
          tipoDocumento: cliente.document_type || 'No especificado',
          numeroDocumento: cliente.document_number || 'No disponible',
          proximoPagoCuota: "Por definir",
          direccion: cliente.address_line || 'No disponible',
          nota: cliente.notes || 'Sin notas',
        }}
      />

    </SafeAreaView>
  );
}
