import { Suspense } from "react";
import { deleteSchedule, saveSchedule } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";
import { formatInTimeZone } from "@/lib/labels";

export const metadata = { title: "Manage schedule" };

export default function ScheduleAdminPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading schedule" />}>
      <ScheduleAdmin />
    </Suspense>
  );
}

async function ScheduleAdmin() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Schedule</h1>
      <form action={saveSchedule} className="grid gap-3 rounded-2xl border border-border p-5">
        <h2 className="font-semibold">Add milestone</h2>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="starts_at">Starts at</Label>
          <Input id="starts_at" name="starts_at" placeholder="2026-10-15T09:00:00+05:30" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="ends_at">Ends at</Label>
          <Input id="ends_at" name="ends_at" placeholder="Optional ISO timestamp" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort order</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={result.data.schedule.length + 1} className="mt-1" />
        </div>
        <Button type="submit">Add milestone</Button>
      </form>
      <ul className="space-y-3">
        {result.data.schedule.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatInTimeZone(item.startsAt, result.data.settings.timezone)}
            </p>
            <form action={deleteSchedule} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="outline">
                Delete
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
