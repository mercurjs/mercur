import AsyncStorage from "@react-native-async-storage/async-storage"

interface StorageLike {
  setItem: (key: string, value: string) => Promise<void> | void
  getItem: (key: string) => Promise<string | null> | string | null
  removeItem: (key: string) => Promise<void> | void
}

const STORAGE_PREFIX = "medusa_auth_"

export const createAsyncStorageAdapter = (): StorageLike => {
  async function setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, value)
  }

  async function getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`)
  }

  async function removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  }

  return { setItem, getItem, removeItem }
}

export type { StorageLike }


