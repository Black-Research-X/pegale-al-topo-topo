import type { GameMode } from '../types/game';

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
    if (!data || data.type !== 'SCORE_NOTIFICATION_DELIVERED' || !data.payload) return;

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
