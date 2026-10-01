import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';

export type SavedItem =
  | { id: string; type: 'text'; tool: string; tag: string; text: string; createdAt: number }
  | { id: string; type: 'image'; tool: string; prompt: string; uri: string; createdAt: number };

const KEY = 'vajb-saved';

export async function loadSaved(): Promise<SavedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

async function store(items: SavedItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function saveText(tool: string, tag: string, text: string) {
  const items = await loadSaved();
  if (items.some((i) => i.type === 'text' && i.text === text)) return;
  await store([{ id: newId(), type: 'text', tool, tag, text, createdAt: Date.now() }, ...items]);
}

// Writes a generated image to a file and returns its uri. Unsaved images go to the cache,
// which the system may clear; saved ones go to app documents.
export function writeImageFile(base64: string, mimeType: string, keep = false): string {
  const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const file = new File(keep ? Paths.document : Paths.cache, `vajb-${newId()}.${ext}`);
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

export async function saveImage(tool: string, prompt: string, base64: string, mimeType: string) {
  const uri = writeImageFile(base64, mimeType, true);
  const items = await loadSaved();
  await store([{ id: newId(), type: 'image', tool, prompt, uri, createdAt: Date.now() }, ...items]);
}

export async function removeSaved(id: string) {
  const items = await loadSaved();
  const item = items.find((i) => i.id === id);
  if (item?.type === 'image') {
    try {
      new File(item.uri).delete();
    } catch {
      // already gone
    }
  }
  await store(items.filter((i) => i.id !== id));
}
