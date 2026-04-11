import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Prestamo } from '../../data/prestamosData';

interface PrestamoCardProps {
  prestamo: Prestamo;
  onPress?: () => void;
  onMenuPress?: () => void;
}

export function PrestamoCard({ prestamo, onPress, onMenuPress }: PrestamoCardProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return '#10B981'; // Verde
      case 'mora':
        return '#EF4444'; // Rojo
      case 'completado':
        return '#6B7280'; // Gris
      default:
        return '#6B7280';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'mora':
        return 'En Mora';
      case 'completado':
        return 'Completado';
      default:
        return estado;
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientInitials}>
            {prestamo.clienteIniciales}
          </Text>
          <View style={styles.clientTextContainer}>
            <Text style={styles.clientName} numberOfLines={1}>
              {prestamo.clienteNombre}
            </Text>
            <Text style={styles.contractNumber}>
              Préstamo #{prestamo.id.toString().padStart(4, '0')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountsGrid}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Monto</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(prestamo.totalPrestamo)}
          </Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Saldo</Text>
          <Text style={[styles.amountValue, styles.amountNegative]}> 
            {formatCurrency(prestamo.deudaPendiente)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.detailLabel}>Pagado</Text>
          <Text style={[styles.detailValue, styles.amountPositive]}>
            {formatCurrency(prestamo.totalAbonado)}
          </Text>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.detailLabel}>Cuotas</Text>
          <Text style={styles.detailValue}>{prestamo.cuotas}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.detailLabel}>Estado</Text>
          <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(prestamo.estado) }]}> 
            <Text style={styles.statusText}>
              {getEstadoTexto(prestamo.estado)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(6, Math.min(100, prestamo.deudaPendientePorcentaje * 100))}%`,
              backgroundColor: prestamo.estado === 'mora' ? '#EF4444' : '#10B981'
            }
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
   
   
  },
  clientTextContainer: {
  
    flex: 1,
  },
  clientInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#13678A',
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 14,
    lineHeight: 44, // Centra verticalmente el texto
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  contractNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuButton: {
    padding: 6,
  },
  menuIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  amountsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountBlock: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountPositive: {
    color: '#16A34A',
  },
  amountNegative: {
    color: '#DC2626',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 6,
  },
});