import { Suspense } from "react";
import { deleteAnnouncement, saveAnnouncement } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";
import { categoryLabel } from "@/lib/labels";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/types";

export const metadata = { title: "Manage announcements" };

export default function AnnouncementsAdminPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading announcements" />}>
      <AnnouncementsAdmin />
    </Suspense>
  );
}

async function AnnouncementsAdmin() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Announcements</h1>
      <form action={saveAnnouncement} className="grid gap-4 rounded-2xl border border-border p-5">
        <h2 className="font-semibold">New announcement</h2>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue="general" className="mt-1">
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority (0–3)</Label>
          <Input id="priority" name="priority" type="number" min={0} max={3} defaultValue={1} className="mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" />
          Publish now
        </label>
        <Button type="submit">Save announcement</Button>
      </form>
      <ul className="space-y-4">
        {result.data.allAnnouncements.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-accent">
              {categoryLabel(item.category)} · {item.isPublished ? "Published" : "Draft"}
            </p>
            <h2 className="mt-1 font-semibold">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
            <form action={saveAnnouncement} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={item.id} />
              <Input name="title" defaultValue={item.title} aria-label="Title" required />
              <Textarea name="message" defaultValue={item.message} aria-label="Message" required />
              <Select name="category" defaultValue={item.category} aria-label="Category">
                {ANNOUNCEMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </Select>
              <Input name="priority" type="number" min={0} max={3} defaultValue={item.priority} aria-label="Priority" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_published" defaultChecked={item.isPublished} />
                Published
              </label>
              <Button type="submit" variant="secondary">
                Update
              </Button>
            </form>
            <form action={deleteAnnouncement} className="mt-3">
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
