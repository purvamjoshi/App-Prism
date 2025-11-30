import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import HomeClient from "./components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand)]" />
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}
