import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Root Admin UID specified by user
export const ROOT_ADMIN_UID = 'H6QC4mER9SZmL58wtY3QHo0Pg6A2';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider for Gmail sign-in
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
  }
}
testConnection();

// Check if user is an Administrator
export async function checkIsAdmin(user: FirebaseUser | null): Promise<boolean> {
  if (!user) return false;
  if (user.uid === ROOT_ADMIN_UID) return true;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// Sign In with Google (Gmail)
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync user document to /users/{userId}
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Jugador',
          photoURL: user.photoURL || '',
          bestScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(
          userRef,
          {
            displayName: user.displayName || 'Jugador',
            photoURL: user.photoURL || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // If user is the Root Admin, automatically ensure admin document
      if (user.uid === ROOT_ADMIN_UID) {
        const adminRef = doc(db, 'admins', ROOT_ADMIN_UID);
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            adminId: ROOT_ADMIN_UID,
            email: user.email || 'admin@mole.arcade',
            displayName: user.displayName || 'Super Admin',
            addedBy: 'SYSTEM_ROOT',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }

    return user;
  } catch (err) {
    console.error('Error signing in with Google:', err);
    throw err;
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ADMIN SERVICE FUNCTIONS

export interface AdminUserData {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bestScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminScoreData {
  id: string;
  userId: string;
  playerName: string;
  userEmail?: string;
  score: number;
  mode: string;
  difficulty: string;
  accuracy: number;
  maxCombo: number;
  molesHit: number;
  createdAt?: string;
}

export interface AdminRecordData {
  id: string;
  adminId: string;
  email: string;
  displayName?: string;
  addedBy?: string;
  createdAt?: string;
}

// Fetch all registered users
export async function fetchAllUsers(): Promise<AdminUserData[]> {
  try {
    const q = query(collection(db, 'users'), limit(100));
    const snap = await getDocs(q);
    const users: AdminUserData[] = [];
    snap.forEach((d) => {
      const data = d.data();
      users.push({
        id: d.id,
        userId: data.userId || d.id,
        email: data.email || 'Sin correo',
        displayName: data.displayName || 'Sin nombre',
        photoURL: data.photoURL,
        bestScore: data.bestScore || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    return users;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

// Delete user document
export async function deleteUserDoc(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

// Fetch all scores for admin
export async function fetchAllScores(): Promise<AdminScoreData[]> {
  try {
    const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(150));
    const snap = await getDocs(q);
    const scores: AdminScoreData[] = [];
    snap.forEach((d) => {
      const data = d.data();
      scores.push({
        id: d.id,
        userId: data.userId,
        playerName: data.playerName || 'Jugador',
        userEmail: data.userEmail,
        score: data.score || 0,
        mode: data.mode || 'TIME_ATTACK',
        difficulty: data.difficulty || 'MEDIUM',
        accuracy: data.accuracy || 0,
        maxCombo: data.maxCombo || 0,
        molesHit: data.molesHit || 0,
        createdAt: data.createdAt,
      });
    });
    return scores;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'scores');
  }
}

// Delete score record
export async function deleteScoreDoc(scoreId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'scores', scoreId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `scores/${scoreId}`);
  }
}

// Fetch all admins
export async function fetchAllAdmins(): Promise<AdminRecordData[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    const admins: AdminRecordData[] = [];
    snap.forEach((d) => {
      const data = d.data();
      admins.push({
        id: d.id,
        adminId: data.adminId || d.id,
        email: data.email || '',
        displayName: data.displayName || 'Admin',
        addedBy: data.addedBy,
        createdAt: data.createdAt,
      });
    });

    // Ensure ROOT_ADMIN_UID is listed even before first write
    if (!admins.some((a) => a.adminId === ROOT_ADMIN_UID)) {
      admins.unshift({
        id: ROOT_ADMIN_UID,
        adminId: ROOT_ADMIN_UID,
        email: 'root.admin@mole.arcade',
        displayName: 'Administrador Principal (Root)',
        addedBy: 'SYSTEM_ROOT',
        createdAt: new Date().toISOString(),
      });
    }

    return admins;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'admins');
  }
}

// Add new admin
export async function addAdminUser(
  adminId: string,
  email: string,
  displayName: string = 'Administrador'
): Promise<void> {
  try {
    const callerUid = auth.currentUser?.uid || 'UNKNOWN';
    await setDoc(doc(db, 'admins', adminId), {
      adminId,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || 'Admin',
      addedBy: callerUid,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `admins/${adminId}`);
  }
}

// Remove admin
export async function removeAdminUser(adminId: string): Promise<void> {
  if (adminId === ROOT_ADMIN_UID) {
    throw new Error('No se puede eliminar al Administrador Principal (Root).');
  }
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
  }
}
