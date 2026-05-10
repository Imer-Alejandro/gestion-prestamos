import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function JoinOrgScreen() {
  const router = useRouter();
  const { joinOrganization, isLoading } = useAuth();
  const [code, setCode] = useState('');

  const handleJoin = async () => {
    if (code.trim().length < 8) {
      Alert.alert('Código Inválido', 'El código de invitación debe tener al menos 8 caracteres.');
      return;
    }

    try {
      await joinOrganization(code.toUpperCase().trim());
      // AuthContext handles the success alert and redirection
      router.replace('/home');
    } catch (error: any) {
      // Error handled in AuthContext or here
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#13678A]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-10 relative flex-1 justify-center">
          {/* Fondo decorativo */}
          <Text className="absolute -top-10 -left-4 text-white opacity-10 text-[400px] font-bold">
            k
          </Text>

          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-12 left-6 z-20 w-10 h-10 items-center justify-center bg-white/10 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="relative z-10">
            <Text className="text-white text-4xl font-bold mb-2">Unirse</Text>
            <Text className="text-white/70 text-lg mb-10">
              Ingresa el código de 8 dígitos de tu organización para comenzar.
            </Text>

            <View className="mb-8">
              <Text className="text-white/60 text-sm uppercase mb-2 ml-1">Código de Invitación</Text>
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="EJ: K8X2-P91Q"
                placeholderTextColor="#ffffff40"
                autoCapitalize="characters"
                maxLength={12} // Allow for hyphens if user types them
                className="bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white text-2xl font-bold tracking-[4px] text-center"
              />
            </View>

            <TouchableOpacity
              onPress={handleJoin}
              disabled={isLoading || code.length < 4}
              className={`bg-white rounded-xl py-5 items-center shadow-lg ${
                isLoading ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#13678A" />
              ) : (
                <Text className="text-[#13678A] font-bold text-xl">Confirmar y Unirse</Text>
              )}
            </TouchableOpacity>

            <Text className="text-white/40 text-center mt-8 text-sm">
              Si eres el dueño de la empresa, debes seleccionar "Registrar Empresa" en la pantalla anterior.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
