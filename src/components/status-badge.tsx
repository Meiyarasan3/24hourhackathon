import { Badge } from "@/components/ui/badge";
import { progressLabel } from "@/lib/labels";
import type { ProgressStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const tones: Record<ProgressStatus, string> = {
  not_started: "text-muted-foreground",
  in_progress: "border-accent/40 text-accent",
  submitted: "border-primary/40 text-primary-foreground",
  under_review: "border-amber-300/40 text-amber-100",
  evaluated: "border-emerald-300/40 text-emerald-100",
};

export function StatusBadge({ status }: { status: ProgressStatus }) {
  return <Badge className={cn(tones[status])}>{progressLabel(status)}</Badge>;
}
