import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getLoansByClient } from "../../services/loan.service";

interface ClientDetailsModalProps {
  visible: boolean;
  client: any | null;
  onClose: () => void;
}

// Formatea montos con comas: 18000 -> $18,000.00
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount || 0);

// ─── Acordeón de Datos Personales ────────────────────────────────────────────
function PersonalDataAccordion({ client }: { client: any }) {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(animHeight, {
      toValue,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
    setExpanded(!expanded);
  };

  const maxHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

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
    { icon: "cash-outline", label: "Ingresos mensuales", value: client.monthly_income ? formatCurrency(client.monthly_income) : "No registrado" },
    { icon: "people-outline", label: "Referencia", value: client.reference_name || "No registrada" },
    { icon: "call-outline", label: "Tel. referencia", value: client.reference_phone || "No registrado" },
  ];

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Header del acordeón */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#F8FAFC",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: "#EBF8FF",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Ionicons name="person-outline" size={15} color="#13678A" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
            Datos Personales
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Contenido colapsable con altura máxima y scroll */}
      <Animated.View style={{ maxHeight, overflow: "hidden" }}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 260 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}
        >
          {rows.map((row, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: 9,
                borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  marginTop: 1,
                }}
              >
                <Ionicons name={row.icon} size={13} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {row.label}
                </Text>
                <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500", marginTop: 1 }}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────
export default function ClientDetailsModal({
  visible,
  client,
  onClose,
}: ClientDetailsModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      if (client?.id) {
        getLoansByClient(client.id)
          .then((data) => setLoans(data))
          .catch((err) => {
            console.error("Error fetching client loans:", err);
            setLoans([]);
          });
      }
    } else {
      setLoans([]);
    }
  }, [visible, client?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!client && !visible) return null;

  const statusConfig = {
    "al-dia": { bg: "#D1FAE5", text: "#065F46", label: "AL DÍA" },
    "proximo-mora": { bg: "#FEF3C7", text: "#92400E", label: "AVISO" },
    "en-mora": { bg: "#FEE2E2", text: "#991B1B", label: "EN MORA" },
  } as any;
  const status = statusConfig[client?.status] ?? statusConfig["al-dia"];

  const loanStatusLabel = (s: string) => {
    if (s === "active") return "ACTIVO";
    if (s === "completed") return "COMPLETADO";
    return s.toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

          <Animated.View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              height: "82%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 20,
              transform: [{ translateY }],
            }}
          >
            {/* Handle de arrastre */}
            <View {...panResponder.panHandlers} style={{ paddingVertical: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 }} />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                Detalle del Cliente
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            {client && (
              <ScrollView
                style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                {/* ── Perfil Header ── */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                    backgroundColor: "#F8FAFC",
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: "#1E3A5F",
                      borderRadius: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18, letterSpacing: 1 }}>
                      {(client.first_name?.[0] || "").toUpperCase()}
                      {(client.last_name?.[0] || "").toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>
                      {client.first_name} {client.last_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {client.document_type} • {client.document_number}
                    </Text>
                    <View
                      style={{
                        marginTop: 6,
                        alignSelf: "flex-start",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: status.bg,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", color: status.text }}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── Botones de Acción ── */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  {/* Abonar */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      backgroundColor: "#0D8A7A",
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#0D8A7A",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.28,
                      shadowRadius: 8,
                      elevation: 5,
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="cash-outline" size={17} color="#fff" />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>
                      Abonar
                    </Text>
                  </TouchableOpacity>

                  {/* Editar */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      backgroundColor: "#14688A",
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#14688A",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.28,
                      shadowRadius: 8,
                      elevation: 5,
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="create-outline" size={17} color="#fff" />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>
                      Editar
                    </Text>
                  </TouchableOpacity>

                  {/* Estado / PDF */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#64748B",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      elevation: 2,
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "#EBF8FF",
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="document-text-outline" size={17} color="#13678A" />
                    </View>
                    <Text style={{ color: "#374151", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }}>
                      Estado
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ── Acordeón Datos Personales ── */}
                <PersonalDataAccordion client={client} />

                {/* ── Resumen Financiero ── */}
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Resumen Financiero
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#13678A",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginBottom: 4, fontWeight: "600" }}>
                      DEUDA TOTAL
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                      {formatCurrency(client.totalDebt)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#0D8A7A",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginBottom: 4, fontWeight: "600" }}>
                      TOTAL PAGADO
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                      {formatCurrency(client.totalPaid)}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: "#FFF7ED",
                    borderWidth: 1,
                    borderColor: "#FED7AA",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: "#9A3412", fontSize: 10, fontWeight: "600", marginBottom: 4 }}>
                    SALDO PENDIENTE
                  </Text>
                  <Text style={{ color: "#7C2D12", fontSize: 20, fontWeight: "800" }}>
                    {formatCurrency(client.pendingDebt)}
                  </Text>
                </View>

                {/* ── Historial de Préstamos ── */}
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Historial de Préstamos
                </Text>

                {loans.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      padding: 24,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons name="document-text-outline" size={36} color="#E5E7EB" />
                    <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 10, textAlign: "center" }}>
                      No hay préstamos asociados a este cliente
                    </Text>
                  </View>
                ) : (
                  loans.map((loan) => (
                    <View
                      key={loan.id}
                      style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1F2937" }}>
                          Contrato #{loan.contract_number}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: loan.status === "active" ? "#D1FAE5" : "#F3F4F6",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: loan.status === "active" ? "#065F46" : "#4B5563",
                            }}
                          >
                            {loanStatusLabel(loan.status)}
                          </Text>
                        </View>
                      </View>

                      {[
                        { label: "Principal", value: formatCurrency(loan.principal_amount) },
                        { label: "Tasa", value: `${loan.interest_rate}% (${loan.payment_frequency})` },
                        { label: "Balance", value: formatCurrency(loan.current_balance), highlight: true },
                      ].map((row) => (
                        <View
                          key={row.label}
                          style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}
                        >
                          <Text style={{ fontSize: 12, color: "#6B7280" }}>{row.label}</Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: row.highlight ? "700" : "500",
                              color: row.highlight ? "#13678A" : "#374151",
                            }}
                          >
                            {row.value}
                          </Text>
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
  );
}
