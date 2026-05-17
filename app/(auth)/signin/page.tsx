import { Chrome } from "lucide-react";
import Image from "next/image";
import { signIn } from "@/auth";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
      <div className="surface-panel grid w-full overflow-hidden rounded-[36px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-10">
          <p className="section-kicker">Welcome Back</p>
          <h1 className="display-title mt-4 max-w-lg text-5xl font-semibold leading-none text-[#fff7ea] md:text-6xl">
            Build a life that feels deliberate.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#d8c4a0]">
            Rituals, streaks, and quiet momentum in a calmer dashboard
            experience inspired by editorial wellness design.
          </p>

          <div className="mt-10 max-w-sm rounded-[30px] border border-[rgba(216,196,160,0.14)] bg-[rgba(8,12,10,0.24)] p-6">
            <div className="mb-8 flex items-center gap-3">
              <BrandLogo
                alt=""
                size={48}
                className="h-12 w-12 border border-[rgba(230,196,139,0.28)]"
                priority
              />
              <div className="min-w-0">
                <h2 className="display-title text-3xl font-semibold leading-tight text-[#f7f0e1]">
                  Track My Habits
                </h2>
                <p className="mt-1 text-sm text-[#b4a58a]">
                  Sign in to continue your reset.
                </p>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-full border border-[rgba(230,196,139,0.4)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] px-4 py-3 text-sm font-semibold text-[#fff9ef] shadow-[0_18px_40px_rgba(130,95,45,0.25)] hover:-translate-y-0.5 hover:brightness-110"
              >
                <Chrome className="h-5 w-5" />
                Sign in with Google
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-[#b4a58a]">
              By signing in, you agree to keep showing up for your habits
              consistently.
            </p>
          </div>
        </div>

        <div className="relative min-h-[280px] border-t border-[rgba(216,196,160,0.14)] lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 isolate">
            <Image
              src="/artifacts/signin-journey.png"
              alt="Lantern-lit stone path through misty hills"
              fill
              className="artwork-placeholder-photo object-cover"
              sizes="(max-width: 1024px) 100vw, 38vw"
              priority
            />
            <div className="artwork-placeholder-scrim" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 z-[1] p-5 md:p-6">
              <p className="section-kicker">Mood</p>
              <p className="display-title mt-2 text-3xl font-semibold text-[#fff7ea]">
                Quiet reset
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
