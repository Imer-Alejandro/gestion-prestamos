import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  InteractionManager
} from "react-native";
import AppHeader from "../../components/shared/AppHeader";
import Skeleton from "../../components/shared/Skeleton";
import NotificationModal from "../../components/home/NotificationModal";
import { PrestamoCard } from "../../components/prestamos_abonos/PrestamoCard";
import { AbonoCard } from "../../components/prestamos_abonos/AbonoCard";
import { NuevoPrestamoModal } from "../../components/prestamos_abonos/NuevoPrestamoModal";
import { RegistroAbonoModal } from "../../components/prestamos_abonos/RegistroAbonoModal";
import { DetallesPrestamoModal } from "../../components/prestamos_abonos/DetallesPrestamoModal";
import { DetallesAbonoModal } from "../../components/prestamos_abonos/DetallesAbonoModal";
import { FiltrosPrestamoModal } from "../../components/prestamos_abonos/FiltrosPrestamoModal";
import { Abono } from "../../components/prestamos_abonos/AbonoCard";
import { QuickActionFAB } from "../../components/shared/QuickActionFAB";
import SearchResultsOverlay from "../../components/shared/SearchResultsOverlay";
import ClientDetailsModal from "../../components/shared/ClientDetailsModal";
import { ConfirmationModal } from "../../components/shared/ConfirmationModal";
import { generateLoanReceipt, generatePaymentReceipt } from "../../services/pdf.service";
import { PlanManager } from "../../services/quota.service";
import { getLoanById } from "../../services/loan.service";
import { getPaymentById } from "../../services/payment.service";

import {
  formatCurrencyPrestamos,
  type Prestamo
} from "../../data/prestamosData";
import { mockNotifications } from "../../data/homeData";
import { useAuth } from "../../contexts/AuthContext";

// Importar servicios
import { getLoans, createLoan, voidLoan } from "../../services/loan.service";
import { createPayment, getAllPayments } from "../../services/payment.service";

import { getClients, getClientById } from "../../services/client.service";

/**
 * Pantalla de Préstamos y Abonos
 * Muestra listado de préstamos activos y abonos realizados
 */
