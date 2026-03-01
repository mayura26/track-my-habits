import { signIn } from "@/auth";
import { Chrome } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
      <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Track My Habits</h1>
          <p className="mt-2 text-sm text-[#888888]">
            Build better habits, earn rewards
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] px-4 py-3 text-sm font-medium text-[#f5f5f5] transition-colors hover:bg-[#2a2a2a]"
          >
            <Chrome className="h-5 w-5" />
            Sign in with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#888888]">
          By signing in, you agree to track your habits consistently.
        </p>
      </div>
    </div>
  );
}
