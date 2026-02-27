import { z } from "zod";

// Schema for card payload
export const cardPayloadSchema = z.object({
  v: z.number(),
  name: z.string(),
  hobby: z.string(),
  quirk: z.string(),
  anchor: z.string(),
  closer: z.string(),
  generated: z.object({
    icon: z.string().optional(),
    theme: z.string(),
    fun_fact: z.string(),
    descriptors: z.array(z.string()),
    entrance: z.string().optional(),
    avatar: z.string(),
  }).optional(),
});

export type CardPayload = z.infer<typeof cardPayloadSchema>;

// Unicode-safe base64 encoding
function unicodeBtoA(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

function unicodeAtoB(str: string): string {
  return decodeURIComponent(Array.from(atob(str), c => 
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
}

// Encode card data to base64 JSON
export function encodeCardPayload(payload: CardPayload): string {
  const json = JSON.stringify(payload);
  return unicodeBtoA(json);
}

// Decode base64 JSON to card data
export function decodeCardPayload(base64: string): CardPayload | null {
  try {
    const json = unicodeAtoB(base64);
    const parsed = JSON.parse(json);
    const validated = cardPayloadSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error("Failed to decode card payload:", error);
    return null;
  }
}

// Parse QR code content in various formats
export function parseQRContent(content: string): CardPayload | null {
  // Format 1: https://...#b64=<BASE64_JSON>
  const urlHashMatch = content.match(/#b64=([A-Za-z0-9+/=]+)/);
  if (urlHashMatch) {
    return decodeCardPayload(urlHashMatch[1]);
  }

  // Format 2: carded://v1?b64=<BASE64_JSON>
  const protocolMatch = content.match(/carded:\/\/v1\?b64=([A-Za-z0-9+/=]+)/);
  if (protocolMatch) {
    return decodeCardPayload(protocolMatch[1]);
  }

  // Format 3: raw <BASE64_JSON>
  return decodeCardPayload(content);
}

// Generate shareable URL
export function generateShareURL(payload: CardPayload): string {
  const base64 = encodeCardPayload(payload);
  return `${window.location.origin}/view#b64=${base64}`;
}

// Deck storage utilities
const DECK_STORAGE_KEY = "carded.deck.v1";

export function getDeckItems(): CardPayload[] {
  try {
    const stored = sessionStorage.getItem(DECK_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

const MAX_DECK_SIZE = 5;

export function addToDeck(card: CardPayload): void {
  const deck = getDeckItems();
  deck.unshift(card);
  const trimmed = deck.slice(0, MAX_DECK_SIZE);
  sessionStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(trimmed));
}

export function removeDeckItem(index: number): void {
  const deck = getDeckItems();
  deck.splice(index, 1);
  sessionStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
}
