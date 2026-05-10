import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployees, toggleUserStatus } from '../../services/user.service';
import Skeleton from '../../components/shared/Skeleton';
import EditPermissionsModal from '../../components/empleados/EditPermissionsModal';

export default function EmpleadosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const loadData = useCallback(async () => {
    const orgId = user?.organization?.id;
    if (!orgId) return;

    try {
      setIsLoading(true);
      const data = await getEmployees(orgId);
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      Alert.alert("Error", "No se pudieron cargar los empleados.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (employeeId: number, currentStatus: boolean) => {
    try {
      await toggleUserStatus(employeeId, !currentStatus);
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, is_active: !currentStatus ? 1 : 0 } : emp
      ));
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado del empleado.");
    }
  };

  const handleEditPermissions = (employee: any) => {
    setSelectedEmployee(employee);
    setShowPermissionsModal(true);
  };

  const renderEmployeeCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-[#13678A]/10 items-center justify-center mr-3">
            <Text className="text-[#13678A] font-bold text-lg">
              {item.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-bold text-base" numberOfLines={1}>
              {item.full_name}
            </Text>
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Switch
            value={!!item.is_active}
            onValueChange={() => handleToggleStatus(item.id, !!item.is_active)}
            trackColor={{ false: "#D1D5DB", true: "#13678A" }}
            thumbColor="#fff"
          />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
            {item.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-50 mb-4" />

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-[10px] uppercase font-bold">Último Acceso</Text>
          <Text className="text-gray-600 text-xs">
            {item.last_login ? new Date(item.last_login).toLocaleDateString() : 'Nunca'}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleEditPermissions(item)}
          className="flex-row items-center bg-[#13678A]/5 px-4 py-2 rounded-lg"
        >
          <Ionicons name="shield-checkmark-outline" size={16} color="#13678A" />
          <Text className="text-[#13678A] font-bold text-xs ml-2">Permisos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ 
        title: "Gestionar Equipo",
        headerStyle: { backgroundColor: '#13678A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }} />

      <View className="px-6 py-4">
        <Text className="text-gray-500 text-sm mb-6">
          Como administrador, puedes activar/desactivar empleados y configurar sus permisos individuales.
        </Text>

        {isLoading && !refreshing ? (
          <View className="gap-4">
            {[1, 2, 3].map(i => <Skeleton.Rect key={i} height={140} borderRadius={20} />)}
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEmployeeCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                loadData();
              }} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20 opacity-30">
                <Ionicons name="people-outline" size={80} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-medium mt-4 text-center">
                  No hay empleados vinculados a tu organización.
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-2 px-10">
                  Comparte tu código de invitación desde "Mi Negocio" para que tu equipo se una.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {selectedEmployee && (
        <EditPermissionsModal
          visible={showPermissionsModal}
          employee={selectedEmployee}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedEmployee(null);
          }}
          onSave={loadData}
        />
      )}
    </View>
  );
}
