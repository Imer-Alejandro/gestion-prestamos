import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import RegistroAbonoModal, { type AbonoFormData } from "../../components/clientes/RegistroAbonoModal";
import DetallesAbonoModal from "../../components/clientes/DetallesAbonoModal";
import DetallesClienteModal from "../../components/clientes/DetallesClienteModal";

interface Prestamo {
  id: string;
  monto: number;
  interes: number;
  plazo: number;
  fecha: string;
}

interface Abono {
  id: string;
  monto: number;
  fechaPago: string;
}

/**
 * Pantalla de Detalle de Cliente
 * Muestra información completa del cliente, préstamos y abonos
 */
export default function ClienteDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"prestamos" | "abonos">("prestamos");
  const [showRegistroAbono, setShowRegistroAbono] = useState(false);
  const [showDetallesAbono, setShowDetallesAbono] = useState(false);
  const [showDetallesCliente, setShowDetallesCliente] = useState(false);

  // TODO: Obtener datos reales del cliente por ID
  const cliente = {
    id: id || "1",
    nombre: "Nombre del cliente",
    iniciales: "NC",
    estado: "en-mora" as "en-mora" | "proximo-mora" | "al-dia",
    totalDeudas: 17500.0,
    totalAbonado: 11500.0,
    deudaPendiente: 6000.0,
  };

  // Mock data - préstamos
  const prestamos: Prestamo[] = [
    {
      id: "1",
      monto: 17500.0,
      interes: 0.05,
      plazo: 30,
      fecha: "28/02/2025 - 1:45 pm",
    },
    {
      id: "2",
      monto: 17500.0,
      interes: 0.05,
      plazo: 30,
      fecha: "28/02/2025 - 1:45 pm",
    },
    {
      id: "3",
      monto: 17500.0,
      interes: 0.05,
      plazo: 30,
      fecha: "28/02/2025 - 1:45 pm",
    },
    {
      id: "4",
      monto: 17500.0,
      interes: 0.05,
      plazo: 30,
      fecha: "28/02/2025 - 1:45 pm",
    },
    {
      id: "5",
      monto: 17500.0,
      interes: 0.05,
      plazo: 30,
      fecha: "28/02/2025 - 1:45 pm",
    },
  ];

  // Mock data - abonos
  const abonos: Abono[] = [
    { id: "1", monto: 17500.0, fechaPago: "18/12/2025" },
    { id: "2", monto: 17500.0, fechaPago: "18/12/2025" },
    { id: "3", monto: 17500.0, fechaPago: "18/12/2025" },
    { id: "4", monto: 17500.0, fechaPago: "23/12/2025" },
    { id: "5", monto: 17500.0, fechaPago: "18/12/2025" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Manejar registro de nuevo abono
  const handleRegistroAbono = (abonoData: AbonoFormData) => {
    console.log("Nuevo abono registrado:", abonoData);
    // TODO: Guardar abono en la base de datos
  };

  // Manejar edición de abono
  const handleEditarAbono = () => {
    console.log("Editar abono");
    setShowDetallesAbono(false);
    // TODO: Abrir modal de edición
  };

  // Mock data para detalles de abono
  const mockDetallesAbono = [
    {
      id: "1",
      fechaRegistro: "25/05/2025",
      prestamoAbono: 11500.0,
      tipoAbono: "normal",
    },
    {
      id: "2",
      fechaRegistro: "26/05/2025",
      prestamoAbono: 5000.0,
      tipoAbono: "anticipo",
    },
    {
      id: "3",
      fechaRegistro: "27/05/2025",
      prestamoAbono: 3500.0,
      tipoAbono: "normal",
    },
  ];

  const getEstadoBadge = () => {
    switch (cliente.estado) {
      case "en-mora":
        return { bg: "bg-red-500", text: "en mora" };
      case "proximo-mora":
        return { bg: "bg-orange-500", text: "próximo a mora" };
      default:
        return { bg: "bg-green-500", text: "al día" };
    }
  };

  const badge = getEstadoBadge();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Card de información del cliente - ESTÁTICA */}
      <View className="px-4 pt-2 pb-3">
        <View
          className="bg-blue-600 rounded-2xl p-6 shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
            {/* Header con avatar y nombre */}
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-row items-center flex-1">
                {/* Avatar con iniciales */}
                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-3">
                  <Text className="text-white text-xl font-bold">
                    {cliente.iniciales}
                  </Text>
                </View>

                {/* Nombre y estado */}
                <View className="flex-1">
                  <Text className="text-white text-lg font-semibold mb-1">
                    {cliente.nombre}
                  </Text>
                  <View className={`${badge.bg} px-3 py-1 rounded-full self-start`}>
                    <Text className="text-white text-xs font-medium">
                      Estado: {badge.text}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón cerrar */}
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-8 h-8 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Resumen financiero */}
            <View className="flex-row justify-between mb-6">
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1">
                  Total en deudas
                </Text>
                <Text className="text-white text-base font-bold">
                  {formatCurrency(cliente.totalDeudas)}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1">
                  Total abonado
                </Text>
                <Text className="text-white text-base font-bold">
                  {formatCurrency(cliente.totalAbonado)}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1">
                  Deuda pendiente
                </Text>
                <Text className="text-white text-base font-bold">
                  {formatCurrency(cliente.deudaPendiente)}
                </Text>
              </View>
            </View>

            {/* Botones de acción */}
            <View className="flex-row justify-between">
              {/* Abonar */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
                onPress={() => setShowRegistroAbono(true)}
              >
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-1">
                  <Ionicons name="add-circle-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-xs">Abonar</Text>
              </TouchableOpacity>

              {/* Editar */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
                onPress={() => console.log("Editar")}
              >
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-1">
                  <Ionicons name="create-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-xs">Editar</Text>
              </TouchableOpacity>

              {/* Detalles */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
                onPress={() => setShowDetallesCliente(true)}
              >
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-1">
                  <Ionicons name="document-text-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-xs">detalles</Text>
              </TouchableOpacity>

              {/* Consulta */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
                onPress={() => console.log("Consulta")}
              >
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-1">
                  <Ionicons name="analytics-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-xs">Consulta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tabs de Préstamos y Abonos - ESTÁTICOS */}
        <View className="flex-row px-4 pb-3">
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
              Préstamos ({prestamos.length})
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

        {/* Contenido con scroll */}
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
        {/* Lista de préstamos */}
        {activeTab === "prestamos" && (
          <View className="px-4">
            {prestamos.map((prestamo) => (
              <TouchableOpacity
                key={prestamo.id}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                activeOpacity={0.7}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={() => console.log("Ver préstamo", prestamo.id)}
              >
                {/* Icono */}
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
                  <Ionicons name="cash-outline" size={20} color="white" />
                </View>

                {/* Información */}
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-bold mb-1">
                    {formatCurrency(prestamo.monto)}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Interés - plazo: {(prestamo.interes * 100).toFixed(2)}%
                  </Text>
                </View>

                {/* Fecha */}
                <Text className="text-gray-400 text-xs">
                  {prestamo.fecha}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Lista de abonos */}
        {activeTab === "abonos" && (
          <View className="px-4">
            {abonos.map((abono) => (
              <View
                key={abono.id}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                {/* Icono */}
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                </View>

                {/* Información */}
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-bold mb-1">
                    {formatCurrency(abono.monto)}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Fecha de pago: {abono.fechaPago}
                  </Text>
                </View>

                {/* Menú de opciones */}
                <TouchableOpacity
                  onPress={() => setShowDetallesAbono(true)}
                  className="w-8 h-8 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Registro de Abono */}
      <RegistroAbonoModal
        visible={showRegistroAbono}
        onClose={() => setShowRegistroAbono(false)}
        onSubmit={handleRegistroAbono}
        clienteId={cliente.id}
      />

      {/* Modal de Detalles de Abono */}
      <DetallesAbonoModal
        visible={showDetallesAbono}
        onClose={() => setShowDetallesAbono(false)}
        onEdit={handleEditarAbono}
        totalAbonado={20000.0}
        cantidadAbonos={3}
        detalles={mockDetallesAbono}
        nota="esto es un ejemplo de un texto dejado en en la nota, este es un ejemplo de un texto dejado en en la nota"
      />

      {/* Modal de Detalles del Cliente */}
      <DetallesClienteModal
        visible={showDetallesCliente}
        onClose={() => setShowDetallesCliente(false)}
        cliente={{
          nombre: cliente.nombre,
          iniciales: cliente.iniciales,
          estado: cliente.estado,
          totalDeuda: 6000.0,
          totalAbonado: 4500.0,
          totalPendiente: 12000.0,
          fechaRegistro: "14/04/2025 - 3:44 pm",
          telefono: "829-671-4173",
          tipoDocumento: "Cédula",
          numeroDocumento: "40210977605",
          proximoPagoCuota: "14/4/2025",
          direccion: "Calle 6 chilo pausetelt con avelino",
          nota: "este es un ejemplo de un texto dejado en en la nota, este es un ejemplo de un texto dejado en en la nota",
        }}
      />
    </SafeAreaView>
  );
}
