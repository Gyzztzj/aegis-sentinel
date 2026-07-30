// 数据存储结构
import { IHistoryRecord } from '../types'

const DB_NAME = 'aegis-sentinel'
const DB_VERSION = 1
const STORE_NAME = 'scan-history'

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
    }
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// 保存一条历史记录
export async function saveHistory(record: Omit<IHistoryRecord, 'id'>): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(record)
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
        records.push(cursor.value)
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
      resolve(request.result)
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
