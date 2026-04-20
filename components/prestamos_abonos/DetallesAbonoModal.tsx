import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Abono } from './AbonoCard';

interface DetallesAbonoModalProps {
  visible: boolean;
  onClose: () => void;
  abono: Abono | null;
}

export function DetallesAbonoModal({ visible, onClose, abono }: DetallesAbonoModalProps) {
  if (!abono) return null;

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
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const DetailItem = ({ label, value, icon, color = '#374151' }: any) => (
    <View style={styles.detailItem}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Detalle del Abono</Text>
              <Text style={styles.headerSubtitle}>ID #{abono.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Monto Principal */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Monto total del abono</Text>
              <Text style={styles.amountValue}>{formatCurrency(abono.amount)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Pago</Text>
              
              <DetailItem 
                label="Cliente" 
                value={abono.client_name} 
                icon="person-outline" 
                color="#2563EB" 
              />
              <DetailItem 
                label="Fecha de Pago" 
                value={formatDate(abono.payment_date)} 
                icon="calendar-outline" 
              />
              <DetailItem 
                label="Método de Pago" 
                value={abono.payment_method} 
                icon="wallet-outline" 
              />
              {abono.reference_number && (
                <DetailItem 
                  label="Referencia" 
                  value={abono.reference_number} 
                  icon="receipt-outline" 
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Préstamo</Text>
              <DetailItem 
                label="Contrato Asociado" 
                value={abono.loan_contract_number} 
                icon="document-text-outline" 
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  amountCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  amountLabel: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#15803D',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#13678A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
