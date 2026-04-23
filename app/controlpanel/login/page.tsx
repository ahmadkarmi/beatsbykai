import type { Metadata } from "next";
import LoginForm from "@/app/controlpanel/_components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Control Panel",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cp-bg flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-cp-accent flex items-center justify-center mb-6">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-cp-text tracking-tight">Control Panel</h1>
          <p className="text-sm text-cp-muted mt-1">Listentokai — Content Management</p>
        </div>
        <LoginForm />
        <p className="text-[11px] text-cp-muted/30 mt-6 text-center">Restricted access. Authorised personnel only.</p>
      </div>
    </div>
  );
}
