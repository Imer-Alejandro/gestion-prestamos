import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  onChangePassword,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animación para deslizar hacia abajo - DEBE estar aquí antes del useEffect
  const translateY = useRef(new Animated.Value(0)).current;

  // Funciones helper
  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  // Effect para animar cuando el modal se abre/cierra
  useEffect(() => {
    if (visible) {
      // Posicionar abajo cuando se abre
      translateY.setValue(600);
      
      // Animar hacia arriba
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    // Solo resetear el formulario y cerrar
    // El useEffect se encargará de resetear la animación cuando visible === false
    resetForm();
    onClose();
  };

  // PanResponder para detectar gestos
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        // Si se desliza más de 100px hacia abajo O si la velocidad es rápida
        if (dy > 100 || vy > 1.5) {
          // Animar hacia abajo, LUEGO cerrar cuando termina la animación
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
          });
        } else {
          // Volver a la posición original
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleChangePassword = async () => {
    // Validaciones
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Ingresa tu contraseña actual");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Ingresa una nueva contraseña");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "La nueva contraseña debe ser diferente a la actual");
      return;
    }

    try {
      setLoading(true);
      await onChangePassword(currentPassword, newPassword);
      Alert.alert(
        "✅ Éxito",
        "Tu contraseña ha sido cambiada correctamente",
        [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "❌ Error",
        error instanceof Error ? error.message : "No se pudo cambiar la contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Blur Background */}
        <BlurView intensity={70} className="flex-1">
          <View className="flex-1 justify-end">
            {/* Animated Container */}
            <Animated.View
              style={[
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              <View className="bg-white rounded-t-3xl max-h-screen" {...panResponder.panHandlers}>
                <ScrollView
                  scrollEnabled={true}
                  contentContainerStyle={{ flexGrow: 0 }}
                  className="p-6"
                >
                {/* Drag Indicator */}
                <View className="items-center mb-4">
                  <View className="w-10 h-1 bg-gray-300 rounded-full" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-xl font-bold text-gray-800">
                    Cambiar Contraseña
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={loading}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Contraseña Actual */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Contraseña Actual
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                    <TextInput
                      placeholder="Ingresa tu contraseña actual"
                      placeholderTextColor="#999"
                      secureTextEntry={!showCurrent}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      editable={!loading}
                      className="flex-1 text-gray-800"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrent(!showCurrent)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showCurrent ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Nueva Contraseña */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Nueva Contraseña
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                    <TextInput
                      placeholder="Ingresa una nueva contraseña"
                      placeholderTextColor="#999"
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      editable={!loading}
                      className="flex-1 text-gray-800"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNew(!showNew)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showNew ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <Text className="text-xs text-red-500 mt-1">
                      Mínimo 6 caracteres
                    </Text>
                  )}
                </View>

                {/* Confirmar Contraseña */}
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                    <TextInput
                      placeholder="Repite tu nueva contraseña"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!loading}
                      className="flex-1 text-gray-800"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(!showConfirm)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showConfirm ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 &&
                    newPassword !== confirmPassword && (
                      <Text className="text-xs text-red-500 mt-1">
                        Las contraseñas no coinciden
                      </Text>
                    )}
                </View>

                {/* Botones */}
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg border-2 border-gray-300 items-center justify-center ${
                      loading ? "opacity-60" : ""
                    }`}
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg bg-[#13678A] items-center justify-center ${
                      loading ? "opacity-60" : ""
                    }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">Cambiar</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Nota de seguridad */}
                <View className="p-3 bg-blue-50 rounded-lg flex-row">
                  <Ionicons name="shield-checkmark" size={16} color="#0066CC" />
                  <Text className="text-xs text-gray-600 ml-2 flex-1">
                    Tu contraseña se guarda de forma segura y encriptada.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
