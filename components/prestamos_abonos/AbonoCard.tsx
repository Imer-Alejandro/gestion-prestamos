import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Abono {
  id: string | number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  client_name?: string;
  loan_contract_number?: string;
  loan_id?: number;
}

interface AbonoCardProps {
  abono: Abono;
  onPress?: () => void;
  onMenuPress?: () => void;
}

export function AbonoCard({ abono, onPress, onMenuPress }: AbonoCardProps) {
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
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo':
        return 'cash-outline';
      case 'tarjeta':
        return 'card-outline';
      case 'transferencia':
        return 'business-outline';
      default:
        return 'wallet-outline';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.clientInfo}>
          <View style={styles.iconBadge}>
            <Ionicons 
              name={getPaymentMethodIcon(abono.payment_method)} 
              size={20} 
              color="#10B981" 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.clientName} numberOfLines={1}>
              {abono.client_name || 'Cliente Desconocido'}
            </Text>
            <Text style={styles.loanInfo}>
              Contrato: {abono.loan_contract_number || 'N/A'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress && onMenuPress();
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Monto Pagado</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(abono.amount)}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Fecha</Text>
          <Text style={styles.dateValue}>
            {formatDate(abono.payment_date)}
          </Text>
        </View>
      </View>

      {abono.reference_number && (
        <View style={styles.referenceBadge}>
          <Text style={styles.referenceText}>
            Ref: {abono.reference_number}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  loanInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  referenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 12,
  },
  referenceText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
});