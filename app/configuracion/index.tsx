import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ProfileCard from "../../components/configuracion/ProfileCard";
import SettingSection from "../../components/configuracion/SettingSection";
import SettingItem from "../../components/configuracion/SettingItem";
import DangerZone from "../../components/configuracion/DangerZone";
import AppInfoCard from "../../components/configuracion/AppInfoCard";
import ChangePasswordModal from "../../components/configuracion/ChangePasswordModal";
import {
  exportClientsToExcel,
  exportLoansToExcel,
  exportPaymentsToExcel,
  exportAllDataToExcel,
} from "../../services/export.service";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { user, updateUserName, logout, changePassword } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const handleEditProfile = async (newName: string) => {
    try {
      await updateUserName(newName);
    } catch (error) {
      console.error("Error updating name:", error);
      throw error;
    }
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Privacidad",
      "Gestiona tus preferencias de privacidad",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      "Notificaciones",
      "Gestiona tus preferencias de notificaciones",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleSecurity = () => {
    Alert.alert(
      "Seguridad",
      "Revisa tu configuración de seguridad",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleChangePassword = () => {
    setChangePasswordVisible(true);
  };

  const handleConfirmChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Error cerrando sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "⚠️ Esta acción es irreversible. Se eliminarán todos tus datos.\n\n¿Está seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            console.log("Eliminando cuenta...");
          },
        },
      ]
    );
  };

  const handleCheckUpdates = () => {
    Alert.alert(
      "Actualizaciones",
      "Ya tienes la versión más reciente instalada",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Acerca de",
      "Gestion de Préstamos v1.0.0\n\nAplicación para gestionar préstamos y abonos de manera eficiente.",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleExportClients = async () => {
    try {
      setExportLoading(true);
      if (!user?.id) {
        Alert.alert("Error", "No se pudo identificar tu usuario");
        return;
      }
      await exportClientsToExcel(user.id);
      Alert.alert("✅ Éxito", "Los clientes han sido exportados correctamente");
    } catch (error) {
      console.error("Error en exportación:", error);
      Alert.alert("❌ Error", "No se pudo exportar los clientes");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportLoans = async () => {
    try {
      setExportLoading(true);
      if (!user?.id) {
        Alert.alert("Error", "No se pudo identificar tu usuario");
        return;
      }
      await exportLoansToExcel(user.id);
      Alert.alert("✅ Éxito", "Los préstamos han sido exportados correctamente");
    } catch (error) {
      console.error("Error en exportación:", error);
      Alert.alert("❌ Error", "No se pudo exportar los préstamos");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPayments = async () => {
    try {
      setExportLoading(true);
      if (!user?.id) {
        Alert.alert("Error", "No se pudo identificar tu usuario");
        return;
      }
      await exportPaymentsToExcel(user.id);
      Alert.alert("✅ Éxito", "Los pagos han sido exportados correctamente");
    } catch (error) {
      console.error("Error en exportación:", error);
      Alert.alert("❌ Error", "No se pudo exportar los pagos");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setExportLoading(true);
      if (!user?.id) {
        Alert.alert("Error", "No se pudo identificar tu usuario");
        return;
      }
      await exportAllDataToExcel(user.id);
      Alert.alert("✅ Éxito", "Todos los datos han sido exportados correctamente");
    } catch (error) {
      console.error("Error en exportación:", error);
      Alert.alert("❌ Error", "No se pudo exportar los datos");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-[#13678A] px-6 pt-16 pb-8 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold">
            Configuración y Cuenta
          </Text>

          <View className="w-10" />
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {/* Profile Card */}
        <View className="pt-6">
          {user && (
            <ProfileCard
              name={user.full_name || "Usuario"}
              email={user.email || "usuario@example.com"}
              role="Gestor de Préstamos"
              onNameChange={handleEditProfile}
            />
          )}
        </View>

        {/* Sección: Negocio */}
        <SettingSection title="Mi Negocio">
          <SettingItem
            icon="business-outline"
            title="Datos del Negocio"
            description="Edita el nombre, logo, RNC y dirección"
            onPress={() => router.push("/configuracion/negocio")}
            trailing="chevron"
            isDivider={false}
          />
        </SettingSection>

        {/* Sección: Suscripción */}
        <SettingSection title="Suscripción">
          <SettingItem
            icon="card-outline"
            title="Mi Plan"
            description="Gestiona tu nivel de suscripción y límites"
            onPress={() => router.push("/configuracion/plan")}
            trailing="chevron"
            isDivider={false}
          />
        </SettingSection>

        {/* Sección: Preferencias */}
        <SettingSection title="Preferencias">
          <SettingItem
            icon="notifications-outline"
            title="Notificaciones"
            description="Recibe alertas sobre tus préstamos"
            onPress={handleNotifications}
            trailing="chevron"
            isDivider={false}
          />
        </SettingSection>

        {/* Sección: Cuenta */}
        <SettingSection title="Cuenta">
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacidad"
            description="Gestiona tu información personal"
            onPress={handlePrivacy}
            trailing="chevron"
            isDivider={true}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Seguridad"
            description="Opciones de autenticación"
            onPress={handleSecurity}
            trailing="chevron"
            isDivider={false}
          />
        </SettingSection>

        {/* Sección: Soporte */}
        <SettingSection title="Soporte">
          <SettingItem
            icon="help-circle-outline"
            title="Centro de ayuda"
            description="Preguntas frecuentes y tutoriales"
            onPress={() => router.push("/ayuda")}
            trailing="chevron"
            isDivider={true}
          />
          <SettingItem
            icon="information-circle-outline"
            title="Acerca de"
            description="Versión y detalles de la app"
            onPress={handleAbout}
            trailing="chevron"
            isDivider={false}
          />
        </SettingSection>

        {/* Sección: Exportar Datos */}
        <SettingSection title="Exportar Datos a Excel">
          <TouchableOpacity
            onPress={handleExportAll}
            disabled={exportLoading}
            className={`px-6 py-4 flex-row items-center justify-between border-b border-gray-200 ${exportLoading ? "opacity-60" : ""
              }`}
          >
            <View className="flex-1 flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-4">
                <Ionicons name="download-outline" size={20} color="#0066CC" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  Exportar Todo
                </Text>
                <Text className="text-gray-500 text-sm">
                  Clientes, préstamos y pagos
                </Text>
              </View>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#0066CC" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportClients}
            disabled={exportLoading}
            className={`px-6 py-4 flex-row items-center justify-between border-b border-gray-200 ${exportLoading ? "opacity-60" : ""
              }`}
          >
            <View className="flex-1 flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center mr-4">
                <Ionicons name="people-outline" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  Exportar Clientes
                </Text>
                <Text className="text-gray-500 text-sm">
                  Información y detalles de contacto
                </Text>
              </View>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportLoans}
            disabled={exportLoading}
            className={`px-6 py-4 flex-row items-center justify-between border-b border-gray-200 ${exportLoading ? "opacity-60" : ""
              }`}
          >
            <View className="flex-1 flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-purple-100 items-center justify-center mr-4">
                <Ionicons name="cash-outline" size={20} color="#A855F7" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  Exportar Préstamos
                </Text>
                <Text className="text-gray-500 text-sm">
                  Estado y detalles de cada préstamo
                </Text>
              </View>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#A855F7" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportPayments}
            disabled={exportLoading}
            className={`px-6 py-4 flex-row items-center justify-between ${exportLoading ? "opacity-60" : ""
              }`}
          >
            <View className="flex-1 flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-orange-100 items-center justify-center mr-4">
                <Ionicons name="card-outline" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  Exportar Pagos
                </Text>
                <Text className="text-gray-500 text-sm">
                  Historial de abonos y transacciones
                </Text>
              </View>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>
        </SettingSection>

        {/* App Info Card */}
        <AppInfoCard
          version="1.0.0"
          onCheckUpdates={handleCheckUpdates}
        />

        {/* Danger Zone */}
        <DangerZone
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-gray-500 text-xs">
            © 2024 Gestión de Préstamos
          </Text>
          <Text className="text-gray-400 text-xs mt-2">v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal Cambiar Contraseña */}
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
        onChangePassword={handleConfirmChangePassword}
      />
    </View>
  );
}
