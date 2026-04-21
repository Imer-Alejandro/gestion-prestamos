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

export interface ClienteFilters {
  status: 'all' | 'al-dia' | 'en-mora' | 'proximo-mora';
  hasActiveLoans: 'all' | 'yes' | 'no';
  registeredFrom: string | null; // ISO date string
}

export const DEFAULT_CLIENTE_FILTERS: ClienteFilters = {
  status: 'all',
  hasActiveLoans: 'all',
  registeredFrom: null,
};

interface FiltrosClienteModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ClienteFilters) => void;
  onClear: () => void;
  currentFilters: ClienteFilters;
}

export function FiltrosClienteModal({
  visible,
  onClose,
  onApply,
  onClear,
  currentFilters,
}: FiltrosClienteModalProps) {
  const [filters, setFilters] = useState<ClienteFilters>(currentFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sincronizar si el padre cambia los filtros mientras está cerrado
  React.useEffect(() => {
    if (visible) setFilters(currentFilters);
  }, [visible]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters(DEFAULT_CLIENTE_FILTERS);
    onClear();
    onClose();
  };

  const updateFilter = <K extends keyof ClienteFilters>(key: K, value: ClienteFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const renderOption = (
    label: string,
    value: string,
    current: string,
    onSelect: (v: string) => void
  ) => {
    const isSelected = current === value;
    return (
      <TouchableOpacity
        key={value}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="options" size={20} color="#13678A" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Filtrar Clientes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {/* Estado del cliente */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado de Cuenta</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Todos', 'all', filters.status, (v) => updateFilter('status', v as ClienteFilters['status']))}
                {renderOption(' Al día', 'al-dia', filters.status, (v) => updateFilter('status', v as ClienteFilters['status']))}
                {renderOption(' Próximo a mora', 'proximo-mora', filters.status, (v) => updateFilter('status', v as ClienteFilters['status']))}
                {renderOption(' En mora', 'en-mora', filters.status, (v) => updateFilter('status', v as ClienteFilters['status']))}
              </View>
            </View>

            {/* ¿Tiene préstamos activos? */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Préstamos Activos</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Todos', 'all', filters.hasActiveLoans, (v) => updateFilter('hasActiveLoans', v as ClienteFilters['hasActiveLoans']))}
                {renderOption('Con préstamos', 'yes', filters.hasActiveLoans, (v) => updateFilter('hasActiveLoans', v as ClienteFilters['hasActiveLoans']))}
                {renderOption('Sin préstamos', 'no', filters.hasActiveLoans, (v) => updateFilter('hasActiveLoans', v as ClienteFilters['hasActiveLoans']))}
              </View>
            </View>

            {/* Fecha de registro desde */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registrado desde</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#13678A" />
                <Text style={styles.dateText}>
                  {filters.registeredFrom
                    ? new Date(filters.registeredFrom).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                    : 'Seleccionar fecha...'}
                </Text>
                {filters.registeredFrom && (
                  <TouchableOpacity onPress={() => updateFilter('registeredFrom', null)}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={filters.registeredFrom ? new Date(filters.registeredFrom) : new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      updateFilter('registeredFrom', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    margin: 4,
  },
  optionSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#13678A',
  },
  optionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#13678A',
    fontWeight: '600',
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
