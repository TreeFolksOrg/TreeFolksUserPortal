import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useAuth } from "../AuthProvider";

const initialSignupState = {
  username: "",
  email: "",
  secondaryEmails: "",
  password: "",
  confirmPassword: "",
};

/**
 * LoginPage - User authentication page
 * 
 * Handles:
 * - User login (email/password)
 * - User registration (signup)
 * - Redirects based on user role (admin vs landowner)
 * 
 * @component
 */
const LoginPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupValues, setSignupValues] = useState(initialSignupState);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate comma-separated email list
  const validateSecondaryEmails = (emailString) => {
    if (!emailString.trim()) return true; // Empty is valid (optional field)
    const emails = emailString.split(',').map(e => e.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
  };

  const redirectPath = useMemo(() => {
    if (!user) {
      return "/login";
    }
    return isAdmin ? "/admin/dashboard" : "/landowner/dashboard";
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      navigate(
        location.state?.from?.pathname || redirectPath,
        { replace: true },
      );
    }
  }, [user, redirectPath, navigate, location.state]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(
        error?.message || "Unable to sign in. Double check your credentials."
      );
      setIsSubmitting(false);
    }
  };

  const handleSignupChange = (event) => {
    setSignupValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setSignupError("");

    if (signupValues.password !== signupValues.confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    if (!validateSecondaryEmails(signupValues.secondaryEmails)) {
      setSignupError("Invalid email format in secondary emails. Please use comma-separated valid email addresses.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        signupValues.email.trim(),
        signupValues.password
      );

      if (signupValues.username.trim()) {
        await updateProfile(credential.user, {
          displayName: signupValues.username.trim(),
        });
      }

      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          username:
            signupValues.username.trim() ||
            signupValues.email.split("@")[0],
          email: signupValues.email.trim(),
          secondaryEmails: signupValues.secondaryEmails.trim(),
          isAdmin: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSignupValues(initialSignupState);
    } catch (error) {
      console.error("Signup failed:", error);
      setSignupError(
        error?.message ||
          "Unable to create your landowner account right now."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="grid max-w-5xl grid-cols-1 gap-10 rounded-xl bg-white p-10 shadow-xl md:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-green-600">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Sign in to TreeFolks Portal
          </h1>
          <p className="mt-4 text-sm text-gray-600">
            Admins and landowners share the same login screen. Only TreeFolks
            staff can mark an account as admin.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            New landowner?
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Create a landowner account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Admin accounts are invitation-only. Landowners can register here to
            receive updates about their projects.
          </p>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                value={signupValues.username}
                onChange={handleSignupChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={signupValues.email}
                onChange={handleSignupChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Secondary Emails <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="secondaryEmails"
                placeholder="email1@example.com, email2@example.com"
                value={signupValues.secondaryEmails}
                onChange={handleSignupChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Additional email addresses (comma-separated) that can access your project(s). Checked in both your account and Airtable.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={signupValues.password}
                  onChange={handleSignupChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={signupValues.confirmPassword}
                  onChange={handleSignupChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>
            {signupError && (
              <p className="text-sm text-red-600">{signupError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:text-green-400"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            Need help?{" "}
            <a
              href="mailto:support@treefolks.org"
              className="text-green-600 underline"
            >
              Contact TreeFolks
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
