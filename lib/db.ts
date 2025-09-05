import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'audio-player-db';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'audio-files';

interface MyDB extends DBSchema {
  [AUDIO_STORE_NAME]: {
    key: string;
    value: Blob;
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<MyDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};


export const saveAudio = async (id: string, audioBlob: Blob): Promise<void> => {
  const db = await getDb();
  await db.put(AUDIO_STORE_NAME, audioBlob, id);
};

export const getAudio = async (id: string): Promise<Blob | undefined> => {
  const db = await getDb();
  return db.get(AUDIO_STORE_NAME, id);
};

export const deleteAudio = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(AUDIO_STORE_NAME, id);
};

// Add a helper function to clear all audio files for the Clear Data feature
export const clearAllAudio = async (): Promise<void> => {
    const db = await getDb();
    await db.clear(AUDIO_STORE_NAME);
};