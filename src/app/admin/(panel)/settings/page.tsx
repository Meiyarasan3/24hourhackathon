import { Suspense } from "react";
import { saveSettings } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";

export const metadata = { title: "Event clock" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading event clock" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  const settings = result.data.settings;
  return (
    <form action={saveSettings} className="grid max-w-xl gap-4">
      <h1 className="text-3xl font-semibold">Event clock</h1>
      <p className="text-sm text-muted-foreground">
        Official window: 15 October 2026, 09:00 to 16 October 2026, 09:00, Asia/Kolkata. The end must stay exactly 24 hours after the start. A different start time already saved in the database is kept by the migration; its end is set 24 hours later.
      </p>
      <div>
        <Label htmlFor="timezone">IANA time zone</Label>
        <Input id="timezone" name="timezone" defaultValue={settings.timezone} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="start_at">Start</Label>
        <Input id="start_at" name="start_at" defaultValue={settings.startAt ?? ""} placeholder="2026-10-15T09:00:00+05:30" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="end_at">End</Label>
        <Input id="end_at" name="end_at" defaultValue={settings.endAt ?? ""} placeholder="2026-10-16T09:00:00+05:30" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="status_override">Status override</Label>
        <Select id="status_override" name="status_override" defaultValue={settings.statusOverride ?? ""} className="mt-1">
          <option value="">Follow the clock</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </Select>
      </div>
      <Button type="submit">Save clock</Button>
    </form>
  );
}
