import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join Stationery today</p>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/profile"
        />
      </div>
    </div>
  );
}
