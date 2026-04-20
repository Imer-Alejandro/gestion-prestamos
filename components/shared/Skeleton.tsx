import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  circle?: boolean;
}

/**
 * Componente Skeleton para representar estados de carga
 * Implementa un pulso suave de opacidad para indicar actividad sin ser intrusivo.
 */
export default function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8, 
  style, 
  circle = false 
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animación de pulso infinito
    const pulse = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [opacity]);

  const skeletonStyle: ViewStyle = {
    width,
    height,
    borderRadius: circle ? (typeof height === 'number' ? height / 2 : 50) : borderRadius,
    backgroundColor: '#E5E7EB', // Gray-200
  };

  return <Animated.View style={[skeletonStyle, { opacity }, style]} />;
}

// Sub-componentes para facilitar el uso
Skeleton.Rect = (props: SkeletonProps) => <Skeleton {...props} />;
Skeleton.Circle = (props: SkeletonProps) => <Skeleton {...props} circle={true} />;
Skeleton.Pill = (props: SkeletonProps) => <Skeleton {...props} borderRadius={99} />;
