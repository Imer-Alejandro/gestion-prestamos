import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const SkeletonItem = ({ style }: { style?: any }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ backgroundColor: "#E5E7EB", borderRadius: 12 }, style, animatedStyle]}
    />
  );
};

export default function ReportSkeleton() {
  return (
    <View className="flex-1 px-4 mt-6">
      {/* Skeleton Title Section */}
      <View className="mb-8">
        <SkeletonItem style={{ width: "70%", height: 28, marginBottom: 8 }} />
        <SkeletonItem style={{ width: "50%", height: 16 }} />
      </View>

      {/* Skeleton Period Buttons */}
      <View className="flex-row gap-3 mb-8">
        <SkeletonItem style={{ width: 80, height: 36, borderRadius: 10 }} />
        <SkeletonItem style={{ width: 80, height: 36, borderRadius: 10 }} />
        <SkeletonItem style={{ width: 80, height: 36, borderRadius: 10 }} />
      </View>

      {/* Skeleton Main Card */}
      <SkeletonItem style={{ width: "100%", height: 140, borderRadius: 24, marginBottom: 20 }} />

      {/* Skeleton Secondary Cards */}
      <View className="flex-row gap-4 mb-6">
        <SkeletonItem style={{ flex: 1, height: 100, borderRadius: 24 }} />
        <SkeletonItem style={{ flex: 1, height: 100, borderRadius: 24 }} />
      </View>

      {/* Skeleton Chart Card */}
      <SkeletonItem style={{ width: "100%", height: 200, borderRadius: 24, marginBottom: 20 }} />

      {/* Skeleton List Items */}
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row justify-between items-center mb-4 py-3 border-b border-gray-100">
          <SkeletonItem style={{ width: "40%", height: 14 }} />
          <SkeletonItem style={{ width: "20%", height: 14 }} />
        </View>
      ))}
    </View>
  );
}
