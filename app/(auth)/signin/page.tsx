import { Chrome } from "lucide-react";
import { signIn } from "@/auth";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";

export default function SignInPage() {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="surface-panel rounded-[36px] p-8 md:p-10">
        <p className="section-kicker">Welcome Back</p>
        <h1 className="display-title mt-4 max-w-lg text-5xl font-semibold leading-none text-[#fff7ea] md:text-6xl">
          Build a life that feels deliberate.
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-[#d8c4a0]">
          Rituals, streaks, and quiet momentum in a calmer dashboard experience
          inspired by editorial wellness design.
        </p>

        <div className="mt-10 max-w-sm rounded-[30px] border border-[rgba(216,196,160,0.14)] bg-[rgba(8,12,10,0.24)] p-6">
          <div className="mb-8">
            <h2 className="display-title text-3xl font-semibold text-[#f7f0e1]">
              Track My Habits
            </h2>
            <p className="mt-2 text-sm text-[#b4a58a]">
              Sign in to continue your reset.
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

      <ArtworkPlaceholder
        artifactId="signinJourney"
        src="/artifacts/signin-journey.png"
        alt="Lantern-lit stone path through misty hills"
        eyebrow="Hero Artwork"
        title="Quiet reset"
      />
    </div>
  );
}
