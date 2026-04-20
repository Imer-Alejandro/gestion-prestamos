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
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { getPendingInstallments, refreshInstallmentMora } from '../../services/installment.service';


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

interface RegistroAbonoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (abonoData: any) => void;
  loanId?: number;
  maxAmount?: number;
  initialData?: {
    amount: string;
    payment_method: string;
    payment_date: Date;
    replace_payment_id?: number;
  } | null;

}


export function RegistroAbonoModal({
  visible,
  onClose,
  onSave,
  loanId,
  maxAmount,
  initialData
}: RegistroAbonoModalProps) {

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'efectivo',
    reference_number: '',
    payment_date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);

  // Cargar datos iniciales al editar
  React.useEffect(() => {
    if (visible && initialData) {
      setFormData({
        amount: initialData.amount,
        payment_method: initialData.payment_method,
        reference_number: '',
        payment_date: initialData.payment_date,
      });
      const formatted = initialData.amount ? new Intl.NumberFormat('es-CO').format(parseInt(initialData.amount)) : '';
      setDisplayAmount(formatted);
    }
  }, [visible, initialData]);

  // Cargar cuotas pendientes al abrir el modal
  React.useEffect(() => {

    if (visible && loanId) {
      loadInstallments();
    }
  }, [visible, loanId]);

  const loadInstallments = async () => {
    if (!loanId) return;
    setLoading(true);
    try {
      // 1. Obtener cuotas pendientes
      const pending = await getPendingInstallments(loanId);
      
      // 2. Refrescar mora de la primera cuota (la más antigua) para mostrarla al usuario
      if (pending.length > 0) {
        await refreshInstallmentMora(pending[0].id);
        const refreshedCurrent = await getPendingInstallments(loanId);
        setInstallments(refreshedCurrent);
        
        // Seleccionar por defecto la primera cuota pendiente (obligatorio)
        setSelectedInstallmentId(refreshedCurrent[0].id);
      } else {
        setInstallments([]);
      }
    } catch (error) {
      console.error("Error cargando cuotas:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {

    const newErrors: Record<string, string> = {};

    const amount = parseFloat(formData.amount) || 0;
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Monto debe ser mayor a 0';
    }

    if (maxAmount && amount > maxAmount) {
      newErrors.amount = `Monto no puede exceder ${new Intl.NumberFormat('es-CO').format(maxAmount)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const amount = parseFloat(formData.amount) || 0;

    // Validación elegante: Si el usuario intenta cambiar la cuota y hay una mora anterior
    // (En este diseño, forzamos el pago de la cuota seleccionada que por defecto es la más antigua)
    const selectedInst = installments.find(i => i.id === selectedInstallmentId);
    const firstInst = installments[0];

    if (selectedInstallmentId !== firstInst?.id) {
      Alert.alert(
        "Orden Obligatorio",
        "Debes completar el pago de la cuota más antigua antes de abonar a las siguientes para mantener el orden cronológico.",
        [{ text: "Entendido", onPress: () => setSelectedInstallmentId(firstInst.id) }]
      );
      return;
    }

    const abonoData = {
      loan_id: loanId,
      amount: amount,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number || null,
      payment_date: formData.payment_date.toISOString().split('T')[0],
      installment_id: selectedInstallmentId,
      replace_payment_id: initialData?.replace_payment_id,
    };



    onSave(abonoData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      payment_method: 'efectivo',
      reference_number: '',
      payment_date: new Date(),
    });
    setErrors({});
    onClose();
  };

  const handleAmountChange = (value: string) => {
    // Remover caracteres no numéricos
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Actualizar el valor numérico interno
    setFormData(prev => ({ ...prev, amount: numericValue }));
    
    // Actualizar el valor mostrado formateado
    const formatted = numericValue ? new Intl.NumberFormat('es-CO').format(parseInt(numericValue)) : '';
    setDisplayAmount(formatted);
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

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Cuota a pagar */}
            <View style={styles.field}>
              <Text style={styles.label}>Cuota a Abonar</Text>
              {loading ? (
                <ActivityIndicator color="#13678A" style={{ marginVertical: 10 }} />
              ) : installments.length > 0 ? (
                <>
                  <CustomPicker
                    selectedValue={selectedInstallmentId?.toString()}
                    onValueChange={(value) => {
                      const instId = parseInt(value);
                      if (instId !== installments[0].id) {
                        Alert.alert(
                          "⚠️ Pago en Orden",
                          "El sistema requiere que liquides primero las cuotas vencidas o pendientes más antiguas. Hemos seleccionado automáticamente la cuota correspondiente."
                        );
                        setSelectedInstallmentId(installments[0].id);
                      } else {
                        setSelectedInstallmentId(instId);
                      }
                    }}
                    options={installments.map(inst => ({
                      label: `Cuota #${inst.installment_number} - ${inst.status === 'overdue' ? '⚠️ EN MORA' : 'Pendiente'}`,
                      value: inst.id.toString()
                    }))}
                    placeholder="Seleccionar cuota"
                  />
                  {/* Detalles de la cuota seleccionada */}
                  {selectedInstallmentId && (
                    <View style={styles.installmentDetail}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Monto Programado:</Text>
                        <Text style={styles.detailValue}>
                          ${new Intl.NumberFormat('es-CO').format(installments.find(i => i.id === selectedInstallmentId)?.scheduled_amount || 0)}
                        </Text>
                      </View>
                      {installments.find(i => i.id === selectedInstallmentId)?.late_fee_accrued > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={styles.lateFeeLabel}>Mora Aplicada:</Text>
                          <Text style={styles.lateFeeValue}>
                            + ${new Intl.NumberFormat('es-CO').format(installments.find(i => i.id === selectedInstallmentId)?.late_fee_accrued || 0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.detailRowDivider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.totalLabel}>Total a Pagar en Cuota:</Text>
                        <Text style={styles.totalValue}>
                        ${new Intl.NumberFormat('es-CO').format(
                        Math.round(
                          (installments.find(i => i.id === selectedInstallmentId)?.scheduled_amount || 0) +
                          (installments.find(i => i.id === selectedInstallmentId)?.late_fee_accrued || 0) -
                          (installments.find(i => i.id === selectedInstallmentId)?.amount_paid || 0)
                        )
                      )}
                      </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noInstallments}>No hay cuotas pendientes para este préstamo.</Text>
              )}
            </View>

            {/* Monto */}
            <View style={styles.field}>
              <Text style={styles.label}>Monto del Abono *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                value={displayAmount}
                onChangeText={handleAmountChange}
                placeholder="$ 0"
                keyboardType="numeric"
              />
              {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}
              <Text style={styles.hint}>
                Si el monto es mayor al total de la cuota, el excedente se aplicará a la siguiente.
              </Text>
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
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{formData.payment_date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.payment_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, payment_date: selectedDate }));
                    }
                  }}
                />
              )}
              <Text style={styles.hint}>
                Por defecto: hoy
              </Text>
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
  scrollContainer: {
    flex: 1,
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
  installmentDetail: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailRowDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  lateFeeLabel: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  lateFeeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#13678A',
  },
  noInstallments: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
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
