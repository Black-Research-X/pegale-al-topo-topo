import type { GameMode } from '../types/game';
import { auth, savePushSubscriptionToFirestore } from '../lib/firebase';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export interface ScoreNotificationPayload {
  id: string;
  title: string;
  body: string;
  score?: number;
  modeLabel?: string;
  fireAt: number;
  delivered: boolean;
  kind?: 'LAST_SCORE' | 'ADMIN_BROADCAST';
  senderName?: string;
}

const STORAGE_KEY = 'mole_pending_score_notification';
const SEEN_ANNOUNCEMENTS_KEY = 'mole_seen_announcement_ids';
const ANNOUNCEMENT_CUTOFF_KEY = 'mole_announcement_cutoff_ms';
export const SCORE_NOTIFICATION_DELAY_MS = 60_000; // 1 minuto exacto

const deliveredIds = new Set<string>();
const seenAnnouncementIdsMemory = new Set<string>();
let backupTimerId: number | null = null;

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('No se pudo solicitar permiso de notificaciones:', err);
    return getNotificationPermission();
  }
}

export function getGameModeLabel(mode: GameMode): string {
  switch (mode) {
    case 'TIME_ATTACK':
      return 'Contrarreloj';
    case 'SURVIVAL':
      return 'Supervivencia';
    case 'FRENZY':
      return 'Frenesí Arcade';
    default:
      return 'Arcade';
  }
}

function readPendingNotification(): ScoreNotificationPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScoreNotificationPayload;
  } catch {
    return null;
  }
}

function savePendingNotification(payload: ScoreNotificationPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function markAsDelivered(id: string): boolean {
  if (deliveredIds.has(id)) return false;
  const current = readPendingNotification();
  if (current && current.id === id && current.delivered) {
    deliveredIds.add(id);
    return false;
  }

  deliveredIds.add(id);
  if (current && current.id === id) {
    savePendingNotification({ ...current, delivered: true });
  }
  return true;
}

async function postMessageToServiceWorker(message: unknown): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
      return true;
    }
  } catch (err) {
    console.warn('Error al comunicar con Service Worker:', err);
  }
  return false;
}

async function showBrowserNotificationFallback(payload: ScoreNotificationPayload): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `pegale-al-topo-score-${payload.id}`,
    data: {
      url: '/',
      score: payload.score,
      id: payload.id,
    },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(payload.title, options);
        return;
      }
    }
    new Notification(payload.title, options);
  } catch (err) {
    console.warn('Fallback de notificación del navegador falló:', err);
  }
}

function clearBackupTimer(): void {
  if (backupTimerId !== null && typeof window !== 'undefined') {
    window.clearTimeout(backupTimerId);
    backupTimerId = null;
  }
}

function scheduleTimersForPayload(
  payload: ScoreNotificationPayload,
  delayMs: number,
  onInAppNotify: (notified: ScoreNotificationPayload) => void
): void {
  clearBackupTimer();

  // Programar en Service Worker
  void postMessageToServiceWorker({
    type: 'SCHEDULE_SCORE_NOTIFICATION',
    payload: {
      id: payload.id,
      title: payload.title,
      body: payload.body,
      score: payload.score,
      delayMs,
    },
  });

  // Respaldo en cliente ligeramente después (+450ms) por si el SW fue suspendido
  backupTimerId = window.setTimeout(async () => {
    backupTimerId = null;
    const isFreshDelivery = markAsDelivered(payload.id);
    if (!isFreshDelivery) return;

    await showBrowserNotificationFallback(payload);
    onInAppNotify({ ...payload, delivered: true });
  }, delayMs + 450);
}

async function getFirebaseIdToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function computeSubscriptionId(endpoint: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(endpoint);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return endpoint.replace(/[^a-zA-Z0-9_-]/g, '').slice(-64);
}

export async function getActivePushSubscription(): Promise<PushSubscriptionJSON | null> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub ? sub.toJSON() : null;
  } catch {
    return null;
  }
}

