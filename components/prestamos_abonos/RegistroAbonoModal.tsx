import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Paleta de colores
const COLORS = {
  primary: '#13678A',
  success: '#10B981',
  danger: '#EF4444',
  border: '#E5E7EB',
  light: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#6B7280',
};

// Picker personalizado
function CustomPicker({ selectedValue, onValueChange, options, placeholder }: any) {
  const [showModal, setShowModal] = useState(false);

  const selectedOption = options.find((opt: any) => opt.value === selectedValue);

  return (
    <>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar opción</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
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
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item.value && styles.selectedOptionText
                    ]}
                  >
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

export default function RegistroAbonoModal({
  visible,
  onClose,
  onSave,
  loanId,
  maxAmount,
}: any) {

  const [formData, setFormData] = useState({
    amount: '',
    metodoPago: 'Efectivo',
    referenciaPago: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<any>({});

  // Validación
  const validateForm = () => {
    const newErrors: any = {};

    const amount = parseFloat(formData.amount);

    if (!formData.amount) {
      newErrors.amount = 'Monto requerido';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Monto inválido';
    } else if (maxAmount && amount > maxAmount) {
      newErrors.amount = `Máximo ${maxAmount}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = () => {
    if (!validateForm()) return;

    const paymentData = {
      loan_id: loanId,
      amount: parseFloat(formData.amount),
      payment_method: formData.metodoPago,
      reference_number: formData.referenciaPago || null,
      payment_date: formData.payment_date,
      capital_portion: parseFloat(formData.amount),
      interest_portion: 0,
      late_fee_portion: 0,
    };

    onSave(paymentData);
    handleClose();
  };

  // Reset
  const handleClose = () => {
    setFormData({
      amount: '',
      metodoPago: 'Efectivo',
      referenciaPago: '',
      payment_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    Keyboard.dismiss();
    onClose();
  };

  const metodosPago = [
    { label: '💵 Efectivo', value: 'Efectivo' },
    { label: '💳 Tarjeta', value: 'Tarjeta' },
    { label: '🏦 Transferencia', value: 'Transferencia' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Registrar Abono</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">

          {/* Fecha */}
          <View style={styles.field}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={formData.payment_date}
              onChangeText={(value) =>
                setFormData({ ...formData, payment_date: value })
              }
            />
          </View>

          {/* Método */}
          <View style={styles.field}>
            <Text style={styles.label}>Método de pago</Text>
            <CustomPicker
              selectedValue={formData.metodoPago}
              onValueChange={(value: string) =>
                setFormData({ ...formData, metodoPago: value })
              }
              options={metodosPago}
              placeholder="Seleccionar"
            />
          </View>

          {/* Referencia */}
          <View style={styles.field}>
            <Text style={styles.label}>Referencia</Text>
            <TextInput
              style={styles.input}
              value={formData.referenciaPago}
              onChangeText={(value) =>
                setFormData({ ...formData, referenciaPago: value })
              }
              placeholder="Opcional"
            />
          </View>

          {/* Monto */}
          <View style={styles.field}>
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={formData.amount}
              onChangeText={(value) =>
                setFormData({ ...formData, amount: value })
              }
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}
          </View>

        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={{ color: '#fff' }}>Guardar</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },

  title: { fontSize: 18, fontWeight: 'bold' },

  form: { padding: 16 },

  field: { marginBottom: 16 },

  label: { fontWeight: '600', marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },

  inputError: { borderColor: COLORS.danger },

  error: { color: COLORS.danger, fontSize: 12 },

  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  saveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pickerText: { color: COLORS.text },

  placeholderText: { color: COLORS.textSecondary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },

  modalTitle: { fontWeight: 'bold' },

  optionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },

  selectedOption: { backgroundColor: '#EBF8F5' },

  optionText: {},

  selectedOptionText: { color: COLORS.primary, fontWeight: 'bold' },
});