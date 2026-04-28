import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { getClients, getClientById } from "../../services/client.service";
import { createLoan, getLoansByClient, getLoanById } from "../../services/loan.service";
import { createPayment, getPaymentById } from "../../services/payment.service";
import { NuevoPrestamoModal } from "../prestamos_abonos/NuevoPrestamoModal";
import { RegistroAbonoModal } from "../prestamos_abonos/RegistroAbonoModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { generateLoanReceipt, generatePaymentReceipt } from "../../services/pdf.service";

interface QuickActionFABProps {
  onRefresh?: () => void;
}

/**
 * QuickActionFAB centrada en el diseño unificado de la app.
 * Encapsula el botón flotante y toda la lógica de selección de cliente/préstamo.
 */
export const QuickActionFAB: React.FC<QuickActionFABProps> = ({ onRefresh }) => {
  const { user } = useAuth();

  // UI States
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showLoanSelector, setShowLoanSelector] = useState(false);

  // Data States
  const [clients, setClients] = useState<any[]>([]);
  const [loansForClient, setLoansForClient] = useState<any[]>([]);
  const [targetLoanId, setTargetLoanId] = useState<number | null>(null);
  const [selectedClientForAbono, setSelectedClientForAbono] = useState<any>(null);

  // Estados para Confirmación Profesional
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    type: 'loan' | 'payment';
    data: any;
  } | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Cargador de clientes
  const loadClients = async () => {
    if (!user?.id) return;
    try {
      const data = await getClients(user.id);
      setClients(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  };

  const handleNuevoAbono = async () => {
    await loadClients();
    setShowQuickActions(false);
    setShowClientSelector(true);
  };

  const handleNuevoPrestamo = async () => {
    await loadClients();
    setShowQuickActions(false);
    setShowLoanModal(true);
  };

  const handleSaveLoan = async (data: any) => {
    if (!user?.id) return;
    try {
      const loanId = await createLoan({ ...data, user_id: user.id });
      const fullLoan = await getLoanById(loanId);
      const client = await getClientById(data.client_id);

      setConfirmationConfig({
        title: "Préstamo Confirmado",
        message: `El préstamo para ${client?.first_name || 'el cliente'} ha sido registrado exitosamente.`,
        type: 'loan',
        data: { loan: fullLoan, client }
      });

      setShowLoanModal(false);
      setShowConfirmation(true);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSaveAbono = async (data: any) => {
    if (!user?.id) return;
    try {
      const paymentId = await createPayment({ ...data, user_id: user.id });
      const fullPayment = await getPaymentById(paymentId);
      const fullLoan = await getLoanById(data.loan_id);
      const client = selectedClientForAbono || await getClientById(fullLoan.client_id);

      setConfirmationConfig({
        title: "Abono Registrado",
        message: `Se ha recibido el pago de $${Number(data.amount).toLocaleString()} correctamente.`,
        type: 'payment',
        data: { payment: fullPayment, loan: fullLoan, client }
      });

      setShowAbonoModal(false);
      setShowConfirmation(true);
      setTargetLoanId(null);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!confirmationConfig) return;
    try {
      setIsGeneratingReceipt(true);
      if (confirmationConfig.type === 'loan') {
        await generateLoanReceipt(
          confirmationConfig.data.loan,
          confirmationConfig.data.client,
          user?.organization || undefined
        );
      } else {
        await generatePaymentReceipt(
          confirmationConfig.data.payment,
          confirmationConfig.data.loan,
          confirmationConfig.data.client,
          user?.organization || undefined
        );
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Error", "No se pudo generar el comprobante en PDF.");
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleSelectClientForAbono = async (client: any) => {
    setSelectedClientForAbono(client);
    setShowClientSelector(false);
    try {
      const clientLoans = await getLoansByClient(client.id);
      const activeLoans = clientLoans.filter((l: any) => l.status === 'active');

      if (activeLoans.length === 0) {
        Alert.alert("Sin préstamos", "Este cliente no tiene préstamos activos.");
      } else if (activeLoans.length === 1) {
        setTargetLoanId(activeLoans[0].id);
        setShowAbonoModal(true);
      } else {
        setLoansForClient(activeLoans);
        setShowLoanSelector(true);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los préstamos del cliente.");
    }
  };

  return (
    <>
      {/* Botones de acción rápida flotantes */}
      {showQuickActions && (
        <>
          {/* Overlay invisible para capturar el cierre */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowQuickActions(false)}
            className="absolute inset-0 bg-transparent"
            style={{ zIndex: 10 }}
          />

          {/* Menú de acciones rápidas */}
          <View
            className="absolute bottom-[180px] right-6 items-end gap-3"
            style={{ zIndex: 20 }}
          >
            {/* Botón Nuevo Abono */}
            <TouchableOpacity
              onPress={handleNuevoAbono}
              className="flex-row items-center bg-white rounded-2xl pl-5 pr-2 py-2"
              activeOpacity={0.9}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 12,
              }}
            >
              <Text className="text-gray-800 font-bold text-xs uppercase tracking-widest mr-3">
                nuevo abono
              </Text>
              <View className="bg-teal-500 w-11 h-11 rounded-xl items-center justify-center">
                <Ionicons name="arrow-down-outline" size={22} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* Botón Nuevo Préstamo */}
            <TouchableOpacity
              onPress={handleNuevoPrestamo}
              className="flex-row items-center bg-white rounded-2xl pl-5 pr-2 py-2"
              activeOpacity={0.9}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 12,
              }}
            >
              <Text className="text-gray-800 font-bold text-xs uppercase tracking-widest mr-3">
                nuevo préstamo
              </Text>
              <View className="bg-[#14688A] w-11 h-11 rounded-xl items-center justify-center">
                <Ionicons name="add-outline" size={26} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Botón flotante Principal (Toggle) */}
      <TouchableOpacity
        onPress={() => setShowQuickActions(!showQuickActions)}
        className="absolute bottom-32 right-6 w-16 h-16 bg-[#14688A] rounded-2xl items-center justify-center"
        activeOpacity={0.9}
        style={{
          zIndex: 30,
          shadowColor: "#14688A",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45,
          shadowRadius: 18,
          elevation: 15,
        }}
      >
        <Ionicons
          name={showQuickActions ? "close" : "add"}
          size={32}
          color="#ffffff"
        />
      </TouchableOpacity>

      {/* Modales de Formulario */}
      <NuevoPrestamoModal
        visible={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        clients={clients}
        onSave={handleSaveLoan}
      />

      <RegistroAbonoModal
        visible={showAbonoModal}
        onClose={() => {
          setShowAbonoModal(false);
          setTargetLoanId(null);
        }}
        loanId={targetLoanId || undefined}
        onSave={handleSaveAbono}
      />

      {/* Selector de Cliente para Abono */}
      <Modal
        visible={showClientSelector}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowClientSelector(false)} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectClientForAbono(item)}
                  className="py-4 border-b border-gray-100 flex-row items-center"
                >
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-gray-500 font-bold">{item.first_name[0]}</Text>
                  </View>
                  <Text className="text-lg text-gray-800 font-medium">{item.first_name} {item.last_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Selector de Préstamo para Abono */}
      <Modal
        visible={showLoanSelector}
        animationType="fade"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2">Elegir Préstamo</Text>
            <Text className="text-gray-500 text-sm mb-4">
              {selectedClientForAbono?.first_name} tiene varios préstamos activos:
            </Text>
            <View className="gap-3">
              {loansForClient.map((loan) => (
                <TouchableOpacity
                  key={loan.id}
                  onPress={() => {
                    setTargetLoanId(loan.id);
                    setShowLoanSelector(false);
                    setShowAbonoModal(true);
                  }}
                  className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex-row justify-between items-center"
                >
                  <View>
                    <Text className="font-bold text-gray-800">Contrato: {loan.contract_number || 'S/N'}</Text>
                    <Text className="text-xs text-gray-500">Saldo: ${loan.current_balance}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#14688A" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowLoanSelector(false)} className="mt-6 py-3 items-center">
              <Text className="text-gray-400 font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </>
  );
};
