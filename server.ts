import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import express, { type Request, type Response } from 'express';
import { generateVAPIDKeys, setVapidDetails, sendNotification } from 'web-push';

const ROOT_ADMIN_UID = 'H6QC4mER9SZmL58wtY3QHo0Pg6A2';
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const VAPID_KEYS_FILE = path.join(DATA_DIR, 'vapid-keys.json');
const PUSH_STORE_FILE = path.join(DATA_DIR, 'push-store.json');

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

interface StoredPushSubscription {
  subscriptionId: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  updatedAt: number;
}

interface ScheduledScoreJob {
  jobId: string;
  userId: string;
  title: string;
  body: string;
  score: number;
  fireAt: number;
}

interface PushStore {
  subscriptions: Record<string, StoredPushSubscription>;
  scheduledJobs: ScheduledScoreJob[];
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

const firebaseConfig = loadFirebaseConfig();
const firebaseDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  if (Date.now() < certsExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`No se pudieron obtener certificados de Firebase (${res.status})`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await res.json()) as Record<string, string>;
  certsExpiresAt = Date.now() + maxAgeSec * 1000;
  return cachedCerts;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const jsonStr = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(jsonStr) as T;
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string }> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Token JWT inválido.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algoritmo o kid de token inválido.');
  }

  const certs = await getFirebasePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Certificado de firma no encontrado.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  const signatureBuf = Buffer.from(
    signatureB64.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );
  if (!verifier.verify(certPem, signatureBuf)) {
    throw new Error('Firma del token inválida.');
  }

  const payload = decodeBase64UrlJson<{
    exp?: number;
    iat?: number;
    auth_time?: number;
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
  }>(payloadB64);

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Token expirado.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Token iat inválido.');
  }
  if (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 300) {
    throw new Error('Token auth_time inválido.');
  }
  if (payload.aud !== firebaseConfig.projectId) {
    throw new Error('Audiencia de token inválida.');
  }
  if (payload.iss !== `https://securetoken.google.com/${firebaseConfig.projectId}`) {
    throw new Error('Emisor de token inválido.');
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error('UID de token inválido.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

function getOrCreateVapidKeys(): { publicKey: string; privateKey: string; subject: string } {
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || 'mailto:info@blackresearchx.com';

  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv, subject };
  }

  ensureDataDir();
  if (fs.existsSync(VAPID_KEYS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, 'utf8')) as {
        publicKey?: string;
        privateKey?: string;
      };
      if (saved.publicKey && saved.privateKey) {
        return { publicKey: saved.publicKey, privateKey: saved.privateKey, subject };
      }
    } catch {
      // Regenerate if corrupted
    }
  }

  const generated = generateVAPIDKeys();
  fs.writeFileSync(
    VAPID_KEYS_FILE,
    JSON.stringify({ publicKey: generated.publicKey, privateKey: generated.privateKey }, null, 2),
    { mode: 0o600 }
  );
  return { publicKey: generated.publicKey, privateKey: generated.privateKey, subject };
}

const vapid = getOrCreateVapidKeys();
setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

function readPushStore(): PushStore {
  ensureDataDir();
  if (!fs.existsSync(PUSH_STORE_FILE)) {
    return { subscriptions: {}, scheduledJobs: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PUSH_STORE_FILE, 'utf8')) as Partial<PushStore>;
    return {
      subscriptions: parsed.subscriptions || {},
      scheduledJobs: Array.isArray(parsed.scheduledJobs) ? parsed.scheduledJobs : [],
    };
  } catch {
    return { subscriptions: {}, scheduledJobs: [] };
  }
}

let pushStore: PushStore = readPushStore();
const activeJobTimers = new Map<string, ReturnType<typeof setTimeout>>();

function persistPushStore(): void {
  ensureDataDir();
  fs.writeFileSync(PUSH_STORE_FILE, JSON.stringify(pushStore, null, 2), { mode: 0o600 });
}

function hashEndpoint(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.local') || lower === '::1') return true;
  if (net.isIP(lower)) {
    if (lower.startsWith('127.') || lower.startsWith('10.') || lower.startsWith('192.168.') || lower.startsWith('169.254.')) {
      return true;
    }
    if (lower.startsWith('172.')) {
      const secondOctet = Number(lower.split('.')[1]);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }
  return false;
}

function validatePushSubscriptionInput(raw: unknown): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };

  if (typeof candidate.endpoint !== 'string' || candidate.endpoint.length > 1024) return null;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate.endpoint);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== 'https:' || isPrivateOrLocalHostname(parsedUrl.hostname)) {
    return null;
  }

  if (!candidate.keys || typeof candidate.keys !== 'object') return null;
  const { p256dh, auth } = candidate.keys;
  if (
    typeof p256dh !== 'string' ||
    p256dh.length === 0 ||
    p256dh.length > 512 ||
    typeof auth !== 'string' ||
    auth.length === 0 ||
    auth.length > 256
  ) {
    return null;
  }

  return {
    endpoint: candidate.endpoint,
    keys: { p256dh, auth },
  };
}

