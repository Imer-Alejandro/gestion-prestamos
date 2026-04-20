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
}


const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

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

export const AbonoCard = React.memo(({ abono, onPress }: AbonoCardProps) => {
  const formatCurrency = (amount: number) => currencyFormatter.format(amount);

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
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.clientInfo}>
          <View style={styles.iconBadge}>
            <Ionicons 
              name={getPaymentMethodIcon(abono.payment_method)} 
              size={22} 
              color="#13678A" 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.clientName} numberOfLines={1}>
              {abono.client_name || 'Cliente Desconocido'}
            </Text>
            <View style={styles.subInfoRow}>
              <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
              <Text style={styles.loanInfo}>
                {abono.loan_contract_number || 'S/N'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>
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
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Sombra premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  loanInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
  chevronContainer: {
    padding: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    paddingTop: 14,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  referenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  referenceText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
});