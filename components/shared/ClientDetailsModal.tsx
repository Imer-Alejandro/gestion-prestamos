import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { getLoansByClient } from "../../services/loan.service";
import { createPayment } from "../../services/payment.service";
import { updateClient, getClientById } from "../../services/client.service";
import { RegistroAbonoModal } from "../prestamos_abonos/RegistroAbonoModal";
import RegistroClienteModal from "../clientes/RegistroClienteModal";
import { SvgXml } from "react-native-svg";
import { ConfirmationModal } from "./ConfirmationModal";
import { getLoanById } from "../../services/loan.service";
import { generatePaymentReceipt, generateClientStatusReport } from "../../services/pdf.service";

interface ClientDetailsModalProps {
  visible: boolean;
  client: any | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount || 0);

// ─── Acordeón de Datos Personales ─────────────────────────────────────────────
function PersonalDataAccordion({ client }: { client: any }) {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.spring(animHeight, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
    setExpanded((v) => !v);
  };

  const maxHeight = animHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 260] });

  const rows: { icon: any; label: string; value: string }[] = [
    { icon: "call-outline", label: "Teléfono", value: client.phone_primary || "No registrado" },
    { icon: "phone-portrait-outline", label: "Tel. secundario", value: client.phone_secondary || "No registrado" },
    { icon: "mail-outline", label: "Correo", value: client.email || "No registrado" },
    { icon: "location-outline", label: "Dirección", value: client.address_line || "No registrada" },
    { icon: "map-outline", label: "Municipio", value: client.city || "No registrado" },
    { icon: "flag-outline", label: "Provincia", value: client.province || "No registrada" },
    { icon: "earth-outline", label: "Nacionalidad", value: client.country || "No registrada" },
    { icon: "briefcase-outline", label: "Ocupación", value: client.occupation || "No registrada" },
    { icon: "business-outline", label: "Dir. trabajo", value: client.workplace || "No registrada" },
    { icon: "cash-outline", label: "Ingresos", value: client.monthly_income ? formatCurrency(client.monthly_income) : "No registrado" },
    { icon: "people-outline", label: "Referencia", value: client.reference_name || "No registrada" },
    { icon: "call-outline", label: "Tel. referencia", value: client.reference_phone || "No registrado" },
  ];

  return (
    <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#F8FAFC" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#EBF8FF", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
            <Ionicons name="person-outline" size={15} color="#13678A" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>Datos Personales</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, overflow: "hidden" }}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
          {rows.map((row, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 9, borderBottomWidth: idx < rows.length - 1 ? 1 : 0, borderBottomColor: "#F3F4F6" }}>
              <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                <Ionicons name={row.icon} size={13} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 }}>{row.label}</Text>
                <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500", marginTop: 1 }}>{row.value}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Modal Principal ───────────────────────────────────────────────────────────
