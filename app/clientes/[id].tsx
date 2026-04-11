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
import { getClientById } from "../../services/client.service";
import { getLoansByClient } from "../../services/loan.service";
import { getPaymentsByLoan } from "../../services/payment.service";

// Paleta de colores principal de la app
const COLORS = {
  primary: '#13678A',        // Azul principal
  success: '#10B981',        // Verde para pagos
  secondary: '#0D8A7A',      // Verde azulado
  warning: '#F59E0B',        // Amarillo para pendiente
  danger: '#EF4444',         // Rojo para mora
  light: '#F3F4F6',          // Gris claro
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

      {/* Card de información del cliente con datos reales */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            padding: 20,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Header con avatar, nombre y botón cerrar */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Avatar con iniciales */}
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
                  {iniciales}
                </Text>
              </View>

              {/* Nombre completo y estado */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
                  {cliente.first_name} {cliente.last_name}
                </Text>
                <View style={{
                  backgroundColor: estado.color,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  alignSelf: 'flex-start',
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {estado.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Resumen financiero con datos reales */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>
                Total en deudas
              </Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                {formatCurrency(totalDeuda)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>
                Total abonado
              </Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                {formatCurrency(totalAbonado)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>
                Deuda pendiente
              </Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                {formatCurrency(deudaPendiente)}
              </Text>
            </View>
          </View>

          {/* Botones de acción rápida */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Abonar */}
            <TouchableOpacity
              style={{ alignItems: 'center', flex: 1 }}
              activeOpacity={0.7}
              onPress={() => setShowRegistroAbono(true)}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 12 }}>Abonar</Text>
            </TouchableOpacity>

            {/* Detalles */}
            <TouchableOpacity
              style={{ alignItems: 'center', flex: 1 }}
              activeOpacity={0.7}
              onPress={() => setShowDetallesCliente(true)}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <Ionicons name="document-text-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 12 }}>Detalles</Text>
            </TouchableOpacity>

            {/* Llamar */}
            <TouchableOpacity
              style={{ alignItems: 'center', flex: 1 }}
              activeOpacity={0.7}
              onPress={() => console.log("Llamar cliente")}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <Ionicons name="call-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 12 }}>Llamar</Text>
            </TouchableOpacity>

            {/* Mensajes */}
            <TouchableOpacity
              style={{ alignItems: 'center', flex: 1 }}
              activeOpacity={0.7}
              onPress={() => console.log("Enviar mensaje")}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <Ionicons name="chatbubble-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 12 }}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs de Préstamos y Abonos */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setActiveTab("prestamos")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: activeTab === "prestamos" ? 'white' : 'transparent',
            borderBottomWidth: activeTab === "prestamos" ? 3 : 0,
            borderBottomColor: COLORS.primary,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === "prestamos" ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            Préstamos ({prestamos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("abonos")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: activeTab === "abonos" ? 'white' : 'transparent',
            borderBottomWidth: activeTab === "abonos" ? 3 : 0,
            borderBottomColor: COLORS.primary,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === "abonos" ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            Abonos ({abonos.length})
          </Text>
        </TouchableOpacity>
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
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                  onPress={() => console.log("Ver préstamo", prestamo.id)}
                >
                  {/* Icono y estado */}
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="wallet-outline" size={20} color="white" />
                  </View>

                  {/* Información del préstamo */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
                      {formatCurrency(prestamo.principal_amount)}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                      Interés: {prestamo.interest_rate}% • Cuotas: {prestamo.installments}
                    </Text>
                  </View>

                  {/* Saldo pendiente */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: COLORS.danger, fontSize: 13, fontWeight: '700' }}>
                      {formatCurrency(prestamo.current_balance)}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {formatDate(prestamo.created_at)}
                    </Text>
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
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                  onPress={() => setShowDetallesAbono(true)}
                >
                  {/* Icono de pago exitoso */}
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  </View>

                  {/* Información del abono */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
                      {formatCurrency(abono.amount)}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                      {abono.payment_method || 'Método no especificado'}
                    </Text>
                  </View>

                  {/* Fecha del abono */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: COLORS.success, fontSize: 13, fontWeight: '700' }}>
                      Pagado
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {formatDate(abono.payment_date)}
                    </Text>
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
