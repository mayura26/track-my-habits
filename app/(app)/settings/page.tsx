import { BucketSettingsForm } from "@/components/settings/BucketSettingsForm";
import { TestPushButton } from "@/components/settings/TestPushButton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

function getTimezoneOptions() {
  const fallback = [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
  if (typeof Intl.supportedValuesOf !== "function") return fallback;
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
}

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      timezone: true,
      bucketMorningStart: true,
      bucketDayStart: true,
      bucketEveningStart: true,
      bucketBeforeBedStart: true,
    },
  });
  const timezoneOptions = getTimezoneOptions();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionArtwork
        artifactId="settingsSanctuary"
        variant="card"
        className="w-full"
      >
        <div>
          <p className="section-kicker">Preferences</p>
          <h1 className="display-title mt-3 text-3xl font-semibold text-[#fff7ea]">
            Settings
          </h1>
          <p className="mt-2 text-sm text-[#e8dcc8]">
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
              timezone: user?.timezone ?? "UTC",
              bucketMorningStart: user?.bucketMorningStart ?? 5,
              bucketDayStart: user?.bucketDayStart ?? 11,
              bucketEveningStart: user?.bucketEveningStart ?? 17,
              bucketBeforeBedStart: user?.bucketBeforeBedStart ?? 21,
            }}
            timezoneOptions={timezoneOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Push Notifications</h2>
          <p className="text-sm text-[#b4a58a]">
            Send a test notification to verify push is working on this device.
          </p>
        </CardHeader>
        <CardContent>
          <TestPushButton />
        </CardContent>
      </Card>
    </div>
  );
}
