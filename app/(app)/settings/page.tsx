import { BucketSettingsForm } from "@/components/settings/BucketSettingsForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      bucketMorningStart: true,
      bucketDayStart: true,
      bucketEveningStart: true,
      bucketBeforeBedStart: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionArtwork
        artifactId="settingsSanctuary"
        variant="card"
        className="w-full"
      >
        <div>
          <h1 className="display-title text-3xl font-semibold text-[#fff7ea]">
            Settings
          </h1>
          <p className="text-sm text-[#e8dcc8]">
            Tune your dashboard to match your day.
          </p>
        </div>
      </SectionArtwork>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Day Buckets</h2>
          <p className="text-sm text-[#b4a58a]">
            Set the start hour for each time-of-day bucket. Tasks are grouped
            into these buckets on your dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <BucketSettingsForm
            defaultValues={{
              bucketMorningStart: user?.bucketMorningStart ?? 5,
              bucketDayStart: user?.bucketDayStart ?? 11,
              bucketEveningStart: user?.bucketEveningStart ?? 17,
              bucketBeforeBedStart: user?.bucketBeforeBedStart ?? 21,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