export default function ClientDetailsModal({ visible, client, onClose, onRefresh }: ClientDetailsModalProps) {
  const { user } = useAuth();
  const translateY = useRef(new Animated.Value(0)).current;
  const [loans, setLoans] = useState<any[]>([]);

  // Estado local del cliente para reflejar cambios inmediatos tras edición
  const [clientData, setClientData] = useState<any>(client);

  // Estados para flujo Abonar
  const [showLoanSelector, setShowLoanSelector] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [targetLoanId, setTargetLoanId] = useState<number | null>(null);
  const [targetLoan, setTargetLoan] = useState<any>(null);

  // Estado para flujo Editar
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados para Confirmación Profesional
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastOperationData, setLastOperationData] = useState<any>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [isGeneratingStatus, setIsGeneratingStatus] = useState(false);

  const loadLoans = async () => {
    if (!clientData?.id) return;
    try {
      const data = await getLoansByClient(clientData.id);
      setLoans(data);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setLoans([]);
    }
  };

  // Sincronizar clientData con la prop client cuando cambia
  useEffect(() => {
    if (client) setClientData(client);
  }, [client]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      loadLoans();
    } else {
      setLoans([]);
      setShowLoanSelector(false);
      setShowAbonoModal(false);
      setTargetLoanId(null);
      setTargetLoan(null);
      setShowEditModal(false);
    }
  }, [visible, clientData?.id]);

  // Botón Abonar
  const handleAbonarPress = () => {
    const activeLoans = loans.filter((l) => l.status === "active");
    if (activeLoans.length === 0) {
      Alert.alert("Sin préstamos activos", `${clientData?.first_name} no tiene préstamos activos en este momento.`, [{ text: "Entendido" }]);
      return;
    }
    if (activeLoans.length === 1) {
      setTargetLoanId(activeLoans[0].id);
      setTargetLoan(activeLoans[0]);
      setShowAbonoModal(true);
    } else {
      setShowLoanSelector(true);
    }
  };

  const handleSaveAbono = async (data: any) => {
    if (!user?.id) return;
    try {
      const paymentId = await createPayment({ ...data, user_id: user.id });

      // Guardar datos para el recibo antes de limpiar
      setLastOperationData({
        payment: { ...data, id: paymentId },
        loan: targetLoan,
        client: clientData || await getClientById(client.id)
      });

      setShowAbonoModal(false);
      setShowConfirmation(true); // Mostrar modal profesional en lugar de Alert

      await loadLoans();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo registrar el abono.");
    }
  };

  const handleGenerateReceipt = async () => {
    if (!lastOperationData) return;
    try {
      setIsGeneratingReceipt(true);
      await generatePaymentReceipt(
        lastOperationData.payment,
        lastOperationData.loan,
        lastOperationData.client,
        user?.organization || undefined
      );
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Error", "No se pudo generar el comprobante en PDF.");
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleGenerateStatusReport = async () => {
    if (!clientData) return;
    try {
      setIsGeneratingStatus(true);
      const activeLoans = loans.filter((l) => l.status === "active");
      await generateClientStatusReport(clientData, activeLoans, user?.organization || undefined);
      setShowStatusConfirmation(false);
    } catch (error) {
      console.error("Error generating status report:", error);
      Alert.alert("Error", "No se pudo generar el reporte de estado.");
    } finally {
      setIsGeneratingStatus(false);
    }
  };

  // Handler guardar edición del cliente
  const handleEditarSubmit = async (formData: any) => {
    if (!clientData?.id) return;
    try {
      const nombres = formData.nombreCompleto.trim().split(" ");
      const firstName = nombres[0];
      const lastName = nombres.slice(1).join(" ") || firstName;

      const updatedFields = {
        first_name: firstName,
        last_name: lastName,
        document_type: formData.tipoDocumento,
        document_number: formData.numeroDocumento,
        birth_date: formData.fechaNacimiento || null,
        gender: formData.sexo || null,
        phone_primary: formData.celularWhatsapp,
        phone_secondary: formData.telefonoCasa || null,
        email: formData.email || null,
        address_line: formData.direccion || "",
        city: formData.municipio || null,
        province: formData.provincia || null,
        country: formData.nacionalidad || null,
        occupation: formData.ocupacion || null,
        workplace: formData.direccionTrabajo || null,
        monthly_income: formData.ingresos ? parseFloat(formData.ingresos) : null,
        reference_name: formData.recomendadoPor || null,
        reference_phone: formData.telefonoOtro || null,
        notes: formData.nota || null,
      };

      await updateClient(clientData.id, updatedFields);

      // Actualizar datos locales inmediatamente para reflejar cambios en la UI
      setClientData((prev: any) => ({ ...prev, ...updatedFields }));

      Alert.alert("Éxito", "Cliente actualizado correctamente.");
      setShowEditModal(false);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar el cliente.");
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          Animated.timing(translateY, { toValue: 1000, duration: 200, useNativeDriver: true }).start(() => onClose());
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!clientData && !visible) return null;

  const statusConfig: any = {
    "al-dia": { bg: "#D1FAE5", text: "#065F46", label: "AL DÍA" },
    "proximo-mora": { bg: "#FEF3C7", text: "#92400E", label: "AVISO" },
    "en-mora": { bg: "#FEE2E2", text: "#991B1B", label: "EN MORA" },
  };
  const status = statusConfig[clientData?.status] ?? statusConfig["al-dia"];

  const loanStatusLabel = (s: string) => s === "active" ? "ACTIVO" : s === "completed" ? "COMPLETADO" : s.toUpperCase();

  // Función para obtener el XML limpio si viene como Data URI Base64
  const getSvgXml = (signature: string | null) => {
    if (!signature) return null;
    if (signature.includes('data:image/svg+xml;base64,')) {
      try {
        const base64 = signature.split('data:image/svg+xml;base64,')[1];
        // Decodificador base64 simple para evitar dependencias externas
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = '';
        let i = 0;
        while (i < base64.length) {
          const p1 = chars.indexOf(base64[i++]);
          const p2 = chars.indexOf(base64[i++]);
          const p3 = chars.indexOf(base64[i++]);
          const p4 = chars.indexOf(base64[i++]);
          const c1 = (p1 << 2) | (p2 >> 4);
          const c2 = ((p2 & 15) << 4) | (p3 >> 2);
          const c3 = ((p3 & 3) << 6) | p4;
          str += String.fromCharCode(c1);
          if (p3 !== 64) str += String.fromCharCode(c2);
          if (p4 !== 64) str += String.fromCharCode(c3);
        }
        return str;
      } catch (e) {
        console.error("Error decodificando SVG:", e);
        return null;
      }
    }
    return signature;
  };

  return (
    <>
      {/* ── Modal Detalle Cliente ── */}
      <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
        <View style={{ flex: 1 }}>
          <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
            <Animated.View style={{
              backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
              height: "82%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12, shadowRadius: 16, elevation: 20, transform: [{ translateY }],
            }}>
              {/* Handle */}
              <View {...panResponder.panHandlers} style={{ paddingVertical: 12, alignItems: "center" }}>
                <View style={{ width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 }} />
              </View>

              {/* Header */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Detalle del Cliente</Text>
                <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {clientData && (
                <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                  {/* Perfil */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, backgroundColor: "#F8FAFC", padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0" }}>
                    <View style={{ width: 56, height: 56, backgroundColor: "#1E3A5F", borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18, letterSpacing: 1 }}>
                        {(clientData.first_name?.[0] || "").toUpperCase()}{(clientData.last_name?.[0] || "").toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>{clientData.first_name} {clientData.last_name}</Text>
                      <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{clientData.document_type} • {clientData.document_number}</Text>
                      <View style={{ marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: status.bg }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: status.text }}>{status.label}</Text>
                      </View>
                    </View>
                  </View>

                  {/* ── Botones de Acción ── */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                    {/* Abonar */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleAbonarPress}
                      style={{ flex: 1, backgroundColor: "#0D8A7A", borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center", shadowColor: "#0D8A7A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 5, gap: 4 }}
                    >
                      <View style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="cash-outline" size={17} color="#fff" />
                      </View>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>Abonar</Text>
                    </TouchableOpacity>

                    {/* Editar */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowEditModal(true)}
                      style={{ flex: 1, backgroundColor: "#14688A", borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center", shadowColor: "#14688A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 5, gap: 4 }}
                    >
                      <View style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="create-outline" size={17} color="#fff" />
                      </View>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>Editar</Text>
                    </TouchableOpacity>

                    {/* Estado / PDF */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowStatusConfirmation(true)}
                      style={{ flex: 1, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center", shadowColor: "#64748B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2, gap: 4 }}
                    >
                      <View style={{ width: 32, height: 32, backgroundColor: "#EBF8FF", borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="document-text-outline" size={17} color="#13678A" />
                      </View>
                      <Text style={{ color: "#374151", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>Estado</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Acordeón Datos Personales */}
                  <PersonalDataAccordion client={clientData} />

                  {/* Resumen Financiero */}
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Resumen Financiero</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1, backgroundColor: "#13678A", borderRadius: 14, padding: 14 }}>
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginBottom: 4, fontWeight: "600" }}>DEUDA TOTAL</Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{formatCurrency(clientData.totalDebt)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: "#0D8A7A", borderRadius: 14, padding: 14 }}>
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginBottom: 4, fontWeight: "600" }}>TOTAL PAGADO</Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{formatCurrency(clientData.totalPaid)}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", borderRadius: 14, padding: 14, marginBottom: 20 }}>
                    <Text style={{ color: "#9A3412", fontSize: 10, fontWeight: "600", marginBottom: 4 }}>SALDO PENDIENTE</Text>
                    <Text style={{ color: "#7C2D12", fontSize: 20, fontWeight: "800" }}>{formatCurrency(clientData.pendingDebt)}</Text>
                  </View>

                  {/* Firma del Cliente */}
                  {clientData.signature_svg && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Firma del Cliente</Text>
                      <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 12, alignItems: "center", justifyContent: "center", minHeight: 120 }}>
                        <SvgXml xml={getSvgXml(clientData.signature_svg)} width="100%" height="100" />
                      </View>
                    </View>
                  )}

                  {/* Historial Préstamos */}
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Historial de Préstamos</Text>
                  {loans.length === 0 ? (
                    <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", padding: 24, borderRadius: 16, alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="document-text-outline" size={36} color="#E5E7EB" />
                      <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 10, textAlign: "center" }}>No hay préstamos asociados a este cliente</Text>
                    </View>
                  ) : (
                    loans.map((loan) => (
                      <View key={loan.id} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1F2937" }}>Contrato #{loan.contract_number}</Text>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: loan.status === "active" ? "#D1FAE5" : "#F3F4F6" }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: loan.status === "active" ? "#065F46" : "#4B5563" }}>{loanStatusLabel(loan.status)}</Text>
                          </View>
                        </View>
                        {[
                          { label: "Principal", value: formatCurrency(loan.principal_amount) },
                          { label: "Tasa", value: `${loan.interest_rate}% (${loan.payment_frequency})` },
                          { label: "Balance", value: formatCurrency(loan.current_balance), highlight: true },
                        ].map((row) => (
                          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, color: "#6B7280" }}>{row.label}</Text>
                            <Text style={{ fontSize: 12, fontWeight: row.highlight ? "700" : "500", color: row.highlight ? "#13678A" : "#374151" }}>{row.value}</Text>
                          </View>
                        ))}
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </Animated.View>
          </BlurView>
        </View>
      </Modal>

      {/* ── Selector de Préstamo (múltiples activos) ── */}
      <Modal visible={showLoanSelector} animationType="fade" transparent={true} onRequestClose={() => setShowLoanSelector(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12 }}>
            {/* Header */}
            <View style={{ backgroundColor: "#0D8A7A", paddingHorizontal: 20, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Elegir Préstamo</Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>{clientData?.first_name} tiene varios préstamos activos</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLoanSelector(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Lista */}
            <FlatList
              data={loans.filter((l) => l.status === "active")}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setTargetLoanId(item.id); setTargetLoan(item); setShowLoanSelector(false); setShowAbonoModal(true); }}
                  activeOpacity={0.75}
                  style={{ backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1F2937" }}>Contrato: {item.contract_number || "S/N"}</Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Saldo: {formatCurrency(item.current_balance)}</Text>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#EBF8FF", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="chevron-forward" size={18} color="#13678A" />
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Cancelar */}
            <TouchableOpacity onPress={() => setShowLoanSelector(false)} style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 13, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center" }}>
              <Text style={{ color: "#6B7280", fontWeight: "700", fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Registro de Abono ── */}
      <RegistroAbonoModal
        visible={showAbonoModal}
        onClose={() => { setShowAbonoModal(false); setTargetLoanId(null); setTargetLoan(null); }}
        loanId={targetLoanId ?? undefined}
        maxAmount={targetLoan?.current_balance}
        onSave={handleSaveAbono}
      />

      {/* ── Editar Cliente ── */}
      <RegistroClienteModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditarSubmit}
        initialData={clientData}
        isEditMode={true}
      />

      {/* ── Confirmación Profesional ── */}
      <ConfirmationModal
        visible={showConfirmation}
        title="Abono Registrado"
        message={`Se ha recibido el pago de ${formatCurrency(lastOperationData?.payment?.amount)} correctamente.`}
        onClose={() => {
          setShowConfirmation(false);
          setTargetLoanId(null);
          setTargetLoan(null);
          setLastOperationData(null);
        }}
        onGenerateReceipt={handleGenerateReceipt}
        isGenerating={isGeneratingReceipt}
      />

      {/* ── Confirmación Reporte de Estado ── */}
      <ConfirmationModal
        visible={showStatusConfirmation}
        title="Reporte de Estado"
        message={`¿Deseas generar un reporte detallado del estado de cuenta de ${clientData?.first_name || 'este cliente'}?`}
        promptText="El reporte incluirá todos los préstamos activos y el balance total."
        confirmButtonText="Generar Reporte"
        onClose={() => setShowStatusConfirmation(false)}
        onGenerateReceipt={handleGenerateStatusReport}
        isGenerating={isGeneratingStatus}
      />
    </>
  )
};
