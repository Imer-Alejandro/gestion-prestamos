import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FiltrosPrestamoModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onClear: () => void;
  currentFilters: any;
}

export function FiltrosPrestamoModal({
  visible,
  onClose,
  onApply,
  onClear,
  currentFilters
}: FiltrosPrestamoModalProps) {
  const [filters, setFilters] = useState(currentFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      status: 'all',
      payment_frequency: 'all',
      date: null
    };
    setFilters(cleared);
    onClear();
    onClose();
  };


  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderOption = (label: string, value: string, current: string, onSelect: (v: string) => void) => {
    const isSelected = current === value;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => onSelect(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtrar Préstamos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Estado */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado del Préstamo</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Todos', 'all', filters.status, (v) => updateFilter('status', v))}
                {renderOption('Activos', 'active', filters.status, (v) => updateFilter('status', v))}
                {renderOption('Completados', 'completed', filters.status, (v) => updateFilter('status', v))}
                {renderOption('En Mora', 'overdue', filters.status, (v) => updateFilter('status', v))}
              </View>
            </View>

            {/* Frecuencia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frecuencia de Pago</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Todas', 'all', filters.payment_frequency, (v) => updateFilter('payment_frequency', v))}
                {renderOption('Semanal', 'weekly', filters.payment_frequency, (v) => updateFilter('payment_frequency', v))}
                {renderOption('Quincenal', 'biweekly', filters.payment_frequency, (v) => updateFilter('payment_frequency', v))}
                {renderOption('Mensual', 'monthly', filters.payment_frequency, (v) => updateFilter('payment_frequency', v))}
              </View>
            </View>

            {/* Fecha específica */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fecha de Inicio</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#13678A" />
                <Text style={styles.dateText}>
                  {filters.date ? new Date(filters.date).toLocaleDateString() : 'Seleccionar fecha...'}
                </Text>
                {filters.date && (
                   <TouchableOpacity onPress={() => updateFilter('date', null)}>
                     <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                   </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={filters.date ? new Date(filters.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      updateFilter('date', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    margin: 4,
  },
  optionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#13678A',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
