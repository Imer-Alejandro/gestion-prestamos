/**
 * Servicio de almacenamiento seguro
 * Wrapper que intenta usar expo-secure-store si está disponible,
 * o AsyncStorage como fallback
 */

let SecureStore: any;
let AsyncStorage: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SecureStore = require("expo-secure-store");
} catch {
  console.warn("expo-secure-store no disponible, usando AsyncStorage");
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  console.warn("AsyncStorage no disponible");
}

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (SecureStore) {
    return await SecureStore.getItemAsync(key);
  } else if (AsyncStorage) {
    return await AsyncStorage.getItem(key);
  }
  throw new Error("No storage available");
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else if (AsyncStorage) {
    await AsyncStorage.setItem(key, value);
  } else {
    throw new Error("No storage available");
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else if (AsyncStorage) {
    await AsyncStorage.removeItem(key);
  } else {
    throw new Error("No storage available");
  }
};
