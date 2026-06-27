import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import PageTransition from "../components/PageTransition";
import { useUser } from "../context/useUser";

type AuthMode = "sign-in" | "sign-up";

const formVariants: Variants = {
  enter: { opacity: 0, y: 20, scale: 0.97 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97 },
};

const staggerVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, signUp } = useUser();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signIn(signInEmail.trim(), signInPassword);
      navigate("/profile");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signUp(signUpName.trim(), signUpEmail.trim(), signUpPassword);
      navigate("/profile");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Sign-up failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
    setErrorMessage(null);
  };

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div
          className="auth-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="auth-card auth-card--combined">
            {/* Toggle Header */}
            <div className="auth-toggle-header" role="tablist">
              <motion.button
                className={`auth-toggle-btn ${mode === "sign-in" ? "active" : ""}`}
                onClick={() => setMode("sign-in")}
                whileTap={{ scale: 0.95 }}
                role="tab"
                aria-selected={mode === "sign-in"}
              >
                <span className="auth-toggle-icon">✦</span>
                Sign In
              </motion.button>
              <motion.button
                className={`auth-toggle-btn ${mode === "sign-up" ? "active" : ""}`}
                onClick={() => setMode("sign-up")}
                whileTap={{ scale: 0.95 }}
                role="tab"
                aria-selected={mode === "sign-up"}
              >
                <span className="auth-toggle-icon">✧</span>
                Sign Up
              </motion.button>
              <motion.div
                className="auth-toggle-indicator"
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  left: mode === "sign-in" ? "0%" : "50%",
                }}
              />
            </div>

            {/* Animated Form Container */}
            <div className="auth-form-container">
              {errorMessage && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errorMessage}
                </motion.div>
              )}
              <AnimatePresence mode="wait">
                {mode === "sign-in" ? (
                  <motion.form
                    key="sign-in"
                    variants={formVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onSubmit={handleSignIn}
                    className="auth-form"
                  >
                    <div className="auth-form-header">
                      <h1>Welcome Back</h1>
                      <p className="auth-subtitle">
                        Sign in to continue shopping
                      </p>
                    </div>

                    <motion.div
                      className="form-group"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.05 }}
                    >
                      <label htmlFor="si-email">Email</label>
                      <input
                        id="si-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="form-input"
                      />
                    </motion.div>

                    <motion.div
                      className="form-group"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.1 }}
                    >
                      <label htmlFor="si-password">Password</label>
                      <input
                        id="si-password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="form-input"
                      />
                    </motion.div>

                    <motion.button
                      type="submit"
                      className="btn btn-primary btn-full auth-submit"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.15 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.span
                          className="btn-spinner"
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                        >
                          ⟳
                        </motion.span>
                      ) : (
                        "Sign In"
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="sign-up"
                    variants={formVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onSubmit={handleSignUp}
                    className="auth-form"
                  >
                    <div className="auth-form-header">
                      <h1>Create Account</h1>
                      <p className="auth-subtitle">
                        Join our community of creators
                      </p>
                    </div>

                    <motion.div
                      className="form-group"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.05 }}
                    >
                      <label htmlFor="su-name">Full Name</label>
                      <input
                        id="su-name"
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Alex Morgan"
                        required
                        className="form-input"
                      />
                    </motion.div>

                    <motion.div
                      className="form-group"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.1 }}
                    >
                      <label htmlFor="su-email">Email</label>
                      <input
                        id="su-email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="form-input"
                      />
                    </motion.div>

                    <motion.div
                      className="form-group"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.15 }}
                    >
                      <label htmlFor="su-password">Password</label>
                      <input
                        id="su-password"
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                        className="form-input"
                      />
                    </motion.div>

                    <motion.button
                      type="submit"
                      className="btn btn-primary btn-full auth-submit"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.span
                          className="btn-spinner"
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                        >
                          ⟳
                        </motion.span>
                      ) : (
                        "Create Account"
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle Footer */}
            <motion.div
              className="auth-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <p>
                {mode === "sign-in" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={toggleMode}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={toggleMode}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
