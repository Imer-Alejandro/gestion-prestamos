import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PlanManager } from '../../services/quota.service';

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface UsageStats {
  plan: { name: string };
  ops: { used: number; max: number; remaining: number; pct: number };
  invoices: { used: number; max: number; remaining: number; pct: number };
  clients: { used: number; max: number; remaining: number; pct: number };
  historical: number;
  cycleStart: string;
  status: 'normal' | 'warning' | 'critical';
}

interface UsageModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getBarColor(pct: number): string {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#34D399';
}

function getRenewalDate(cycleStart: string): string {
  const start = new Date(cycleStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return end.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getStatusMessage(status: string, renewalDate: string): string {
  if (status === 'critical') return ` Cuota casi agotada. Se renueva el ${renewalDate} o mejora tu plan.`;
  if (status === 'warning') return ` Estás usando bastante de tu cuota. Se renueva el ${renewalDate}.`;
  return `Todo bajo control. Tu cuota se renueva el ${renewalDate}.`;
}

// ─── Barra de progreso animada ─────────────────────────────────────────────
function ProgressBar({ pct, label, used, max, remaining }: {
  pct: number; label: string; used: number; max: number; remaining: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct / 100,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const color = getBarColor(pct);

  return (
    <View style={barStyles.container}>
      <View style={barStyles.header}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={[barStyles.pct, { color }]}>{pct}%</Text>
      </View>

      {/* Track */}
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      <View style={barStyles.footer}>
        <Text style={barStyles.detail}>{used} de {max} usados</Text>
        <Text style={barStyles.remaining}>{remaining} restantes</Text>
      </View>
    </View>
  );
}

// ─── Modal principal ───────────────────────────────────────────────────────
export default function UsageModal({ visible, onClose, userId }: UsageModalProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && userId) {
      loadStats();
      // Animar entrada
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      // Animar salida
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setStats(null);
      setLoading(true);
    }
  }, [visible]);

  async function loadStats() {
    setLoading(true);
    try {
      const s = await PlanManager.getUsageStats(userId);
      setStats(s as UsageStats | null);
    } catch (err) {
      console.error('Error loading usage stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleUpgradePress() {
    onClose();
    setTimeout(() => {
      router.push('/configuracion' as any);
    }, 300);
  }

  const renewalDate = stats ? getRenewalDate(stats.cycleStart) : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Fondo difuminado con BlurView */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>
      </Animated.View>

      {/* Panel deslizante */}
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Manija superior */}
        <View style={styles.handle} />

        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Uso del Plan</Text>
            {stats && (
              <Text style={styles.planName}>{stats.plan.name}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={loadStats} style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando estadísticas...</Text>
            </View>
          ) : stats ? (
            <>
              {/* Mensaje de estado */}
              <View style={[styles.statusBanner, { borderColor: getBarColor(stats.ops.pct) + '44' }]}>
                <Text style={styles.statusMessage}>
                  {getStatusMessage(stats.status, renewalDate)}
                </Text>
              </View>

              {/* Barras de progreso */}
              <ProgressBar
                label="Operaciones mensuales"
                pct={stats.ops.pct}
                used={stats.ops.used}
                max={stats.ops.max}
                remaining={stats.ops.remaining}
              />
              <ProgressBar
                label="Clientes registrados"
                pct={stats.clients.pct}
                used={stats.clients.used}
                max={stats.clients.max}
                remaining={stats.clients.remaining}
              />
              <ProgressBar
                label="Comprobantes mensuales"
                pct={stats.invoices.pct}
                used={stats.invoices.used}
                max={stats.invoices.max}
                remaining={stats.invoices.remaining}
              />

              {/* Histórico */}
              <View style={styles.historicalRow}>
                <Ionicons name="bar-chart-outline" size={16} color="#6B7280" />
                <Text style={styles.historicalText}>
                  Total histórico de operaciones:{' '}
                  <Text style={styles.historicalValue}>{stats.historical.toLocaleString()}</Text>
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.loadingText}>No se pudo cargar la información del plan.</Text>
          )}
        </ScrollView>

        {/* Botón de upgrade */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleUpgradePress}
            style={styles.upgradeBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="rocket-outline" size={15} color="#8B5CF6" />
            <Text style={styles.upgradeBtnText}>Mejorar plan</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  planName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  actionBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statusBanner: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  statusMessage: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  historicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  historicalText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  historicalValue: {
    color: '#4B5563',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  upgradeBtnText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
  },
});

const barStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  pct: {
    fontSize: 14,
    fontWeight: '800',
  },
  track: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  detail: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  remaining: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
