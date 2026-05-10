import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePermissions } from '../../services/user.service';

interface PermissionItem {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  { id: 'create_loan', label: 'Registrar Préstamos', description: 'Permite crear nuevos contratos de préstamos.', icon: 'document-text' },
  { id: 'void_loan', label: 'Anular Préstamos', description: 'Permite cancelar o anular préstamos activos.', icon: 'trash' },
  { id: 'register_payment', label: 'Registrar Abonos', description: 'Permite recibir pagos y cuotas.', icon: 'cash' },
  { id: 'void_payment', label: 'Anular Abonos', description: 'Permite anular pagos ya registrados.', icon: 'close-circle' },
  { id: 'manage_clients', label: 'Gestionar Clientes', description: 'Permite crear y editar información de clientes.', icon: 'people' },
  { id: 'view_reports', label: 'Ver Reportes', description: 'Permite acceder a estadísticas y reportes financieros.', icon: 'bar-chart' },
];

interface EditPermissionsModalProps {
  visible: boolean;
  employee: any;
  onClose: () => void;
  onSave: () => void;
}

export default function EditPermissionsModal({ visible, employee, onClose, onSave }: EditPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      try {
        const storedPermissions = employee.permissions ? JSON.parse(employee.permissions) : {};
        // Inicializar con false si no existe el permiso
        const initialPermissions: Record<string, boolean> = {};
        AVAILABLE_PERMISSIONS.forEach(p => {
          initialPermissions[p.id] = !!storedPermissions[p.id];
        });
        setPermissions(initialPermissions);
      } catch (e) {
        console.error("Error parsing permissions:", e);
        setPermissions({});
      }
    }
  }, [employee]);

  const togglePermission = (id: string) => {
    setPermissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updatePermissions(employee.id, permissions);
      Alert.alert("Éxito", "Permisos actualizados correctamente.");
      onSave();
      onClose();
    } catch (error) {
      Alert.alert("Error", "No se pudieron actualizar los permisos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-[40px] h-[85%] px-6 pt-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Configurar Seguridad</Text>
              <Text className="text-gray-800 text-2xl font-black">{employee?.full_name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-6">
            <Text className="text-gray-500 text-sm mb-6 leading-5">
              Selecciona qué acciones puede realizar este empleado dentro de la aplicación. Los cambios se aplicarán en el próximo inicio de sesión del usuario.
            </Text>

            {AVAILABLE_PERMISSIONS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => togglePermission(p.id)}
                activeOpacity={0.7}
                className={`flex-row items-center p-5 rounded-2xl mb-4 border ${
                  permissions[p.id] ? 'bg-[#13678A]/5 border-[#13678A]/20' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                  permissions[p.id] ? 'bg-[#13678A]' : 'bg-gray-200'
                }`}>
                  <Ionicons name={p.icon} size={20} color={permissions[p.id] ? '#fff' : '#6B7280'} />
                </View>
                
                <View className="flex-1">
                  <Text className={`font-bold text-base ${permissions[p.id] ? 'text-[#13678A]' : 'text-gray-700'}`}>
                    {p.label}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1 leading-4">
                    {p.description}
                  </Text>
                </View>

                <Switch
                  value={permissions[p.id]}
                  onValueChange={() => togglePermission(p.id)}
                  trackColor={{ false: "#D1D5DB", true: "#13678A" }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View className="pb-10 pt-4">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="bg-[#13678A] rounded-2xl py-5 items-center justify-center shadow-lg"
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Guardar Permisos</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