export async function syncWebPushSubscription(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !isNotificationSupported() ||
    Notification.permission !== 'granted' ||
    !auth.currentUser
  ) {
    return false;
  }

  try {
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) return false;
    const { publicKey } = (await keyRes.json()) as { publicKey?: string };
    if (!publicKey) return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // Re-subscribe if missing or applicationServerKey differs
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return false;
    }

    const subscriptionId = await computeSubscriptionId(subJson.endpoint);

    // 1. Persistir en Firestore para alcance global entre sesiones/servidores
    await savePushSubscriptionToFirestore({
      subscriptionId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      authKey: subJson.keys.auth,
    });

    // 2. Registrar en servidor Node.js para envíos inmediatos y diferidos en segundo plano
    const idToken = await getFirebaseIdToken();
    if (idToken) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ subscription: subJson }),
      });
    }

    return true;
  } catch (err) {
    console.warn('No se pudo sincronizar la suscripción Web Push VAPID:', err);
    return false;
  }
}

async function scheduleScorePushOnServer(params: {
  id: string;
  score: number;
  modeLabel: string;
  playerName?: string | null;
}): Promise<void> {
  try {
    const idToken = await getFirebaseIdToken();
    if (!idToken) return;

    const subscription = await getActivePushSubscription();
    await fetch('/api/push/schedule-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id: params.id,
        score: params.score,
        modeLabel: params.modeLabel,
        playerName: params.playerName || '',
        delayMs: SCORE_NOTIFICATION_DELAY_MS,
        subscription,
      }),
    });
  } catch (err) {
    console.warn('No se pudo programar el push en el servidor:', err);
  }
}

export function scheduleLastScoreNotification(
  params: {
    score: number;
    mode: GameMode;
    playerName?: string | null;
  },
  onInAppNotify: (payload: ScoreNotificationPayload) => void
): ScoreNotificationPayload {
  const modeLabel = getGameModeLabel(params.mode);
  const cleanName = params.playerName?.trim();
  const greeting = cleanName ? `${cleanName}, tu` : 'Tu';

  const payload: ScoreNotificationPayload = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '¡Tu último puntaje en Pégale al Topo!',
    body: `${greeting} última partida (${modeLabel}) terminó con ${params.score.toLocaleString()} pts. ¡Vuelve a superar tu récord!`,
    score: params.score,
    modeLabel,
    fireAt: Date.now() + SCORE_NOTIFICATION_DELAY_MS,
    delivered: false,
  };

  savePendingNotification(payload);
  scheduleTimersForPayload(payload, SCORE_NOTIFICATION_DELAY_MS, onInAppNotify);
  void scheduleScorePushOnServer({
    id: payload.id,
    score: params.score,
    modeLabel,
    playerName: cleanName,
  });
  return payload;
}

export function restorePendingScoreNotification(
  onInAppNotify: (payload: ScoreNotificationPayload) => void
): ScoreNotificationPayload | null {
  const pending = readPendingNotification();
  if (!pending || pending.delivered) return null;

  const remainingMs = pending.fireAt - Date.now();
  if (remainingMs <= 0) {
    const isFresh = markAsDelivered(pending.id);
    if (isFresh) {
      void showBrowserNotificationFallback(pending);
      onInAppNotify({ ...pending, delivered: true });
    }
    return null;
  }

  scheduleTimersForPayload(pending, remainingMs, onInAppNotify);
  return pending;
}

export function subscribeToServiceWorkerNotifications(
  onInAppNotify: (payload: ScoreNotificationPayload) => void
): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || !data.payload) return;

    if (data.type === 'SCORE_NOTIFICATION_DELIVERED') {
      const incoming = data.payload as { id: string; title: string; body: string; score: number };
      const isFresh = markAsDelivered(incoming.id);
      if (!isFresh) return;

      clearBackupTimer();
      const stored = readPendingNotification();
      const fullPayload: ScoreNotificationPayload = {
        id: incoming.id,
        title: incoming.title,
        body: incoming.body,
        score: incoming.score,
        modeLabel: stored?.modeLabel || 'Arcade',
        fireAt: stored?.fireAt || Date.now(),
        delivered: true,
      };
      onInAppNotify(fullPayload);
    } else if (data.type === 'ADMIN_PUSH_DELIVERED') {
      const incoming = data.payload as {
        id: string;
        title: string;
        body: string;
        senderName?: string;
      };
      const seen = getSeenAnnouncementIds();
      if (seen.has(incoming.id)) return;
      markAnnouncementSeen(incoming.id, Date.now());
      onInAppNotify({
        id: incoming.id,
        title: incoming.title,
        body: incoming.body,
        fireAt: Date.now(),
        delivered: true,
        kind: 'ADMIN_BROADCAST',
        senderName: incoming.senderName || 'Administrador',
      });
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);
  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
}