export default function PrestamosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNuevoPrestamo, setShowNuevoPrestamo] = useState(false);
  const [showRegistroAbono, setShowRegistroAbono] = useState(false);
  const [showDetallesPrestamo, setShowDetallesPrestamo] = useState(false);
  const [showDetallesAbono, setShowDetallesAbono] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [selectedAbono, setSelectedAbono] = useState<Abono | null>(null);
  const [editAbonoData, setEditAbonoData] = useState<any>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Estados para Confirmación Profesional
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    type: 'loan' | 'payment';
    data: any;
  } | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);


  // Estado de datos
  const [loans, setLoans] = useState<Prestamo[]>([]);
  const [abonos, setAbonos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const userData = {
    name: user?.full_name || "Usuario",
    role: "Gestor operador",
    avatar: null,
  };

  const [activeTab, setActiveTab] = useState<"prestamos" | "abonos">("prestamos");
  const [showFiltros, setShowFiltros] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // Base: Mostrar todos
    payment_frequency: 'all',
    date: null
  });

  // Cargar datos al cambiar filtros o usuario
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, filters]); // eslint-disable-line react-hooks/exhaustive-deps


  const loadData = useCallback(async () => {
    // Diferir la carga hasta después de la interacción/transición
    InteractionManager.runAfterInteractions(async () => {
      try {
        const [loansData, clientsData] = await Promise.all([
          getLoans(user?.id || 0, filters),
          getClients(user?.id || 0)
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

        // Cargar todos los abonos
        const abonosData = await getAllPayments(user?.id || 0);
        setAbonos(abonosData);

        // Cargar notificaciones reales de la base de datos
        const { getPendingNotificationsUI } = await import("../../services/notification.service");
        const uiNotifications = await getPendingNotificationsUI(user?.id || 0);
        setNotifications(uiNotifications);

        setIsLoading(false);
      } catch (error) {
        console.error("Error cargando datos:", error);
        Alert.alert('Error', 'No se pudieron cargar los datos');
        setIsLoading(false);
      }
    });
  }, [user?.id, filters]);

  // Calcular métricas para la tarjeta de resumen
  const totalDeudasPendientes = loans.reduce(
    (sum, prestamo) => sum + prestamo.deudaPendiente,
    0
  );

  const prestamosActivos = loans.filter(l => l.status === 'activo').length;
  const prestamosAtrasados = loans.filter(l => l.status === 'atrasado').length;
  const totalPrestamos = loans.length;

  // Maneja la eliminación de notificaciones
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

  // Maneja la búsqueda de clientes (Overlay)
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
    c.document_number.includes(searchQuery)
  );

  // Determinar si hay filtros activos (diferentes al defecto 'all')
  const isFiltering = filters.status !== 'all' ||
    filters.payment_frequency !== 'all' ||
    filters.date !== null;


  // Los préstamos ya no se filtran por la barra de búsqueda general
  const filteredLoans = loans;


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
        {
          text: "Registrar Pago", onPress: () => {
            const prestamo = loans.find(p => p.id === prestamoId);
            if (prestamo) {
              setSelectedPrestamo(prestamo);
              setShowRegistroAbono(true);
            }
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // Detalle del abono
  const handleAbonoPress = (abono: any) => {
    setSelectedAbono(abono);
    setShowDetallesAbono(true);
  };

  // Menú de opciones del abono
  const handleAbonoMenu = (abono: any) => {
    Alert.alert(
      "Opciones de Abono",
      "¿Qué acción deseas realizar?",
      [
        { text: "Ver Detalle", onPress: () => handleAbonoPress(abono) },
        { text: "Eliminar", onPress: () => console.log("Eliminar abono:", abono.id), style: "destructive" },
        { text: "Editar", onPress: () => console.log("Editar abono:", abono.id) },
        { text: "Comprobante", onPress: () => console.log("Generar comprobante:", abono.id) },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // Registrar pago/abono
  const handleRegisterPayment = async (paymentData: any) => {
    try {
      const paymentId = await createPayment({ ...paymentData, user_id: user?.id || 0 });
      const fullPayment = await getPaymentById(paymentId);
      const fullLoan = await getLoanById(paymentData.loan_id);
      const client = await getClientById(fullLoan.client_id);

      setConfirmationConfig({
        title: "Abono Registrado",
        message: `Se ha recibido el pago de $${Number(paymentData.amount).toLocaleString()} correctamente.`,
        type: 'payment',
        data: { payment: fullPayment, loan: fullLoan, client }
      });

      await loadData();
      setShowRegistroAbono(false);
      setEditAbonoData(null);
      setShowDetallesPrestamo(false);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error registrando pago:", error);
      Alert.alert('Error', 'No se pudo registrar el pago');
    }
  };

  const handleGenerateReceipt = async () => {
    if (!confirmationConfig) return;
    try {
      setIsGeneratingReceipt(true);
      
      // Validar cuota antes de proceder
      if (user?.id) {
        const check = await PlanManager.canExecute(user.id, 'generateReceipt');
        if (!check.allowed) {
          Alert.alert("Límite Alcanzado", check.reason || undefined);
          setIsGeneratingReceipt(false);
          return;
        }
      }

      if (confirmationConfig.type === 'loan') {
        await generateLoanReceipt(
          confirmationConfig.data.loan,
          confirmationConfig.data.client,
          user?.id,
          user?.organization || undefined
        );
        if (user?.id) await PlanManager.registerOperation(user.id, 'generateReceipt');
      } else {
        await generatePaymentReceipt(
          confirmationConfig.data.payment,
          confirmationConfig.data.loan,
          confirmationConfig.data.client,
          user?.id,
          user?.organization || undefined
        );
        if (user?.id) await PlanManager.registerOperation(user.id, 'generateReceipt');
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Error", "No se pudo generar el comprobante en PDF.");
    } finally {
      setIsGeneratingReceipt(false);
    }
  };


  // Anular préstamo (soft-delete)
  const handleVoidLoan = async (prestamoId: string) => {
    try {
      await voidLoan(parseInt(prestamoId));
      await loadData(); // Recargar para que desaparezca de la lista
    } catch (error) {
      console.error("Error anulando préstamo:", error);
      Alert.alert('Error', 'No se pudo anular el préstamo. Intenta nuevamente.');
    }
  };

  // Crear nuevo préstamo
  const handleCreateLoan = async (loanData: any) => {
    try {
      const loanId = await createLoan({ ...loanData, user_id: user?.id || 0 });
      const fullLoan = await getLoanById(loanId);
      const client = await getClientById(loanData.client_id);

      setConfirmationConfig({
        title: "Préstamo Confirmado",
        message: `El préstamo para ${client?.first_name || 'el cliente'} ha sido registrado exitosamente.`,
        type: 'loan',
        data: { loan: fullLoan, client }
      });

      await loadData();
      setShowNuevoPrestamo(false);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error creando préstamo:", error);
      Alert.alert('Error', 'No se pudo crear el préstamo');
    }
  };

  // Renderizar card de préstamo
  const renderPrestamoCard = (prestamo: Prestamo) => (
    <PrestamoCard
      key={prestamo.id}
      prestamo={prestamo}
      onPress={() => handlePrestamoPress(prestamo.id)}
      onMenuPress={() => handlePrestamoMenu(prestamo.id)}
      onVoid={handleVoidLoan}
    />
  );

  // Renderizar card de abono
  const renderAbonoCard = (abono: any) => (
    <AbonoCard
      key={abono.id}
      abono={abono}
      onPress={() => handleAbonoPress(abono)}
    />
  );


  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

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

      {/* Info Card - Resumen de Préstamos (Versión Compacta) */}
      <View
        className="bg-[#13678A] rounded-3xl p-4 mx-4 mt-3 mb-4 overflow-hidden relative"
        style={{
          shadowColor: "#13678A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Elementos decorativos */}
        <View className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full" />
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full" />

        <View className="flex-row items-center mb-3">
          <View className="bg-white/20 p-1.5 rounded-lg mr-2">
            <Ionicons name="stats-chart" size={14} color="#ffffff" />
          </View>
          <Text className="text-white/90 text-[10px] uppercase tracking-widest font-bold">
            Resumen de Préstamos
          </Text>
        </View>

        <View className="flex-row justify-between items-center bg-white/10 rounded-xl p-3 mb-3 border border-white/10">
          <View className="items-center flex-1">
            <Text className="text-white/80 text-[9px] uppercase font-bold mb-0.5">Total</Text>
            <Text className="text-white text-lg font-black">{totalPrestamos}</Text>
          </View>

          <View className="w-px h-8 bg-white/20" />

          <View className="items-center flex-1">
            <Text className="text-red-200/90 text-[9px] uppercase font-bold mb-0.5">Atrasados</Text>
            <Text className="text-red-300 text-lg font-black">{prestamosAtrasados}</Text>
          </View>

          <View className="w-px h-8 bg-white/20" />

          <View className="items-center flex-1">
            <Text className="text-green-200/90 text-[9px] uppercase font-bold mb-0.5">Al día</Text>
            <Text className="text-green-300 text-lg font-black">{prestamosActivos}</Text>
          </View>
        </View>

        <View className="items-center">
          <Text className="text-white/70 text-[10px] uppercase tracking-wider font-medium">
            Deuda Total Pendiente
          </Text>
          <Text className="text-white text-2xl font-black tracking-tight">
            {formatCurrencyPrestamos(totalDeudasPendientes)}
          </Text>
        </View>
      </View>

      {/* Tabs de Préstamos y Abonos */}
      <View className="flex-row px-4 mb-3">
        <TouchableOpacity
          onPress={() => setActiveTab("prestamos")}
          className={`flex-1 py-3 mr-2 rounded-lg ${activeTab === "prestamos" ? "bg-white" : "bg-transparent"
            }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${activeTab === "prestamos" ? "text-gray-900" : "text-gray-500"
              }`}
          >
            Préstamos ({filteredLoans.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("abonos")}
          className={`flex-1 py-3 ml-2 rounded-lg ${activeTab === "abonos" ? "bg-white" : "bg-transparent"
            }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${activeTab === "abonos" ? "text-gray-900" : "text-gray-500"
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
            {/* Header de préstamos con filtros */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 text-sm font-medium">
                Préstamos - {
                  filters.status === 'all' ? 'todos' :
                    filters.status === 'active' ? 'activos' :
                      filters.status === 'completed' ? 'completados' : 'en mora'
                } ({filteredLoans.length})
              </Text>

              <TouchableOpacity
                onPress={() => setShowFiltros(!showFiltros)}
                className="w-10 h-10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFiltering ? "options" : "options-outline"}
                  size={24}
                  color={isFiltering ? "#13678A" : "#374151"}
                />
                {isFiltering && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#EF4444',
                      borderWidth: 1,
                      borderColor: '#F9FAFB'
                    }}
                  />
                )}
              </TouchableOpacity>

            </View>

            {/* Lista de préstamos */}
            {isLoading ? (
              <View className="gap-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton.Rect key={i} height={180} borderRadius={22} style={{ marginHorizontal: 0, marginVertical: 10 }} />
                ))}
              </View>
            ) : filteredLoans.length > 0 ? (
              filteredLoans.map(renderPrestamoCard)
            ) : (
              <View className="items-center justify-center py-20 opacity-40">
                <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-medium mt-4">No hay préstamos registrados</Text>
              </View>
            )}
          </>
        ) : (
          /* Lista de abonos */
          <View className="pb-6">
            {isLoading ? (
              <View className="gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton.Rect key={i} height={120} borderRadius={20} style={{ marginHorizontal: 0, marginVertical: 6 }} />
                ))}
              </View>
            ) : abonos.length > 0 ? (
              abonos.map(renderAbonoCard)
            ) : (
              <View className="items-center justify-center py-20 opacity-40">
                <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-medium mt-4">No hay abonos registrados</Text>
              </View>
            )}
          </View>
        )}

        {/* Espaciador para el bottom bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Botón flotante unificado con toda la lógica de registro */}
      <QuickActionFAB onRefresh={loadData} />

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

      {/* El nuevo préstamo ahora se gestiona desde el QuickActionFAB */}

      {/* Modal Detalles Préstamo */}
      <DetallesPrestamoModal
        visible={showDetallesPrestamo}
        onClose={() => setShowDetallesPrestamo(false)}
        loanId={selectedPrestamo ? parseInt(selectedPrestamo.id) : undefined}
        onRegisterPayment={(loanId: number, editData?: any) => {
          const prestamo = loans.find(p => p.id === loanId.toString());
          if (prestamo) {
            setSelectedPrestamo(prestamo);
            if (editData) setEditAbonoData(editData);
            setShowRegistroAbono(true);
          }
        }}
      />


      {/* Modal Registro Abono */}
      <RegistroAbonoModal
        visible={showRegistroAbono}
        onClose={() => {
          setShowRegistroAbono(false);
          setEditAbonoData(null);
        }}
        onSave={handleRegisterPayment}
        loanId={selectedPrestamo ? parseInt(selectedPrestamo.id) : undefined}
        maxAmount={selectedPrestamo?.deudaPendiente}
        initialData={editAbonoData}
      />


      {/* Modal Detalles Abono */}
      <DetallesAbonoModal
        visible={showDetallesAbono}
        onClose={() => setShowDetallesAbono(false)}
        abono={selectedAbono}
      />

      <FiltrosPrestamoModal
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        currentFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
        onClear={() => {
          setFilters({
            status: 'all',
            payment_frequency: 'all',
            date: null
          });
        }}

      />

      {/* Modal de Detalles del Cliente */}
      <ClientDetailsModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onRefresh={loadData}
      />

      {/* Confirmación Profesional */}
      <ConfirmationModal
        visible={showConfirmation}
        title={confirmationConfig?.title || ""}
        message={confirmationConfig?.message || ""}
        onClose={() => {
          setShowConfirmation(false);
          setConfirmationConfig(null);
        }}
        onGenerateReceipt={handleGenerateReceipt}
        isGenerating={isGeneratingReceipt}
      />
    </View>
  );
}