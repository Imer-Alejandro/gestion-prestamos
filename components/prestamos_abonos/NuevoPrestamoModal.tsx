import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CustomPickerProps {
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

// Componente Picker personalizado más compatible con Expo
function CustomPicker({ selectedValue, onValueChange, options, placeholder }: CustomPickerProps) {
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

interface NuevoPrestamoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (prestamoData: any) => void;
  clients: Array<{ id: number; first_name: string; last_name: string }>;
}

export function NuevoPrestamoModal({
  visible,
  onClose,
  onSave,
  clients
}: NuevoPrestamoModalProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    contract_number: '',
    loan_type: 'personal',
    principal_amount: '',
    disbursed_amount: '',
    interest_rate: '',
    interest_calculation_base: 'monthly',
    interest_rate_period: 'monthly',
    late_fee_type: 'percentage',
    late_fee_value: '',
    amortization_type: 'francesa',
    installments: '',
    start_date: new Date(),
    due_date: new Date(),
    payment_frequency: 'monthly',
    grace_days: '0',
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) newErrors.client_id = 'Cliente requerido';
    if (!formData.principal_amount || parseFloat(formData.principal_amount) <= 0) {
      newErrors.principal_amount = 'Monto principal debe ser mayor a 0';
    }
    if (!formData.interest_rate || parseFloat(formData.interest_rate) <= 0) {
      newErrors.interest_rate = 'Tasa de interés requerida';
    }
    if (!formData.installments || parseInt(formData.installments) <= 0) {
      newErrors.installments = 'Número de cuotas requerido';
    }
    if (!formData.late_fee_value || parseFloat(formData.late_fee_value) <= 0) {
      newErrors.late_fee_value = 'Valor de mora requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const prestamoData = {
      ...formData,
      principal_amount: parseFloat(formData.principal_amount.replace(/\./g, '').replace(',', '.')),
      disbursed_amount: formData.disbursed_amount ? parseFloat(formData.disbursed_amount.replace(/\./g, '').replace(',', '.')) : parseFloat(formData.principal_amount.replace(/\./g, '').replace(',', '.')),
      interest_rate: parseFloat(formData.interest_rate.replace(',', '.')),
      late_fee_value: parseFloat(formData.late_fee_value.replace(',', '.')),
      installments: parseInt(formData.installments),
      grace_days: parseInt(formData.grace_days),
      start_date: formData.start_date.toISOString().split('T')[0],
      due_date: formData.due_date.toISOString().split('T')[0],
    };

    onSave(prestamoData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      client_id: '',
      contract_number: '',
      loan_type: 'personal',
      principal_amount: '',
      disbursed_amount: '',
      interest_rate: '',
      interest_calculation_base: 'monthly',
      interest_rate_period: 'monthly',
      late_fee_type: 'percentage',
      late_fee_value: '',
      amortization_type: 'francesa',
      installments: '',
      start_date: new Date(),
      due_date: new Date(),
      payment_frequency: 'monthly',
      grace_days: '0',
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Calcular fecha de vencimiento automáticamente
    if (field === 'installments' || field === 'payment_frequency' || field === 'start_date') {
      const installments = parseInt(field === 'installments' ? value as string : formData.installments);
      const frequency = field === 'payment_frequency' ? value as string : formData.payment_frequency;
      const startDate = field === 'start_date' ? value as Date : formData.start_date;

      if (installments > 0 && startDate) {
        const dueDate = new Date(startDate);
        let monthsToAdd = installments;

        if (frequency === 'weekly') {
          dueDate.setDate(dueDate.getDate() + installments * 7);
        } else if (frequency === 'biweekly') {
          dueDate.setDate(dueDate.getDate() + installments * 14);
        } else { // monthly
          dueDate.setMonth(dueDate.getMonth() + installments);
        }

        setFormData(prev => ({
          ...prev,
          due_date: dueDate
        }));
      }
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? new Intl.NumberFormat('es-CO').format(parseInt(numericValue)) : '';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo Préstamo</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Información General */}
            <Text style={styles.sectionTitle}>Información General</Text>

            {/* Cliente */}
            <View style={styles.field}>
              <Text style={styles.label}>Cliente *</Text>
              <CustomPicker
                selectedValue={formData.client_id}
                onValueChange={(value) => updateFormData('client_id', value)}
                options={[
                  { label: "Seleccionar cliente...", value: "" },
                  ...clients.map(client => ({
                    label: `${client.first_name} ${client.last_name}`,
                    value: client.id.toString()
                  }))
                ]}
                placeholder="Seleccionar cliente..."
              />
              {errors.client_id && <Text style={styles.error}>{errors.client_id}</Text>}
            </View>

            {/* Número de contrato */}
            <View style={styles.field}>
              <Text style={styles.label}>Número de Contrato</Text>
              <TextInput
                style={styles.input}
                value={formData.contract_number}
                onChangeText={(value) => updateFormData('contract_number', value)}
                placeholder="Ej: CNT-001"
              />
            </View>

            {/* Tipo de préstamo */}
            <View style={styles.field}>
              <Text style={styles.label}>Tipo de Préstamo</Text>
              <CustomPicker
                selectedValue={formData.loan_type}
                onValueChange={(value) => updateFormData('loan_type', value)}
                options={[
                  { label: "Personal", value: "personal" },
                  { label: "Vehículo", value: "vehicle" },
                  { label: "Vivienda", value: "housing" },
                  { label: "Negocio", value: "business" },
                ]}
                placeholder="Seleccionar tipo"
              />
            </View>

            {/* Información Financiera */}
            <Text style={styles.sectionTitle}>Información Financiera</Text>

            {/* Monto principal */}
            <View style={styles.field}>
              <Text style={styles.label}>Monto Principal *</Text>
              <TextInput
                style={[styles.input, errors.principal_amount && styles.inputError]}
                value={formData.principal_amount}
                onChangeText={(value) => updateFormData('principal_amount', formatCurrency(value))}
                placeholder="$ 0"
                keyboardType="numeric"
              />
              {errors.principal_amount && <Text style={styles.error}>{errors.principal_amount}</Text>}
            </View>

            {/* Monto desembolsado */}
            <View style={styles.field}>
              <Text style={styles.label}>Monto Desembolsado</Text>
              <TextInput
                style={styles.input}
                value={formData.disbursed_amount}
                onChangeText={(value) => updateFormData('disbursed_amount', formatCurrency(value))}
                placeholder="Igual al principal si no se especifica"
                keyboardType="numeric"
              />
            </View>

            {/* Condiciones del Préstamo */}
            <Text style={styles.sectionTitle}>Condiciones del Préstamo</Text>

            {/* Tasa de interés */}
            <View style={styles.field}>
              <Text style={styles.label}>Tasa de Interés (%) *</Text>
              <TextInput
                style={[styles.input, errors.interest_rate && styles.inputError]}
                value={formData.interest_rate}
                onChangeText={(value) => updateFormData('interest_rate', value)}
                placeholder="Ej: 2.5"
                keyboardType="decimal-pad"
              />
              {errors.interest_rate && <Text style={styles.error}>{errors.interest_rate}</Text>}
            </View>

            {/* Base de cálculo de interés */}
            <View style={styles.field}>
              <Text style={styles.label}>Base de Cálculo de Interés</Text>
              <CustomPicker
                selectedValue={formData.interest_calculation_base}
                onValueChange={(value) => updateFormData('interest_calculation_base', value)}
                options={[
                  { label: "Mensual", value: "monthly" },
                  { label: "Anual", value: "annual" },
                  { label: "Diario", value: "daily" },
                ]}
                placeholder="Seleccionar base"
              />
            </View>

            {/* Mora */}
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Tipo de Mora</Text>
                <CustomPicker
                  selectedValue={formData.late_fee_type}
                  onValueChange={(value) => updateFormData('late_fee_type', value)}
                  options={[
                    { label: "Porcentaje", value: "percentage" },
                    { label: "Fijo", value: "fixed" },
                    { label: "Diario %", value: "daily_percentage" },
                  ]}
                  placeholder="Seleccionar tipo"
                />
              </View>

              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Valor de Mora *</Text>
                <TextInput
                  style={[styles.input, errors.late_fee_value && styles.inputError]}
                  value={formData.late_fee_value}
                  onChangeText={(value) => updateFormData('late_fee_value', value)}
                  placeholder={formData.late_fee_type === 'percentage' ? "Ej: 1.5" : "Ej: 5000"}
                  keyboardType="decimal-pad"
                />
                {errors.late_fee_value && <Text style={styles.error}>{errors.late_fee_value}</Text>}
              </View>
            </View>

            {/* Número de cuotas */}
            <View style={styles.field}>
              <Text style={styles.label}>Número de Cuotas *</Text>
              <TextInput
                style={[styles.input, errors.installments && styles.inputError]}
                value={formData.installments}
                onChangeText={(value) => updateFormData('installments', value)}
                placeholder="Ej: 12"
                keyboardType="numeric"
              />
              {errors.installments && <Text style={styles.error}>{errors.installments}</Text>}
            </View>

            {/* Términos de Pago */}
            <Text style={styles.sectionTitle}>Términos de Pago</Text>

            {/* Frecuencia de pago */}
            <View style={styles.field}>
              <Text style={styles.label}>Frecuencia de Pago</Text>
              <CustomPicker
                selectedValue={formData.payment_frequency}
                onValueChange={(value) => updateFormData('payment_frequency', value)}
                options={[
                  { label: "Semanal", value: "weekly" },
                  { label: "Quincenal", value: "biweekly" },
                  { label: "Mensual", value: "monthly" },
                ]}
                placeholder="Seleccionar frecuencia"
              />
            </View>

            {/* Fechas */}
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Fecha de Inicio</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{formData.start_date.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={formData.start_date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        updateFormData('start_date', selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Fecha de Vencimiento</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDueDatePicker(true)}
                >
                  <Text>{formData.due_date.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDueDatePicker && (
                  <DateTimePicker
                    value={formData.due_date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDueDatePicker(false);
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, due_date: selectedDate }));
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Días de gracia */}
            <View style={styles.field}>
              <Text style={styles.label}>Días de Gracia</Text>
              <TextInput
                style={styles.input}
                value={formData.grace_days}
                onChangeText={(value) => updateFormData('grace_days', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

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
            <Text style={styles.saveButtonText}>Crear Préstamo</Text>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
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
    fontSize: 12,
    color: '#EF4444',
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
    backgroundColor: '#3B82F6',
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