async function verifyFirebaseCaller(
  req: Request
): Promise<{ uid: string; email?: string; idToken: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) return null;

  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      idToken,
    };
  } catch {
    return null;
  }
}

async function verifyCallerIsAdmin(uid: string, idToken: string): Promise<boolean> {
  if (uid === ROOT_ADMIN_UID) return true;

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(firebaseDatabaseId)}/documents/admins/${encodeURIComponent(uid)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface FirestoreDoc {
  name?: string;
  fields?: Record<string, { stringValue?: string }>;
}

async function fetchSubscriptionsFromFirestoreAsAdmin(
  idToken: string
): Promise<StoredPushSubscription[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(firebaseDatabaseId)}/documents/push_subscriptions?pageSize=200`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { documents?: FirestoreDoc[] };
    const docs = data.documents || [];
    const results: StoredPushSubscription[] = [];

    for (const docItem of docs) {
      const fields = docItem.fields;
      if (!fields) continue;
      const endpoint = fields.endpoint?.stringValue;
      const p256dh = fields.p256dh?.stringValue;
      const auth = fields.auth?.stringValue;
      const userId = fields.userId?.stringValue;
      const subscriptionId = fields.subscriptionId?.stringValue || (endpoint ? hashEndpoint(endpoint) : '');

      const validated = validatePushSubscriptionInput({
        endpoint,
        keys: { p256dh, auth },
      });

      if (validated && userId && subscriptionId) {
        results.push({
          subscriptionId,
          userId,
          endpoint: validated.endpoint,
          keys: validated.keys,
          updatedAt: Date.now(),
        });
      }
    }
    return results;
  } catch (err) {
    console.warn('No se pudieron leer suscripciones de Firestore:', err);
    return [];
  }
}

async function deleteExpiredSubscriptionFromFirestore(
  subscriptionId: string,
  adminIdToken?: string
): Promise<void> {
  if (!adminIdToken) return;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(
    firebaseDatabaseId
  )}/documents/push_subscriptions/${encodeURIComponent(subscriptionId)}`;
  try {
    await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminIdToken}` },
    });
  } catch {
    // ignore cleanup failure
  }
}

async function sendWebPushToSubscription(
  sub: StoredPushSubscription,
  payload: Record<string, unknown>,
  adminIdToken?: string
): Promise<boolean> {
  try {
    await sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      JSON.stringify(payload),
      { TTL: 3600 }
    );
    return true;
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;

    if (statusCode === 404 || statusCode === 410) {
      delete pushStore.subscriptions[sub.subscriptionId];
      persistPushStore();
      void deleteExpiredSubscriptionFromFirestore(sub.subscriptionId, adminIdToken);
    } else {
      console.warn(`Error enviando Web Push (${statusCode || 'unknown'}):`, err);
    }
    return false;
  }
}

function removeScheduledJobFromStore(jobId: string): void {
  const timer = activeJobTimers.get(jobId);
  if (timer) {
    clearTimeout(timer);
    activeJobTimers.delete(jobId);
  }
  const before = pushStore.scheduledJobs.length;
  pushStore.scheduledJobs = pushStore.scheduledJobs.filter((j) => j.jobId !== jobId);
  if (pushStore.scheduledJobs.length !== before) {
    persistPushStore();
  }
}

function scheduleServerJobTimer(job: ScheduledScoreJob): void {
  const existingTimer = activeJobTimers.get(job.jobId);
  if (existingTimer) clearTimeout(existingTimer);

  const delayMs = Math.max(0, job.fireAt - Date.now());
  const timer = setTimeout(async () => {
    removeScheduledJobFromStore(job.jobId);

    const userSubs = Object.values(pushStore.subscriptions).filter(
      (s) => s.userId === job.userId
    );
    if (userSubs.length === 0) return;

    const pushPayload = {
      type: 'SCORE_REMINDER',
      id: job.jobId,
      title: job.title,
      body: job.body,
      score: job.score,
      url: '/',
    };

    await Promise.allSettled(
      userSubs.map((sub) => sendWebPushToSubscription(sub, pushPayload))
    );
  }, delayMs);

  activeJobTimers.set(job.jobId, timer);
}

// Re-hydrate any pending 1-minute jobs across restarts
for (const pendingJob of pushStore.scheduledJobs) {
  scheduleServerJobTimer(pendingJob);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Public VAPID key for browser PushManager.subscribe
  app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
    res.json({ publicKey: vapid.publicKey });
  });

  // Save/update user device Web Push subscription
  app.post('/api/push/subscribe', async (req: Request, res: Response) => {
    const caller = await verifyFirebaseCaller(req);
    if (!caller) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }

    const validated = validatePushSubscriptionInput(req.body?.subscription);
    if (!validated) {
      res.status(400).json({ error: 'Suscripción push inválida.' });
      return;
    }

    const subscriptionId = hashEndpoint(validated.endpoint);
    pushStore.subscriptions[subscriptionId] = {
      subscriptionId,
      userId: caller.uid,
      endpoint: validated.endpoint,
      keys: validated.keys,
      updatedAt: Date.now(),
    };
    persistPushStore();

    res.json({ ok: true, subscriptionId });
  });

  // Unsubscribe device
  app.post('/api/push/unsubscribe', async (req: Request, res: Response) => {
    const caller = await verifyFirebaseCaller(req);
    if (!caller) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }

    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint requerido.' });
      return;
    }

    const subscriptionId = hashEndpoint(endpoint);
    const existing = pushStore.subscriptions[subscriptionId];
    if (existing && existing.userId === caller.uid) {
      delete pushStore.subscriptions[subscriptionId];
      persistPushStore();
    }

    res.json({ ok: true });
  });

  // Schedule 1-minute post-match push notification server-side
  app.post('/api/push/schedule-score', async (req: Request, res: Response) => {
    const caller = await verifyFirebaseCaller(req);
    if (!caller) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }

    const rawId = typeof req.body?.id === 'string' ? req.body.id.slice(0, 64) : `${Date.now()}`;
    const rawScore = Number(req.body?.score);
    const score = Number.isFinite(rawScore) && rawScore >= 0 ? Math.round(rawScore) : 0;
    const modeLabel =
      typeof req.body?.modeLabel === 'string'
        ? req.body.modeLabel.trim().slice(0, 40)
        : 'Arcade';
    const playerName =
      typeof req.body?.playerName === 'string'
        ? req.body.playerName.trim().slice(0, 60)
        : '';

    const rawDelay = Number(req.body?.delayMs);
    const delayMs =
      Number.isFinite(rawDelay) && rawDelay >= 5000 && rawDelay <= 300000
        ? Math.round(rawDelay)
        : 60000;

    if (req.body?.subscription) {
      const validated = validatePushSubscriptionInput(req.body.subscription);
      if (validated) {
        const subId = hashEndpoint(validated.endpoint);
        pushStore.subscriptions[subId] = {
          subscriptionId: subId,
          userId: caller.uid,
          endpoint: validated.endpoint,
          keys: validated.keys,
          updatedAt: Date.now(),
        };
      }
    }

    // Cancel any previous pending score job for this user so only latest match fires
    const priorJobs = pushStore.scheduledJobs.filter((j) => j.userId === caller.uid);
    for (const pj of priorJobs) {
      const t = activeJobTimers.get(pj.jobId);
      if (t) {
        clearTimeout(t);
        activeJobTimers.delete(pj.jobId);
      }
    }
    pushStore.scheduledJobs = pushStore.scheduledJobs.filter((j) => j.userId !== caller.uid);

    const greeting = playerName ? `${playerName}, tu` : 'Tu';
    const job: ScheduledScoreJob = {
      jobId: rawId,
      userId: caller.uid,
      title: '¡Tu último puntaje en Pégale al Topo!',
      body: `${greeting} última partida (${modeLabel}) terminó con ${score.toLocaleString()} pts. ¡Vuelve a superar tu récord!`,
      score,
      fireAt: Date.now() + delayMs,
    };

    pushStore.scheduledJobs.push(job);
    persistPushStore();
    scheduleServerJobTimer(job);

    res.json({ ok: true, jobId: job.jobId, fireAt: job.fireAt });
  });

  // Admin-only broadcast Web Push to all subscribed users
  app.post('/api/push/broadcast', async (req: Request, res: Response) => {
    const caller = await verifyFirebaseCaller(req);
    if (!caller) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }

    const isAdmin = await verifyCallerIsAdmin(caller.uid, caller.idToken);
    if (!isAdmin) {
      res.status(403).json({ error: 'Solo los administradores pueden enviar avisos globales.' });
      return;
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 100) : '';
    const message =
      typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 500) : '';
    const senderName =
      typeof req.body?.senderName === 'string'
        ? req.body.senderName.trim().slice(0, 100)
        : 'Administrador';
    const announcementId =
      typeof req.body?.id === 'string' && req.body.id.trim()
        ? req.body.id.trim().slice(0, 128)
        : `${Date.now()}`;

    if (!title || !message) {
      res.status(400).json({ error: 'Título y mensaje son obligatorios.' });
      return;
    }

    // Merge subscriptions from Firestore (enforced by firestore.rules) + local server store
    const firestoreSubs = await fetchSubscriptionsFromFirestoreAsAdmin(caller.idToken);
    const mergedByEndpoint = new Map<string, StoredPushSubscription>();

    for (const sub of Object.values(pushStore.subscriptions)) {
      mergedByEndpoint.set(sub.endpoint, sub);
    }
    for (const sub of firestoreSubs) {
      mergedByEndpoint.set(sub.endpoint, sub);
      pushStore.subscriptions[sub.subscriptionId] = sub;
    }
    persistPushStore();

    const targets = Array.from(mergedByEndpoint.values());
    const pushPayload = {
      type: 'ADMIN_BROADCAST',
      id: announcementId,
      title: `📢 ${title}`,
      rawTitle: title,
      body: message,
      senderName,
      url: '/',
    };

    const results = await Promise.all(
      targets.map((sub) => sendWebPushToSubscription(sub, pushPayload, caller.idToken))
    );

    const sentCount = results.filter(Boolean).length;
    const failedCount = results.length - sentCount;

    res.json({
      ok: true,
      totalTargets: targets.length,
      sentCount,
      failedCount,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pégale al Topo server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
