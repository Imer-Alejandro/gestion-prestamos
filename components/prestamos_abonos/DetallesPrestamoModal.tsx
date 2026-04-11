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
import { Ionicons } from '@expo/vector-icons';
import { getLoanById } from '../../services/loan.service';
import { getInstallmentsByLoan } from '../../services/installment.service';
import { getPaymentsByLoan } from '../../services/payment.service';
import { getClientById } from '../../services/client.service';

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

// Colores de la paleta principal de la app
const COLORS = {
  primary: '#13678A',        // Azul principal
  success: '#10B981',        // Verde para pagos positivos
  warning: '#F59E0B',        // Amarillo para pendiente
  danger: '#EF4444',         // Rojo para mora
  secondary: '#0D8A7A',      // Verde azulado
  light: '#F3F4F6',          // Gris claro
  text: '#111827',           // Texto oscuro
  textSecondary: '#6B7280',  // Texto gris
  border: '#E5E7EB',         // Borde gris
};

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

  // Cargar detalles del préstamo cuando el modal se abre
  useEffect(() => {
    if (visible && loanId) {
      loadLoanDetails();
    }
  }, [visible, loanId]);

  // Obtener datos del préstamo desde la BD
  const loadLoanDetails = async () => {
    if (!loanId) return;

    setLoading(true);
    try {
      // Obtener préstamo y datos relacionados en paralelo
      const loan = await getLoanById(loanId);
      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      const [client, installmentsData, paymentsData] = await Promise.all([
        getClientById(loan.client_id),
        getInstallmentsByLoan(loanId),
        getPaymentsByLoan(loanId)
      ]);

      // Formatear detalles del préstamo
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
      });

      // Formatear cuotas
      setInstallments(installmentsData.map((installment: any) => ({
        id: installment.id,
        installment_number: installment.installment_number,
        due_date: installment.due_date,
        scheduled_amount: installment.scheduled_amount,
        amount_paid: installment.amount_paid,
        status: installment.status,
        late_fee_accrued: installment.late_fee_accrued,
      })));

      // Formatear pagos
      setPayments(paymentsData.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        capital_portion: payment.capital_portion,
        interest_portion: payment.interest_portion,
        late_fee_portion: payment.late_fee_portion,
      })));
    } catch (error) {
      console.error('Error cargando detalles de préstamo:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del préstamo');
    } finally {
      setLoading(false);
    }
  };

  // Convertir a moneda colombiana
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fechas en formato legible
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

  // Obtener color según estado de la cuota/pago
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'overdue': return COLORS.danger;
      case 'partial': return '#8B5CF6';
      default: return COLORS.textSecondary;
    }
  };

  // Traducir estado a texto legible
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      case 'partial': return 'Parcial';
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  // Renderizar tab de información general del préstamo
  const renderOverview = () => {
    if (!loanDetails) return null;

    // Calcular porcentaje pagado
    const percentagePaid = (loanDetails.total_paid / loanDetails.principal_amount) * 100;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de resumen rápido con colores principales */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Monto Original</Text>
              <Text style={styles.summaryValue}>{formatCurrency(loanDetails.principal_amount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                {formatCurrency(loanDetails.current_balance)}
              </Text>
            </View>
          </View>

          {/* Barra de progreso de pagos */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, percentagePaid)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(percentagePaid)}% pagado
            </Text>
          </View>
        </View>

        {/* Información General */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Información General</Text>
          </View>

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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.status) }]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(loanDetails.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Información de Montos */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Montos</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pagado Hasta Ahora:</Text>
            <Text style={[styles.infoValue, { color: COLORS.success }]}>
              {formatCurrency(loanDetails.total_paid)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pendiente de Pago:</Text>
            <Text style={[styles.infoValue, { color: COLORS.danger }]}>
              {formatCurrency(loanDetails.current_balance)}
            </Text>
          </View>
        </View>

        {/* Condiciones del Préstamo */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Condiciones</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tasa de Interés:</Text>
            <Text style={styles.infoValue}>{loanDetails.interest_rate}%</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total de Cuotas:</Text>
            <Text style={styles.infoValue}>{loanDetails.installments}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frecuencia de Pago:</Text>
            <Text style={styles.infoValue}>
              {loanDetails.payment_frequency === 'monthly' ? 'Mensual' :
               loanDetails.payment_frequency === 'weekly' ? 'Semanal' : 'Quincenal'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Inicio:</Text>
            <Text style={styles.infoValue}>{formatDate(loanDetails.start_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Vencimiento:</Text>
            <Text style={styles.infoValue}>{formatDate(loanDetails.due_date)}</Text>
          </View>
        </View>

        {/* Espacio inferior para scrolling */}
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  // Renderizar tab de cuotas del préstamo
  const renderInstallments = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Resumen de cuotas */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pagadas</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {installments.filter(i => i.status === 'paid').length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {installments.filter(i => i.status === 'pending').length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Vencidas</Text>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>
              {installments.filter(i => i.status === 'overdue').length}
            </Text>
          </View>
        </View>

        {/* Lista de cuotas */}
        {installments.length > 0 ? (
          installments.map((installment) => (
            <View key={installment.id} style={styles.installmentCard}>
              <View style={styles.installmentHeader}>
                <View>
                  <Text style={styles.installmentNumber}>
                    Cuota #{installment.installment_number}
                  </Text>
                  <Text style={styles.installmentDate}>
                    Vence: {formatDate(installment.due_date)}
                  </Text>
                </View>
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
                  <Text style={[styles.detailValue, { color: COLORS.success }]}>
                    {formatCurrency(installment.amount_paid)}
                  </Text>
                </View>

                {/* Mostrar restante solo si no está completamente pagada */}
                {installment.amount_paid < installment.scheduled_amount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Restante</Text>
                    <Text style={[styles.detailValue, { color: COLORS.danger }]}>
                      {formatCurrency(Math.max(0, installment.scheduled_amount - installment.amount_paid))}
                    </Text>
                  </View>
                )}

                {/* Mostrar mora si existe */}
                {installment.late_fee_accrued > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Moratorios</Text>
                    <Text style={[styles.detailValue, { color: COLORS.danger, fontWeight: '700' }]}>
                      {formatCurrency(installment.late_fee_accrued)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay cuotas registradas</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  // Renderizar tab de pagos realizados
  const renderPayments = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Resumen de pagos */}
        {payments.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Pagado</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pagos Realizados</Text>
                <Text style={styles.summaryValue}>{payments.length}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de pagos */}
        {payments.length > 0 ? (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View>
                  <Text style={[styles.paymentAmount, { color: COLORS.success }]}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.payment_date)}
                  </Text>
                </View>
                <View style={styles.paymentMethodBadge}>
                  <Ionicons name="card" size={16} color={COLORS.primary} />
                  <Text style={styles.paymentMethodText}>{payment.payment_method}</Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
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

                {/* Mostrar moratorios solo si hay */}
                {payment.late_fee_portion > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Moratorios:</Text>
                    <Text style={[styles.detailValue, { color: COLORS.danger }]}>
                      {formatCurrency(payment.late_fee_portion)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay pagos registrados</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
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
        {/* Header del modal */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Detalles del Préstamo</Text>
            {loanDetails && (
              <Text style={styles.subtitle}>{loanDetails.client_name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Navegación con tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color={activeTab === 'overview' ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'installments' && styles.activeTab]}
            onPress={() => setActiveTab('installments')}
          >
            <Ionicons
              name="list"
              size={18}
              color={activeTab === 'installments' ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.tabText, activeTab === 'installments' && styles.activeTabText]}>
              Cuotas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
            onPress={() => setActiveTab('payments')}
          >
            <Ionicons
              name="cash"
              size={18}
              color={activeTab === 'payments' ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
              Pagos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido dinámico según tab seleccionado */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'installments' && renderInstallments()}
            {activeTab === 'payments' && renderPayments()}
          </>
        )}

        {/* Botón flotante para registrar pago */}
        {loanDetails && loanDetails.status === 'active' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.registerPaymentButton}
              onPress={() => {
                onClose();
                onRegisterPayment?.(loanId!);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.registerPaymentText}>Registrar Nuevo Pago</Text>
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
    backgroundColor: COLORS.light,
  },
  // Estilos del Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  // Estilos de Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Estilos de contenido
  tabContent: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // Card de resumen rápido
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  // Barra de progreso de pagos
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Tarjeta de información
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
  },
  // Filas de información
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  // Badge de estado
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Stats Grid para cuotas
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Tarjeta de cuota
  installmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  installmentNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  installmentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  installmentDetails: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 12,
  },
  // Tarjeta de pago
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  paymentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  paymentDetails: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 12,
  },
  // Detalle de filas en tarjetas
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Contenedor vacío
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  // Footer con botón
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  registerPaymentButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerPaymentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
