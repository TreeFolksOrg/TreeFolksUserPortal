import { initializeApp } from "firebase/app";
import { getAuth, updateProfile } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6bu8VeBZdz4GTMk0Hb9_VQMEbekIedrc",
  authDomain: "treefolks-db.firebaseapp.com",
  projectId: "treefolks-db",
  storageBucket: "treefolks-db.firebasestorage.app",
  messagingSenderId: "1025017142016",
  appId: "1:1025017142016:web:c5d6bb147af7e7f4a1f1e5",
  measurementId: "G-QK20F1HJ6T",
};

const ADMIN_UIDS = new Set([
  "y50ryIOmhUO9lWTyQz02422Fjh42"
]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const normalizeUsername = (name, email) => {
  if (name?.trim()) {
    return name.trim();
  }
  if (!email) return "User";
  return email.split("@")[0];
};

export const ensureUserDocument = async (user) => {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const username = normalizeUsername(user.displayName, user.email);
  const isSeedAdmin = ADMIN_UIDS.has(user.uid);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      username,
      email: user.email,
      isAdmin: isSeedAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if ((!user.displayName || user.displayName === "") && username) {
      await updateProfile(user, { displayName: username }).catch(() => {});
    }
    return { username, email: user.email, isAdmin: isSeedAdmin };
  }

  const profile = snapshot.data();
  if (isSeedAdmin && !profile.isAdmin) {
    await setDoc(
      userRef,
      { isAdmin: true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { ...profile, isAdmin: true };
  }

  return profile;
};

export { app, auth, db };
