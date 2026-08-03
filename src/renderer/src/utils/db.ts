// 数据存储结构
import { IHistoryRecord } from '../types'

const DB_NAME = 'aegis-sentinel'
const DB_VERSION = 2
const STORE_NAME = 'scan-history'
const CONFIG_STORE = 'app-config'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
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

function normalizeCreatedAt(value: unknown): string {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return new Date(value).toISOString()
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim()
    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric) && String(numeric) === trimmed) {
      return new Date(numeric).toISOString()
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return new Date().toISOString()
}

function normalizeHistoryRecord(record: IHistoryRecord): IHistoryRecord {
  return {
    id: record.id,
    projectPath: record.projectPath || '',
    projectName: record.projectName || '',
    results: Array.isArray(record.results) ? record.results : [],
    aiAdvice: typeof record.aiAdvice === 'string' ? record.aiAdvice : '',
    createdAt: normalizeCreatedAt(record.createdAt)
  }
}

export type NewHistoryRecord = Omit<IHistoryRecord, 'id' | 'createdAt'> & { createdAt?: string }

// 保存一条历史记录
export async function saveHistory(record: NewHistoryRecord): Promise<number> {
  const db = await openDB()
  const storedRecord = {
    ...record,
    createdAt: normalizeCreatedAt(record.createdAt)
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(storedRecord)
    request.onsuccess = () => {
      resolve(request.result as number)
      db.close()
    }
    request.onerror = () => {
      reject(request.error)
      db.close()
    }
  })
}

// 获取所有历史记录按时间倒序排序
export async function getAllHistory(): Promise<IHistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('createdAt')
    const request = index.openCursor(null, 'prev')

    const records: IHistoryRecord[] = []
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        records.push(normalizeHistoryRecord(cursor.value))
        cursor.continue()
      } else {
        resolve(records)
        db.close()
      }
    }
    request.onerror = () => {
      reject(request.error)
      db.close()
    }
  })
}

// 根据ID获取单条历史记录
export async function getHistoryById(id: number): Promise<IHistoryRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onsuccess = () => {
      resolve(request.result ? normalizeHistoryRecord(request.result) : undefined)
      db.close()
    }
    request.onerror = () => {
      reject(request.error)
      db.close()
    }
  })
}

// 删除一条历史记录
export async function deleteHistory(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)
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
