import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";

interface FinancialSummaryProps {
  totalDeuda: string;
  totalAbonado: string;
  deudaPendiente: string;
  porcentajePago: number;
  onAbonarPress: () => void;
}

export default function FinancialSummary({
  totalDeuda,
  totalAbonado,
  deudaPendiente,
  porcentajePago,
  onAbonarPress,
}: FinancialSummaryProps) {
  return (
    <View className="mx-4 mb-6">
      <View className="bg-white rounded-3xl p-6 shadow-md border border-gray-200">
        {/* Title */}
        <Text className="text-gray-900 text-lg font-bold mb-6">
          📊 Resumen Financiero
        </Text>

        {/* Stats Grid */}
        <View className="gap-4 mb-6">
          {/* Row 1 */}
          <View className="flex-row gap-3">
            {/* Total Deuda */}
            <View className="flex-1 rounded-2xl p-4 border-2 border-blue-300 bg-blue-50">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-blue-700 text-xs font-bold mb-2 uppercase tracking-wide">
                    Total en Deudas
                  </Text>
                  <Text className="text-blue-950 text-lg font-black">
                    {totalDeuda}
                  </Text>
                </View>
                <View className="w-9 h-9 bg-blue-300 rounded-xl items-center justify-center flex-shrink-0">
                  <Ionicons name="trending-up" size={18} color="#1E3A8A" />
                </View>
              </View>
            </View>

            {/* Total Abonado */}
            <View className="flex-1 rounded-2xl p-4 border-2 border-green-300 bg-green-50">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-green-700 text-xs font-bold mb-2 uppercase tracking-wide">
                    Total Abonado
                  </Text>
                  <Text className="text-green-950 text-lg font-black">
                    {totalAbonado}
                  </Text>
                </View>
                <View className="w-9 h-9 bg-green-300 rounded-xl items-center justify-center flex-shrink-0">
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                </View>
              </View>
            </View>
          </View>

          {/* Row 2 - Pending Debt */}
          <View className="rounded-2xl p-4 border-2 border-red-300 bg-red-50">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1">
                <Text className="text-red-700 text-xs font-bold mb-2 uppercase tracking-wide">
                  Deuda Pendiente
                </Text>
                <Text className="text-red-950 text-2xl font-black">
                  {deudaPendiente}
                </Text>
              </View>
              <View className="w-10 h-10 bg-red-300 rounded-xl items-center justify-center flex-shrink-0">
                <Ionicons name="alert-circle" size={20} color="#7F1D1D" />
              </View>
            </View>

            {/* Progress Bar */}
            <View className="pt-3 border-t-2 border-red-200">
              <View className="flex-row justify-between mb-2">
                <Text className="text-red-700 text-xs font-bold">Progreso de Pago</Text>
                <Text className="text-red-900 text-xs font-black bg-red-200 px-2 py-1 rounded-full">
                  {porcentajePago.toFixed(0)}%
                </Text>
              </View>
              <View className="h-3 bg-red-200 rounded-full overflow-hidden border border-red-300">
                <View
                  style={{ width: `${Math.min(100, Math.max(0, porcentajePago))}%` }}
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Botón Abonar */}
        <TouchableOpacity
          onPress={onAbonarPress}
          className="bg-[#13678A] rounded-xl py-4 flex-row items-center justify-center shadow-md"
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text className="text-white font-bold text-base ml-2">
            + Registrar Abono
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
