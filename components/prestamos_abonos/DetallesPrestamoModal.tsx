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
import { getLoanById } from '../../services/loan.service';
import { getInstallmentsByLoan, refreshInstallmentMora } from '../../services/installment.service';
import { getPaymentsByLoan, voidPayment } from '../../services/payment.service';
import { getClientById } from '../../services/client.service';
import { Ionicons } from '@expo/vector-icons';



interface DetallesPrestamoModalProps {
  visible: boolean;
  onClose: () => void;
  loanId?: number;
  onRegisterPayment?: (loanId: number, editData?: any) => void;
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
      const loan = await getLoanById(loanId);
      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      const client = await getClientById(loan.client_id);
      
      // Actualizar mora de las cuotas antes de mostrarlas
      const rawInstallments = await getInstallmentsByLoan(loanId);
      for (const inst of rawInstallments) {
        if (inst.status !== 'paid') {
          await refreshInstallmentMora(inst.id);
        }
      }
      
      const installmentsData = await getInstallmentsByLoan(loanId);
      const paymentsData = await getPaymentsByLoan(loanId);


      setLoanDetails({
        id: loan.id,
        client_name: client ? `${client.first_name} ${client.last_name}` : 'Cliente no disponible',
        contract_number: loan.contract_number || `#${loan.id}`,
        principal_amount: loan.principal_amount,
        current_balance: loan.current_balance,
        total_paid: loan.total_paid,
        interest_rate: loan.interest_rate,
        installments: loan.installments,
        status: loan.status,
        start_date: loan.start_date,
        due_date: loan.due_date,
        payment_frequency: loan.payment_frequency,
        expected_profit: installmentsData.reduce((sum: number, inst: any) => sum + inst.interest_amount, 0),
      });

      setInstallments(installmentsData.map((installment: any) => ({
        id: installment.id,
        installment_number: installment.installment_number,
        due_date: installment.due_date,
        scheduled_amount: installment.scheduled_amount,
        amount_paid: installment.amount_paid,
        status: installment.status,
        late_fee_accrued: installment.late_fee_accrued,
        interest_amount: installment.interest_amount,
        capital_amount: installment.capital_amount,
      })));

      setPayments(paymentsData.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        capital_portion: payment.capital_portion,
        interest_portion: payment.interest_portion,
        late_fee_portion: payment.late_fee_portion,
        status: payment.status,
        created_at: payment.created_at,
      })));

    } catch (error) {
      console.error('Error cargando detalles de préstamo:', error);
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
            <Text style={styles.infoLabel}>Capital Inicial:</Text>
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
 
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ganancias Estimadas:</Text>
            <Text style={[styles.infoValue, { color: '#2563EB' }]}>
              {formatCurrency(loanDetails.expected_profit)}
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
                <Text style={styles.detailLabel}>Monto Programado</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(installment.scheduled_amount)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pagado</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}> 
                  {formatCurrency(installment.amount_paid)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Restante</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(Math.max(0, installment.scheduled_amount - installment.amount_paid))}
                </Text>
              </View>

              {installment.late_fee_accrued > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mora</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}> 
                    {formatCurrency(installment.late_fee_accrued)}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha Vencimiento</Text>
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

  const handleVoidPayment = async (paymentId: number) => {
    Alert.alert(
      "Confirmar Anulación",
      "¿Estás seguro de que deseas anular este pago? El dinero se devolverá al saldo del préstamo y las cuotas volverán a estar pendientes. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Anular Pago", 
          style: "destructive",
          onPress: async () => {
            try {
              await voidPayment(paymentId);
              Alert.alert("Éxito", "El pago ha sido anulado correctamente.");
              loadLoanDetails(); // Recargar todo
            } catch (error: any) {
              Alert.alert("Error", error.message || "No se pudo anular el pago.");
            }
          }
        }
      ]
    );
  };

  const handleEditPayment = (payment: Payment) => {
    Alert.alert(
      "Editar Pago",
      "Vas a editar este pago. El registro original se mantendrá activo hasta que confirmes los nuevos cambios en el siguiente paso. ¿Deseas continuar?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, Editar", 
          onPress: () => {
            // 1. Cerrar y reabrir con datos pre-cargados e ID de reemplazo
            onClose();
            onRegisterPayment?.(loanId!, {
              amount: payment.amount.toString(),
              payment_method: payment.payment_method,
              payment_date: new Date(payment.payment_date),
              replace_payment_id: payment.id // Enviamos el ID para que el servicio lo reemplace al final
            });
          }
        }
      ]
    );
  };


  const renderPayments = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {payments.map((payment) => {
          const isVoided = payment.status === 'voided';
          const createdAt = new Date(payment.created_at);
          const diffHours = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          const canAction = !isVoided && diffHours <= 24;

          return (
            <View key={payment.id} style={[styles.paymentCard, isVoided && styles.voidedCard]}>
              <View style={styles.paymentHeader}>
                <View>
                  <Text style={[styles.paymentAmount, isVoided && styles.voidedText]}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  {isVoided && (
                    <Text style={styles.voidedBadge}>ANULADO</Text>
                  )}
                </View>
                <View style={styles.paymentDateContainer}>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.payment_date)}
                  </Text>
                  {canAction && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        onPress={() => handleEditPayment(payment)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="pencil" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleVoidPayment(payment.id)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Método:</Text>
                  <Text style={styles.detailValue}>{payment.payment_method}</Text>
                </View>
                {/* ... existing portions ... */}
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
          );
        })}
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
  voidedCard: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  voidedText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  voidedBadge: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
    marginTop: 2,
  },
  paymentDateContainer: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});