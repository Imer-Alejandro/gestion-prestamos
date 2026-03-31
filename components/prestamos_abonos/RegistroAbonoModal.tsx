import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  FlatList,
} from 'react-native';

// Componente Picker personalizado más compatible con Expo
function CustomPicker({ selectedValue, onValueChange, options, placeholder }) {
  const [showModal, setShowModal] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar opción</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setShowModal(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

interface RegistroAbonoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (abonoData: any) => void;
  loanId?: number;
  maxAmount?: number;
}

export function RegistroAbonoModal({
  visible,
  onClose,
  onSave,
  loanId,
  maxAmount
}: RegistroAbonoModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'efectivo',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Monto debe ser mayor a 0';
    }

    if (maxAmount && amount > maxAmount) {
      newErrors.amount = `Monto no puede exceder ${maxAmount.toLocaleString('es-CO')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const abonoData = {
      loan_id: loanId,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      reference_number: formData.reference_number || null,
      payment_date: formData.payment_date,
    };

    onSave(abonoData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      payment_method: 'efectivo',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    onClose();
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue).toLocaleString('es-CO') : '';
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'efectivo':
        return '💵 Efectivo';
      case 'tarjeta':
        return '💳 Tarjeta';
      case 'transferencia':
        return '🏦 Transferencia';
      case 'cheque':
        return '📄 Cheque';
      default:
        return method;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrar Abono</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Monto */}
          <View style={styles.field}>
            <Text style={styles.label}>Monto del Abono *</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={formData.amount}
              onChangeText={(value) => setFormData(prev => ({ ...prev, amount: formatCurrency(value) }))}
              placeholder="$ 0"
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}
            {maxAmount && (
              <Text style={styles.hint}>
                Máximo sugerido: ${maxAmount.toLocaleString('es-CO')}
              </Text>
            )}
          </View>

          {/* Método de pago */}
          <View style={styles.field}>
            <Text style={styles.label}>Método de Pago</Text>
            <CustomPicker
              selectedValue={formData.payment_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              options={[
                { label: "💵 Efectivo", value: "efectivo" },
                { label: "💳 Tarjeta de Crédito/Débito", value: "tarjeta" },
                { label: "🏦 Transferencia Bancaria", value: "transferencia" },
                { label: "📄 Cheque", value: "cheque" },
              ]}
              placeholder="Seleccionar método"
            />
          </View>

          {/* Número de referencia */}
          <View style={styles.field}>
            <Text style={styles.label}>Número de Referencia</Text>
            <TextInput
              style={styles.input}
              value={formData.reference_number}
              onChangeText={(value) => setFormData(prev => ({ ...prev, reference_number: value }))}
              placeholder="Comprobante, recibo, etc."
            />
            <Text style={styles.hint}>
              Opcional: número de recibo, comprobante, etc.
            </Text>
          </View>

          {/* Fecha de pago */}
          <View style={styles.field}>
            <Text style={styles.label}>Fecha del Pago</Text>
            <TextInput
              style={styles.input}
              value={formData.payment_date}
              onChangeText={(value) => setFormData(prev => ({ ...prev, payment_date: value }))}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.hint}>
              Por defecto: hoy
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Registrar Abono</Text>
          </TouchableOpacity>
        </View>
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
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 18,
    color: '#6B7280',
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EBF4FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});