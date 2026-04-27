import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onGenerateReceipt?: () => Promise<void>;
  isGenerating?: boolean;
}

const { width } = Dimensions.get("window");

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onClose,
  onGenerateReceipt,
  isGenerating = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Prompt */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>
              ¿Desea generar un comprobante para esta operación?
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onGenerateReceipt && (
              <TouchableOpacity
                onPress={onGenerateReceipt}
                disabled={isGenerating}
                style={[styles.button, styles.primaryButton]}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Generar Comprobante</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              disabled={isGenerating}
              style={[styles.button, styles.secondaryButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  promptContainer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    width: "100%",
  },
  promptText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#13678A",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
  },
  secondaryButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
});
