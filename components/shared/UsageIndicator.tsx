import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { PlanManager } from '../../services/quota.service';

// ─── Tipo del resultado de getUsageStats ───────────────────────────────────
interface UsageStats {
  plan: { name: string };
  ops: { used: number; max: number; remaining: number; pct: number };
  invoices: { used: number; max: number; remaining: number; pct: number };
  clients: { used: number; max: number; remaining: number; pct: number };
  historical: number;
  cycleStart: string;
  status: 'normal' | 'warning' | 'critical';
}

// ─── Constantes del aro ────────────────────────────────────────────────────
const SIZE = 38;   // tamaño total del botón
const STROKE = 3.5;  // grosor del aro
const RADIUS = (SIZE / 2) - STROKE;
const CIRCUM = 2 * Math.PI * RADIUS;

// ─── Color según porcentaje ────────────────────────────────────────────────
function getArcColor(pct: number): string {
  if (pct >= 90) return '#EF4444'; // rojo crítico
  if (pct >= 70) return '#F59E0B'; // amarillo advertencia
  return '#34D399';                // verde normal
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface UsageIndicatorProps {
  userId: number;
  onPress: () => void;
}

// ─── Componente ────────────────────────────────────────────────────────────
export default function UsageIndicator({ userId, onPress }: UsageIndicatorProps) {
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  const animVal = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cargar estadísticas al montar y cuando el userId cambie
  useEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId]);

  async function loadStats() {
    const stats = await PlanManager.getUsageStats(userId) as UsageStats | null;
    if (!stats) return;

    const averagePct = Math.round((stats.ops.pct + stats.invoices.pct + stats.clients.pct) / 3);
    setPct(averagePct);
    setStatus(stats.status);

    // Animar el aro
    Animated.timing(animVal, {
      toValue: averagePct / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }

  // Pulso cuando está en estado crítico
  useEffect(() => {
    if (status === 'critical') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  // Dashoffset animado
  const dashOffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUM, 0],
  });

  const arcColor = getArcColor(pct);
  const iconColor = status === 'critical' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#34D399';

  // AnimatedCircle: necesitamos un Circle con soporte Animated
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.button}
        accessibilityLabel={`Uso del plan: ${pct}%`}
      >
        {/* Aro SVG */}
        <Svg
          width={SIZE}
          height={SIZE}
          style={StyleSheet.absoluteFill}
        >
          {/* Pista (fondo del aro) */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Arco activo */}
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={arcColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUM}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            // Rotar para que empiece desde arriba (12 en punto)
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        {/* Ícono interior */}
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={16} color={iconColor} />
        </View>


      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: SIZE / 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pctBadge: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },
  pctText: {
    fontSize: 6.5,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
