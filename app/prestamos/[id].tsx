import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { getLoanById } from "../../services/loan.service";
import { getInstallmentsByLoan, refreshInstallmentMora } from "../../services/installment.service";
import { getPaymentsByLoan, voidPayment } from "../../services/payment.service";
import { getClientById } from "../../services/client.service";

// Paleta de colores principal de la app (consistente con detalles de cliente)
const COLORS = {
  primary: '#13678A',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  light: '#F8FAFC',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

interface LoanDetails {
  id: number;
  client_id: number;
  client_name: string;
  contract_number: string;
  principal_amount: number;
  current_balance: number;
  total_paid: number;
  interest_rate: number;
  installments: number;
  status: string;
  start_date: string;
  due_date: string;
  payment_frequency: string;
  expected_profit: number;
}

interface Installment {
  id: number;
  installment_number: number;
  due_date: string;
  scheduled_amount: number;
  amount_paid: number;
  status: string;
  late_fee_accrued: number;
  interest_amount: number;
  capital_amount: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  capital_portion: number;
  interest_portion: number;
  late_fee_portion: number;
  status: string;
  created_at: string;
}

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'installments' | 'payments'>('overview');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const loanId = parseInt(id);
      const loan = await getLoanById(loanId);
      if (!loan) throw new Error('Préstamo no encontrado');

      const client = await getClientById(loan.client_id);
      const rawInstallments = await getInstallmentsByLoan(loanId);
      
      // Actualizar mora si es necesario
      for (const inst of rawInstallments) {
        if (inst.status !== 'paid') {
          await refreshInstallmentMora(inst.id);
        }
      }

      const refreshedInstallments = await getInstallmentsByLoan(loanId);
      const paymentsData = await getPaymentsByLoan(loanId);

      setLoanDetails({
        ...loan,
        client_name: client ? `${client.first_name} ${client.last_name}` : 'Cliente no disponible',
        contract_number: loan.contract_number || `#${loan.id}`,
        expected_profit: refreshedInstallments.reduce((sum: number, inst: any) => sum + (inst.interest_amount || 0), 0),
      });

      setInstallments(refreshedInstallments);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error cargando detalles del préstamo:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del préstamo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'overdue': return COLORS.danger;
      case 'partial': return '#8B5CF6';
      default: return COLORS.textSecondary;
    }
  };

  const renderOverview = () => {
    if (!loanDetails) return null;
    return (
      <ScrollView className="flex-1 p-4">
        {/* Card Informacion General */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100">
          <Text className="text-slate-800 text-base font-bold mb-3">Información General</Text>
          <InfoRow label="Cliente" value={loanDetails.client_name} />
          <InfoRow label="Contrato" value={loanDetails.contract_number} />
          <InfoRow label="Estado" value={loanDetails.status === 'active' ? 'Activo' : loanDetails.status} valueStyle={{ color: getStatusColor(loanDetails.status), fontWeight: 'bold' }} />
          <InfoRow label="Frecuencia" value={loanDetails.payment_frequency === 'monthly' ? 'Mensual' : loanDetails.payment_frequency === 'weekly' ? 'Semanal' : 'Quincenal'} />
        </View>

        {/* Card Montos */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100">
          <Text className="text-slate-800 text-base font-bold mb-3">Resumen de Montos</Text>
          <InfoRow label="Capital Inicial" value={formatCurrency(loanDetails.principal_amount)} />
          <InfoRow label="Interés Total" value={`${loanDetails.interest_rate}%`} />
          <InfoRow label="Ganancia Estimada" value={formatCurrency(loanDetails.expected_profit)} valueStyle={{ color: '#2563EB' }} />
          <View className="h-[1px] bg-slate-100 my-2" />
          <InfoRow label="Total Pagado" value={formatCurrency(loanDetails.total_paid)} valueStyle={{ color: COLORS.success }} />
          <InfoRow label="Saldo Pendiente" value={formatCurrency(loanDetails.current_balance)} valueStyle={{ color: COLORS.danger, fontSize: 18, fontWeight: '900' }} />
        </View>

        {/* Card Fechas */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100">
          <Text className="text-slate-800 text-base font-bold mb-3">Fechas</Text>
          <InfoRow label="Fecha Inicio" value={formatDate(loanDetails.start_date)} />
          <InfoRow label="Fecha Vencimiento" value={formatDate(loanDetails.due_date)} />
        </View>
        <View className="h-10" />
      </ScrollView>
    );
  };

  const renderInstallments = () => (
    <ScrollView className="flex-1 p-4">
      {installments.map((inst) => (
        <View key={inst.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-slate-800 font-bold">Cuota #{inst.installment_number}</Text>
            <View style={{ backgroundColor: getStatusColor(inst.status) }} className="px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-bold uppercase">{inst.status === 'overdue' ? 'Vencida' : inst.status === 'paid' ? 'Pagada' : 'Pendiente'}</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-slate-500 text-xs">Monto Programado</Text>
            <Text className="text-slate-800 text-xs font-semibold">{formatCurrency(inst.scheduled_amount)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-slate-500 text-xs">Abonado</Text>
            <Text className="text-emerald-600 text-xs font-semibold">{formatCurrency(inst.amount_paid)}</Text>
          </View>
          {inst.late_fee_accrued > 0 && (
            <View className="flex-row justify-between mb-1">
              <Text className="text-red-500 text-xs font-medium">Mora Acumulada</Text>
              <Text className="text-red-500 text-xs font-bold">+{formatCurrency(inst.late_fee_accrued)}</Text>
            </View>
          )}
          <View className="h-[1px] bg-slate-50 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-[10px]">Vence: {formatDate(inst.due_date)}</Text>
            <Text className="text-slate-800 font-bold">{formatCurrency(Math.max(0, inst.scheduled_amount + inst.late_fee_accrued - inst.amount_paid))}</Text>
          </View>
        </View>
      ))}
      <View className="h-10" />
    </ScrollView>
  );

  const renderPayments = () => (
    <ScrollView className="flex-1 p-4">
      {payments.length > 0 ? (
        payments.map((p) => (
          <View key={p.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-emerald-600 text-lg font-black">{formatCurrency(p.amount)}</Text>
              <Text className="text-slate-400 text-[10px]">{formatDate(p.payment_date)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="card-outline" size={12} color="#64748b" />
                <Text className="text-slate-500 text-xs ml-1 uppercase">{p.payment_method}</Text>
              </View>
              {p.status === 'voided' && (
                <View className="bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  <Text className="text-red-600 text-[10px] font-bold">ANULADO</Text>
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <View className="items-center justify-center pt-20">
          <Ionicons name="cash-outline" size={48} color="#cbd5e1" />
          <Text className="text-slate-400 mt-2">No hay pagos registrados</Text>
        </View>
      )}
      <View className="h-10" />
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View className="bg-white px-4 py-4 border-b border-slate-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-slate-800 font-bold text-lg">Detalle Préstamo</Text>
          <Text className="text-slate-400 text-[10px]">CONTRATO: {loanDetails?.contract_number}</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Tab Switcher */}
      <View className="bg-white px-4 py-3 flex-row border-b border-slate-100">
        <TabButton label="General" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <TabButton label="Cuotas" active={activeTab === 'installments'} onPress={() => setActiveTab('installments')} />
        <TabButton label="Pagos" active={activeTab === 'payments'} onPress={() => setActiveTab('payments')} />
      </View>

      {/* Content */}
      <View className="flex-1">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'installments' && renderInstallments()}
        {activeTab === 'payments' && renderPayments()}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueStyle }: { label: string; value: string | number; valueStyle?: any }) {
  return (
    <View className="flex-row justify-between py-1.5 items-center">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-800 text-sm font-medium" style={valueStyle}>{value}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-1 py-2 items-center border-b-2 ${active ? 'border-primary' : 'border-transparent'}`}
      style={active ? { borderColor: COLORS.primary } : {}}
    >
      <Text className={`text-xs font-bold ${active ? 'text-primary' : 'text-slate-400'}`} style={active ? { color: COLORS.primary } : {}}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
