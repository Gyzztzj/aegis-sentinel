const DB_NAME = 'aegis-sentinel'
const DB_VERSION = 2 // 版本升级，新增 config store
const CONFIG_STORE = 'app-config'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('scan-history')) {
        // 第一次升级时创建历史表
        const store = db.createObjectStore('scan-history', { keyPath: 'id', autoIncrement: true })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('projectPath', 'projectPath', { unique: false })
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// 应用配置
export interface IAppConfig {
  plugins: {
    [pluginName: string]: {
      enabled: boolean
      severityOverrides?: { [rule: string]: 'error' | 'warning' | 'info' }
    }
  }
  ai: {
    apiKey: string
    baseURL: string
    model: string
  }
}
// 默认应用配置
const defaultConfig: IAppConfig = {
  plugins: {},
  ai: {
    apiKey: '',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
}
// 加载应用配置
export async function loadConfig(): Promise<IAppConfig> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFIG_STORE], 'readonly')
    const store = transaction.objectStore(CONFIG_STORE)
    const request = store.get('app-config')

    request.onsuccess = () => {
      const data = request.result?.value
      resolve(data ? { ...defaultConfig, ...data } : defaultConfig)
      db.close()
    }
    request.onerror = () => {
      reject(request.error)
      db.close()
    }
  })
}
// 保存应用配置
export async function saveConfig(config: IAppConfig): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFIG_STORE], 'readwrite')
    const store = transaction.objectStore(CONFIG_STORE)
    const request = store.put({ key: 'app-config', value: config })

    request.onsuccess = () => {
      resolve()
      db.close()
    }
    request.onerror = () => {
      reject(request.error)
      db.close()
    }
  })
}
