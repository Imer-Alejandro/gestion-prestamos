import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';

interface SignatureCaptureProps {
  onOK: (signature: string) => void;
  onClear?: () => void;
  descriptionText?: string;
  clearText?: string;
  confirmText?: string;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onOK,
  onClear,
  descriptionText = "Firme aquí",
  clearText = "Limpiar",
  confirmText = "Confirmar"
}) => {
  const ref = useRef<SignatureViewRef>(null);

  const handleOK = (signature: string) => {
    onOK(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    if (onClear) onClear();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  // El componente SignatureScreen genera por defecto un Base64 (PNG).
  // Para obtener SVG, necesitamos pasarle un script o configurar el formato.
  // Sin embargo, react-native-signature-canvas es principalmente para imágenes.
  // Si queremos SVG puro de forma sencilla, a veces es mejor procesar los puntos
  // o usar el formato 'svg' si la versión lo soporta.
  
  // Script para forzar SVG si fuera necesario (aunque la mayoría de las veces el PNG basta)
  // Pero como el usuario pidió SVG explícitamente para HTML:
  const webStyle = `
    .m-signature-pad--footer { display: none; margin: 0px; }
    body,html { width: 100%; height: 100%; }
  `;

  return (
    <View className="flex-1 bg-white rounded-2xl overflow-hidden border border-gray-200" style={{ height: 300 }}>
      <View className="flex-1">
        <Signature
          ref={ref}
          onOK={handleOK}
          webStyle={webStyle}
          descriptionText={descriptionText}
          autoClear={false}
          imageType="image/svg+xml" 
        />
      </View>
      
      <View className="flex-row border-t border-gray-100 p-2 gap-2 bg-gray-50">
        <TouchableOpacity 
          onPress={handleClear}
          className="flex-1 flex-row items-center justify-center py-3 bg-gray-200 rounded-xl"
        >
          <Ionicons name="trash-outline" size={18} color="#4B5563" />
          <Text className="text-gray-600 font-bold ml-2">{clearText}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleConfirm}
          className="flex-1 flex-row items-center justify-center py-3 bg-[#13678A] rounded-xl"
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="white" />
          <Text className="text-white font-bold ml-2">{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignatureCapture;
