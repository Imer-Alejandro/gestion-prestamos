import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

interface DetallesPrestamoModalProps {
  visible: boolean;
  onClose: () => void;
  loanId?: number;
  onRegisterPayment?: (loanId: number) => void;
}

interface LoanDetails {
  id: number;
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
}

interface Installment {
  id: number;
  installment_number: number;
  due_date: string;
  scheduled_amount: number;
  amount_paid: number;
  status: string;
  late_fee_accrued: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  capital_portion: number;
  interest_portion: number;
  late_fee_portion: number;
}

export function DetallesPrestamoModal({
  visible,
  onClose,
  loanId,
  onRegisterPayment
}: DetallesPrestamoModalProps) {
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'installments' | 'payments'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && loanId) {
      loadLoanDetails();
    }
  }, [visible, loanId]);

  const loadLoanDetails = async () => {
    if (!loanId) return;

    setLoading(true);
    try {
      // Aquí irían las llamadas reales a los servicios
      // Por ahora, mock data para demostración

      // Simular carga de datos del préstamo
      const mockLoanDetails: LoanDetails = {
        id: loanId,
        client_name: "Juan Pérez",
        contract_number: "CNT-001",
        principal_amount: 5000000,
        current_balance: 3200000,
        total_paid: 1800000,
        interest_rate: 2.5,
        installments: 12,
        status: "active",
        start_date: "2024-01-15",
        due_date: "2025-01-15",
        payment_frequency: "monthly",
      };

      // Simular cuotas
      const mockInstallments: Installment[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        installment_number: i + 1,
        due_date: new Date(2024, i, 15).toISOString().split('T')[0],
        scheduled_amount: 416667,
        amount_paid: i < 3 ? 416667 : 0,
        status: i < 3 ? 'paid' : i === 3 ? 'overdue' : 'pending',
        late_fee_accrued: i === 3 ? 25000 : 0,
      }));

      // Simular pagos
      const mockPayments: Payment[] = [
        {
          id: 1,
          amount: 416667,
          payment_date: "2024-01-15",
          payment_method: "efectivo",
          capital_portion: 380000,
          interest_portion: 36667,
          late_fee_portion: 0,
        },
        {
          id: 2,
          amount: 416667,
          payment_date: "2024-02-15",
          payment_method: "transferencia",
          capital_portion: 385000,
          interest_portion: 31667,
          late_fee_portion: 0,
        },
      ];

      setLoanDetails(mockLoanDetails);
      setInstallments(mockInstallments);
      setPayments(mockPayments);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los detalles del préstamo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
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
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'partial': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      case 'partial': return 'Parcial';
      default: return status;
    }
  };

  const renderOverview = () => {
    if (!loanDetails) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Información General</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{loanDetails.client_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contrato:</Text>
            <Text style={styles.infoValue}>{loanDetails.contract_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(loanDetails.status) }]}>
              {loanDetails.status === 'active' ? 'Activo' : loanDetails.status}
            </Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Montos</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monto Principal:</Text>
            <Text style={styles.infoValue}>{formatCurrency(loanDetails.principal_amount)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Saldo Actual:</Text>
            <Text style={styles.infoValue}>{formatCurrency(loanDetails.current_balance)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Pagado:</Text>
            <Text style={[styles.infoValue, { color: '#10B981' }]}>
              {formatCurrency(loanDetails.total_paid)}
            </Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Condiciones</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tasa de Interés:</Text>
            <Text style={styles.infoValue}>{loanDetails.interest_rate}%</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cuotas:</Text>
            <Text style={styles.infoValue}>{loanDetails.installments}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frecuencia:</Text>
            <Text style={styles.infoValue}>
              {loanDetails.payment_frequency === 'monthly' ? 'Mensual' :
               loanDetails.payment_frequency === 'weekly' ? 'Semanal' : 'Quincenal'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Inicio:</Text>
            <Text style={styles.infoValue}>{formatDate(loanDetails.start_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Vencimiento:</Text>
            <Text style={styles.infoValue}>{formatDate(loanDetails.due_date)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderInstallments = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {installments.map((installment) => (
          <View key={installment.id} style={styles.installmentCard}>
            <View style={styles.installmentHeader}>
              <Text style={styles.installmentNumber}>
                Cuota #{installment.installment_number}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(installment.status) }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {getStatusText(installment.status)}
                </Text>
              </View>
            </View>

            <View style={styles.installmentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto Programado:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(installment.scheduled_amount)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pagado:</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>
                  {formatCurrency(installment.amount_paid)}
                </Text>
              </View>

              {installment.late_fee_accrued > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mora:</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {formatCurrency(installment.late_fee_accrued)}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha Vencimiento:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(installment.due_date)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderPayments = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>
                {formatCurrency(payment.amount)}
              </Text>
              <Text style={styles.paymentDate}>
                {formatDate(payment.payment_date)}
              </Text>
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método:</Text>
                <Text style={styles.detailValue}>{payment.payment_method}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capital:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(payment.capital_portion)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interés:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(payment.interest_portion)}
                </Text>
              </View>

              {payment.late_fee_portion > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mora:</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {formatCurrency(payment.late_fee_portion)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalles del Préstamo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'installments' && styles.activeTab]}
            onPress={() => setActiveTab('installments')}
          >
            <Text style={[styles.tabText, activeTab === 'installments' && styles.activeTabText]}>
              Cuotas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
              Pagos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'installments' && renderInstallments()}
        {activeTab === 'payments' && renderPayments()}

        {/* Action Button */}
        {loanDetails && loanDetails.status === 'active' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.registerPaymentButton}
              onPress={() => {
                onClose();
                onRegisterPayment?.(loanId!);
              }}
            >
              <Text style={styles.registerPaymentText}>Registrar Pago</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#6B7280',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  installmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  installmentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  installmentDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  paymentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  registerPaymentButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerPaymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});