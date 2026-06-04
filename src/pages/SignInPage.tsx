import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/profile"
        />
      </div>
    </div>
  );
}
