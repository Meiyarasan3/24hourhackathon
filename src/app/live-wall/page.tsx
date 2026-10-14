import { Suspense } from "react";
import { ErrorState } from "@/components/states";
import { getPublicData } from "@/lib/data";
import { hideSubmissionUrls } from "@/lib/live-wall";
import { LiveWall } from "./live-wall";

export const metadata = {
  title: "Live Wall",
};

export default function LiveWallPage() {
  return (
    <Suspense fallback={<p className="grid h-dvh place-items-center text-muted-foreground">Preparing the live wall…</p>}>
      <LiveWallContent />
    </Suspense>
  );
}

async function LiveWallContent() {
  const result = await getPublicData();
  if (!result.ok) {
    return (
      <div className="grid h-dvh place-items-center p-8">
        <ErrorState message={result.error} />
      </div>
    );
  }
  return <LiveWall initial={hideSubmissionUrls(result.data)} />;
}