export function cancelPendingScoreNotification(): void {
  clearBackupTimer();
  const pending = readPendingNotification();
  if (pending && !pending.delivered) {
    savePendingNotification({ ...pending, delivered: true });
  }
  void postMessageToServiceWorker({ type: 'CANCEL_SCORE_NOTIFICATION' });
}

function getAnnouncementCutoffMs(): number {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_CUTOFF_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    // Primera visita: recordar últimos 2 minutos para recibir avisos recién enviados sin inundar historial viejo
    const initialCutoff = Date.now() - 2 * 60 * 1000;
    localStorage.setItem(ANNOUNCEMENT_CUTOFF_KEY, String(initialCutoff));
    return initialCutoff;
  } catch {
    return Date.now() - 2 * 60 * 1000;
  }
}

function getSeenAnnouncementIds(): Set<string> {
  const combined = new Set(seenAnnouncementIdsMemory);
  try {
    const raw = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (typeof id === 'string') combined.add(id);
        });
      }
    }
  } catch {
    // ignore
  }
  return combined;
}

function markAnnouncementSeen(id: string, createdAtMs: number): void {
  seenAnnouncementIdsMemory.add(id);
  try {
    const existing = Array.from(getSeenAnnouncementIds());
    if (!existing.includes(id)) existing.push(id);
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(existing.slice(-40)));

    const prevCutoff = getAnnouncementCutoffMs();
    if (createdAtMs > prevCutoff) {
      localStorage.setItem(ANNOUNCEMENT_CUTOFF_KEY, String(createdAtMs));
    }
  } catch {
    // ignore
  }
}

export async function triggerAdminBroadcastNotification(
  announcement: {
    id: string;
    title: string;
    message: string;
    senderName?: string;
    createdAtMs: number;
  },
  onInAppNotify: (payload: ScoreNotificationPayload) => void
): Promise<boolean> {
  const seen = getSeenAnnouncementIds();
  if (seen.has(announcement.id)) return false;

  const cutoffMs = getAnnouncementCutoffMs();
  if (announcement.createdAtMs < cutoffMs) {
    markAnnouncementSeen(announcement.id, announcement.createdAtMs);
    return false;
  }

  markAnnouncementSeen(announcement.id, announcement.createdAtMs);

  const payload: ScoreNotificationPayload = {
    id: announcement.id,
    title: announcement.title,
    body: announcement.message,
    fireAt: Date.now(),
    delivered: true,
    kind: 'ADMIN_BROADCAST',
    senderName: announcement.senderName || 'Administrador',
  };

  // Intentar notificación push real vía Service Worker
  const sentToSw = await postMessageToServiceWorker({
    type: 'SHOW_IMMEDIATE_NOTIFICATION',
    payload: {
      id: payload.id,
      title: `📢 ${payload.title}`,
      body: payload.body,
      tagPrefix: 'pegale-al-topo-admin-',
    },
  });

  if (!sentToSw) {
    await showBrowserNotificationFallback({
      ...payload,
      title: `📢 ${payload.title}`,
    });
  }

  onInAppNotify(payload);
  return true;
}

export async function sendBroadcastPushViaServer(params: {
  id: string;
  title: string;
  message: string;
  senderName?: string | null;
}): Promise<{ ok: boolean; totalTargets: number; sentCount: number; failedCount: number }> {
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    return { ok: false, totalTargets: 0, sentCount: 0, failedCount: 0 };
  }

  try {
    const res = await fetch('/api/push/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id: params.id,
        title: params.title,
        message: params.message,
        senderName:
          params.senderName ||
          auth.currentUser?.displayName ||
          auth.currentUser?.email ||
          'Administrador',
      }),
    });

    if (!res.ok) {
      return { ok: false, totalTargets: 0, sentCount: 0, failedCount: 0 };
    }

    return (await res.json()) as {
      ok: boolean;
      totalTargets: number;
      sentCount: number;
      failedCount: number;
    };
  } catch (err) {
    console.warn('Error llamando a /api/push/broadcast:', err);
    return { ok: false, totalTargets: 0, sentCount: 0, failedCount: 0 };
  }
}
