import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prestamo } from '../../data/prestamosData';

interface PrestamoCardProps {
  prestamo: Prestamo;
  onPress?: () => void;
  onMenuPress?: () => void;
  onVoid?: (id: string) => void;
}

const BUTTON_WIDTH = 82;
const SWIPE_THRESHOLD = 50;

// Formateador fuera del componente para evitar re-crearlo en cada render
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const PrestamoCard = React.memo(({ prestamo, onPress, onMenuPress, onVoid }: PrestamoCardProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  /* ── helpers de formato ── */
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return '#10B981';
      case 'mora': return '#EF4444';
      case 'completado': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'mora': return 'En Mora';
      case 'completado': return 'Completado';
      default: return estado;
    }
  };

  const formatCurrency = (amount: number) => currencyFormatter.format(amount);

  /* ── animaciones ── */
  const snapOpen = () => {
    Animated.spring(translateX, {
      toValue: -BUTTON_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    isOpen.current = true;
  };

  const snapClose = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    isOpen.current = false;
  };

  /* ── PanResponder ── */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Activar solo en movimientos mayormente horizontales
        return (
          Math.abs(gestureState.dx) > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        // Ajustar el offset para que la card parta desde su posición actual
        translateX.setOffset(isOpen.current ? -BUTTON_WIDTH : 0);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Limitar entre -BUTTON_WIDTH y 0
        const newVal = Math.max(-BUTTON_WIDTH, Math.min(0, gestureState.dx));
        translateX.setValue(newVal);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const currentVal = isOpen.current
          ? gestureState.dx - BUTTON_WIDTH
          : gestureState.dx;

        const shouldOpen =
          gestureState.vx < -0.4 ||
          (!isOpen.current && currentVal < -SWIPE_THRESHOLD);
        const shouldClose =
          gestureState.vx > 0.4 ||
          (isOpen.current && currentVal > -SWIPE_THRESHOLD);

        if (shouldClose) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
          isOpen.current = false;
        } else if (shouldOpen) {
          Animated.spring(translateX, {
            toValue: -BUTTON_WIDTH,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
          isOpen.current = true;
        } else {
          // Volver al estado previo
          Animated.spring(translateX, {
            toValue: isOpen.current ? -BUTTON_WIDTH : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  /* ── acción anular ── */
  const handleVoidPress = useCallback(() => {
    if (!onVoid) return;
    Alert.alert(
      '¿Anular Préstamo?',
      `El préstamo #${prestamo.id.toString().padStart(4, '0')} de ${prestamo.clienteNombre} quedará inactivo permanentemente y no aparecerá en el sistema.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: snapClose,
        },
        {
          text: 'Sí, anular',
          style: 'destructive',
          onPress: () => {
            snapClose();
            onVoid(prestamo.id);
          },
        },
      ]
    );
  }, [onVoid, prestamo]);

  /* ── opacidad y paralaje del botón ── */
  const buttonOpacity = translateX.interpolate({
    inputRange: [-BUTTON_WIDTH, -BUTTON_WIDTH * 0.5, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const contentTranslateX = translateX.interpolate({
    inputRange: [-BUTTON_WIDTH, 0],
    outputRange: [0, BUTTON_WIDTH * 0.4],
    extrapolate: 'clamp',
  });

  const buttonScale = translateX.interpolate({
    inputRange: [-BUTTON_WIDTH, 0],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  /* ── render ── */
  return (
    <View style={styles.container}>

      {/* Fondo "Interior" de la Card (Parte de atrás) */}
      <View style={styles.voidBackgroundContainer}>
        <Animated.View style={[
          styles.voidButton,
          {
            paddingLeft: 20,
            opacity: buttonOpacity,
            transform: [{ translateX: contentTranslateX }]
          }
        ]}>
          <TouchableOpacity
            style={styles.voidButtonInner}
            onPress={handleVoidPress}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }], alignItems: 'center' }}>
              <View style={styles.iconCircle}>
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.voidButtonText}>ANULAR</Text>
              <Text style={styles.voidButtonSubtext}>Préstamo</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Card deslizable */}
      <Animated.View
        style={[styles.cardWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            if (isOpen.current) {
              snapClose();
            } else {
              onPress?.();
            }
          }}
          activeOpacity={0.9}
        >
          {/* Fila superior */}
          <View style={styles.topRow}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientInitials}>{prestamo.clienteIniciales || (prestamo.clienteNombre ? prestamo.clienteNombre.substring(0, 2).toUpperCase() : '??')}</Text>
              <View style={styles.clientTextContainer}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {prestamo.clienteNombre}
                </Text>
                <Text style={styles.contractNumber}>
                  ID: {prestamo.id.toString().padStart(5, '0')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
              <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Footer (Ajustado según cambios del usuario) */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.detailLabel}>PENDIENTE</Text>
              <Text style={[styles.detailValue, styles.amountNegative]}>
                {formatCurrency(prestamo.deudaPendiente)}
              </Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerInfo}>
              <Text style={styles.detailLabel}>CUOTAS</Text>
              <Text style={styles.detailValue}>{prestamo.cuotas}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.statusContainer}>
              <Text style={styles.detailLabel}>ESTADO</Text>
              <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(prestamo.estado) }]}>
                <Text style={styles.statusText}>{getEstadoTexto(prestamo.estado).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(6, Math.min(100, (1 - prestamo.deudaPendientePorcentaje) * 100))}%`,
                  backgroundColor: getEstadoColor(prestamo.estado)
                },
              ]}
            />
          </View>

          {/* Hint de swipe visual mejorado */}
          <View style={styles.swipeHintContainer}>
            <View style={styles.swipeHintLine} />
            <Text style={styles.swipeHintText}>DESLIZA PARA GESTIONAR</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 16,
    position: 'relative',
  },
  /* Contenedor del fondo para que no sobresalga */
  voidBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7F1D1D', // Rojo muy oscuro (fondo profundo)
    borderRadius: 22,
    overflow: 'hidden',
  },
  /* "Botón" que es realmente el interior revelado */
  voidButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BUTTON_WIDTH + 40, // Un poco más ancho para el efecto de paralaje
    backgroundColor: '#DC2626', // Rojo vibrante
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  voidButtonInner: {
    flex: 1,
    width: BUTTON_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  voidButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  voidButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  /* Card */
  cardWrapper: {
    borderRadius: 22,
    zIndex: 1,
    backgroundColor: '#F3F4F6', // Un gris muy ligero para el borde si se ve
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientTextContainer: { flex: 1 },
  clientInitials: {
    width: 48,
    height: 48,
    borderRadius: 16, // Más cuadrado/moderno
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 14,
    overflow: 'hidden',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  contractNumber: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  menuButton: {
    padding: 8,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16,
    marginBottom: 15,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  footerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
    color: '#111827'
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center'
  },
  amountNegative: { color: '#DC2626' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  swipeHintLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  swipeHintText: {
    fontSize: 8,
    color: '#D1D5DB',
    fontWeight: '800',
    letterSpacing: 1,
  },
});
