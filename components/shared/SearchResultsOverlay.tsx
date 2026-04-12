import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchResultsOverlayProps {
  isVisible: boolean;
  results: any[];
  onResultPress: (client: any) => void;
  onClose: () => void;
}

export default function SearchResultsOverlay({ 
  isVisible, 
  results, 
  onResultPress, 
  onClose 
}: SearchResultsOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      <TouchableOpacity 
        className="absolute inset-0 z-40" 
        activeOpacity={1} 
        onPress={onClose}
      />
      <View 
        className="absolute top-[200px] left-6 right-6 bg-white rounded-2xl z-50 max-h-[350px] border border-gray-100 shadow-xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 15,
        }}
      >
        {results.length === 0 ? (
          <View className="p-8 items-center">
            <Ionicons name="search-outline" size={40} color="#cbd5e1" />
            <Text className="text-gray-400 font-medium mt-3 text-center">
              No se hallaron coincidencias
            </Text>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
            {results.map((client, index) => (
              <TouchableOpacity
                key={client.id}
                onPress={() => onResultPress(client)}
                className={`flex-row items-center p-4 active:bg-gray-50 ${
                  index !== results.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                <View className="w-10 h-10 bg-[#13678A]/10 rounded-full items-center justify-center mr-3">
                  <Text className="text-[#13678A] font-bold text-sm">
                    {client.first_name?.[0] || ""}{client.last_name?.[0] || ""}
                  </Text>
                </View>
                
                {/* Información */}
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-sm">
                    {client.first_name} {client.last_name}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Doc: {client.document_number}
                  </Text>
                </View>

                {/* Status Indicator */}
                <View className={`px-2 py-1 rounded-md mr-3 ${
                    client.status === 'al-dia' ? 'bg-green-100' : 
                    client.status === 'proximo-mora' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                  <Text className={`text-[10px] font-bold ${
                    client.status === 'al-dia' ? 'text-green-700' : 
                    client.status === 'proximo-mora' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {client.status === 'al-dia' ? 'AL DÍA' : 
                     client.status === 'proximo-mora' ? 'AVISO' : 'MORA'}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}
