const admin = require("firebase-admin");

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return;
  }

  const rawCredentials =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!rawCredentials) {
    console.warn(
      "[Auth] FIREBASE_SERVICE_ACCOUNT_JSON not set. Admin routes are disabled."
    );
    return;
  }

  try {
    const serviceAccount =
      typeof rawCredentials === "string"
        ? JSON.parse(rawCredentials)
        : rawCredentials;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to parse Firebase credentials:", error);
    throw new Error("Invalid Firebase service account JSON.");
  }
};

initializeFirebaseAdmin();

const ensureFirebaseReady = () => {
  if (!admin.apps.length) {
    throw new Error("Firebase admin is not initialized.");
  }
};

const authenticateRequest = async (req, res, next) => {
  try {
    ensureFirebaseReady();
  } catch (error) {
    console.error("[Auth] Firebase not configured.", error);
    return res.status(500).json({
      message: "Authentication is not configured on the server.",
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Missing auth token." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Fetch full user profile to get admin status and secondary emails
    try {
      const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        req.user = { 
          ...decodedToken, 
          ...userData, 
          admin: userData.isAdmin 
        };
        console.log('[Auth] Loaded user profile:', {
          uid: decodedToken.uid,
          email: req.user.email,
          secondaryEmails: req.user.secondaryEmails,
          admin: req.user.admin
        });
      } else {
        console.warn('[Auth] User document not found in Firestore for uid:', decodedToken.uid);
        req.user = decodedToken;
      }
    } catch (profileError) {
       console.warn("[Auth] Failed to fetch user profile:", profileError);
       req.user = decodedToken;
    }

    next();
  } catch (error) {
    console.error("[Auth] Invalid token:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  try {
    ensureFirebaseReady();
    const doc = await admin.firestore().collection("users").doc(req.user.uid).get();

    if (!doc.exists || !doc.data().isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.userProfile = doc.data();
    next();
  } catch (error) {
    console.error("[Auth] Failed to verify admin:", error);
    res.status(500).json({ message: "Unable to verify admin privileges." });
  }
};

module.exports = {
  authenticateRequest,
  requireAdmin,
};
