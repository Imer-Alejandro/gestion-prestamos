import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
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
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientInitials}>
            {prestamo.clienteIniciales}
          </Text>
          <View>
            <Text style={styles.clientName} numberOfLines={1}>
              {prestamo.clienteNombre}
            </Text>
            <Text style={styles.contractNumber}>
              #{prestamo.id.toString().padStart(4, '0')}
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

      <View style={styles.amounts}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(prestamo.totalPrestamo)}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Abonado:</Text>
          <Text style={[styles.amountValue, styles.amountPositive]}>
            {formatCurrency(prestamo.totalAbonado)}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Deuda:</Text>
          <Text style={[styles.amountValue, styles.amountNegative]}>
            {formatCurrency(prestamo.deudaPendiente)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.installmentsInfo}>
          <Text style={styles.installmentsText}>
            {prestamo.cuotas} cuotas
          </Text>
        </View>

        <View style={[
          styles.statusBadge,
          { backgroundColor: getEstadoColor(prestamo.estado) }
        ]}>
          <Text style={styles.statusText}>
            {getEstadoTexto(prestamo.estado)}
          </Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(5, prestamo.deudaPendientePorcentaje * 100)}%`,
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
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contractNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  amounts: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountPositive: {
    color: '#10B981',
  },
  amountNegative: {
    color: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentsInfo: {
    flex: 1,
  },
  installmentsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 4,
  },
});