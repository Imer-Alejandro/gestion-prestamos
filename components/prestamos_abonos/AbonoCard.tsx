import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Abono {
  id: string | number;
  monto: number;
  fechaPago: string;
  metodoPago?: string;
  referencia?: string;
}

interface AbonoCardProps {
  abono: Abono;
  onPress?: () => void;
}

export function AbonoCard({ abono, onPress }: AbonoCardProps) {
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
        return '💵';
      case 'tarjeta':
        return '💳';
      case 'transferencia':
        return '🏦';
      default:
        return '💰';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {formatCurrency(abono.monto)}
          </Text>
          <Text style={styles.paymentIcon}>
            {getPaymentMethodIcon(abono.metodoPago)}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {formatDate(abono.fechaPago)}
          </Text>
          {abono.metodoPago && (
            <Text style={styles.paymentMethod}>
              {abono.metodoPago}
            </Text>
          )}
        </View>
      </View>

      {abono.referencia && (
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>Ref:</Text>
          <Text style={styles.reference} numberOfLines={1}>
            {abono.referencia}
          </Text>
        </View>
      )}

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  paymentIcon: {
    fontSize: 18,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  referenceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
    fontWeight: '500',
  },
  reference: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
});