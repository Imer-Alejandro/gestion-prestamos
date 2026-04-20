import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import ProfileCard from "../../components/configuracion/ProfileCard";
import SettingSection from "../../components/configuracion/SettingSection";
import SettingItem from "../../components/configuracion/SettingItem";
import DangerZone from "../../components/configuracion/DangerZone";
import AppInfoCard from "../../components/configuracion/AppInfoCard";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { user, updateUserName } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

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
    Alert.alert(
      "Cambiar contraseña",
      "Se enviará un enlace de restablecimiento a tu correo",
      [{ text: "OK", style: "default" }]
    );
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
          onPress: () => {
            // La lógica de logout debe llamarse desde aquí
            console.log("Cerrando sesión...");
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

        {/* Sección: Preferencias */}
        <SettingSection title="Preferencias">
          <SettingItem
            icon="notifications-outline"
            title="Notificaciones"
            description="Recibe alertas sobre tus préstamos"
            onPress={handleNotifications}
            trailing="chevron"
            isDivider={true}
          />
          <SettingItem
            icon="moon-outline"
            title="Modo oscuro"
            description="Disponible en futuras versiones"
            onPress={() => {}}
            trailing="toggle"
            isActive={false}
            isDivider={true}
          />
          <SettingItem
            icon="language-outline"
            title="Idioma"
            description="Español"
            onPress={() => {}}
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
    </View>
  );
}
