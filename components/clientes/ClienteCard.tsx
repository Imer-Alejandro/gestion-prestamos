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
import ProgressBar from './ProgressBar';

interface ClienteCardProps {
  cliente: any;
  onPress?: () => void;
  onVoid?: (id: string, activeLoansCount: number) => void;
}

const BUTTON_WIDTH = 82;
const SWIPE_THRESHOLD = 50;

// Formateador fuera del componente para evitar re-crearlo en cada render
const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const ClienteCard = React.memo(({ cliente, onPress, onVoid }: ClienteCardProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  /* ── helpers de formato ── */
  const iniciales = `${cliente.first_name?.[0] || ''}${cliente.last_name?.[0] || ''}`.toUpperCase();
  const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`;

  const formatCurrency = (amount: number) => currencyFormatter.format(amount || 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = () => {
    switch (cliente.status) {
      case 'en-mora':
        return { bg: 'bg-red-100', text: 'En mora', textColor: 'text-red-700' };
      case 'proximo-mora':
        return { bg: 'bg-yellow-100', text: 'Próximo a vencer', textColor: 'text-yellow-700' };
      default:
        return { bg: 'bg-emerald-100', text: 'Al día', textColor: 'text-emerald-700' };
    }
  };

  const statusColor = getStatusColor();

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
    
    // Verificamos antes de mostrar la alerta para dar un mensaje distinto si no se puede
    if (cliente.activeLoansCount > 0) {
      Alert.alert(
        'Acción denegada',
        `No se puede anular el cliente ${nombreCompleto} porque tiene ${cliente.activeLoansCount} préstamo(s) activo(s). Debes saldar o anular sus préstamos primero.`,
        [{ text: 'Entendido', onPress: snapClose }]
      );
      return;
    }

    Alert.alert(
      '¿Anular Cliente?',
      `El cliente ${nombreCompleto} quedará inactivo y no aparecerá en el sistema. Sus registros históricos se mantendrán intactos.`,
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
            onVoid(cliente.id.toString(), cliente.activeLoansCount || 0);
          },
        },
      ]
    );
  }, [onVoid, cliente, nombreCompleto]);

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
              <Text style={styles.voidButtonSubtext}>Cliente</Text>
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
          onPress={() => {
            if (isOpen.current) {
              snapClose();
            } else {
              onPress?.();
            }
          }}
          className="bg-white rounded-[20px] p-4 border border-slate-100/60"
          activeOpacity={0.9}
          style={{
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Header de la tarjeta */}
          <View className="flex-row items-start mb-3.5">
            {/* Avatar */}
            <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center mr-3.5 border-2 border-slate-100 shadow-sm">
              <Text className="text-white text-sm font-bold tracking-wider">
                {iniciales}
              </Text>
            </View>

            {/* Información básica */}
            <View className="flex-1 pt-0.5">
              <Text className="text-slate-800 font-bold text-[15px] mb-0.5">
                {nombreCompleto}
              </Text>
              <Text className="text-slate-500 text-[11px] mb-1.5 font-medium">
                {cliente.document_type} • {cliente.document_number}
              </Text>
              <View className="flex-row items-center bg-slate-50 self-start px-2 py-0.5 rounded-md border border-slate-100">
                <Ionicons name="call" size={10} color="#64748b" />
                <Text className="text-slate-600 text-[11px] ml-1.5 font-medium">
                  {cliente.phone_primary}
                </Text>
              </View>
            </View>

            {/* Badge de estado */}
            <View className={`${statusColor.bg} px-2.5 py-1 rounded-full border border-white/50`}>
              <Text className={`${statusColor.textColor} text-[10px] font-bold uppercase tracking-wider`}>
                {statusColor.text}
              </Text>
            </View>
          </View>

          {/* Información financiera */}
          <View className="bg-slate-50/80 rounded-xl p-3.5 mb-3 border border-slate-100">
            <View className="flex-row justify-between items-center mb-2">
              <View>
                <Text className="text-slate-500 text-[11px] uppercase tracking-wider mb-0.5">
                  Deuda Total
                </Text>
                <Text className="text-slate-800 text-sm font-bold">
                  {formatCurrency(cliente.totalDebt)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-500 text-[11px] uppercase tracking-wider mb-0.5">
                  Pendiente
                </Text>
                <Text className="text-red-500 text-sm font-bold">
                  {formatCurrency(cliente.pendingDebt)}
                </Text>
              </View>
            </View>

            <View className="mt-1">
              <ProgressBar
                percentage={cliente.totalDebt > 0 ? (cliente.totalPaid / cliente.totalDebt) * 100 : 0}
                color="#10B981"
              />
              <View className="flex-row justify-between mt-1.5">
                <Text className="text-slate-400 text-[10px]">Total abonado</Text>
                <Text className="text-emerald-600 font-medium text-[10px]">{formatCurrency(cliente.totalPaid)}</Text>
              </View>
            </View>
          </View>

          {/* Footer - Info adicional */}
          <View className="flex-row justify-between items-center pt-1">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
              <Text className="text-slate-400 text-[10px] ml-1 font-medium">
                Registrado: {formatDate(cliente.created_at)}
              </Text>
            </View>

            {cliente.activeLoansCount > 0 && (
              <View className="flex-row items-center bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                <Ionicons name="document-text" size={10} color="#3b82f6" />
                <Text className="text-blue-600 text-[10px] font-bold ml-1">
                  {cliente.activeLoansCount} {cliente.activeLoansCount === 1 ? 'préstamo' : 'préstamos'}
                </Text>
              </View>
            )}
          </View>

          {/* Hint de swipe visual */}
          <View style={styles.swipeHintContainer}>
            <View style={styles.swipeHintLine} />
            <Text style={styles.swipeHintText}>DESLIZA PARA ANULAR</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    position: 'relative',
  },
  voidBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7F1D1D', // Rojo muy oscuro
    borderRadius: 20,
    overflow: 'hidden',
  },
  voidButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BUTTON_WIDTH + 40, 
    backgroundColor: '#DC2626', // Rojo vibrante
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
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
  cardWrapper: {
    borderRadius: 20,
    zIndex: 1,
    backgroundColor: '#F3F4F6',
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
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
