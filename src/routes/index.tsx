import { createFileRoute } from "@tanstack/react-router";
import { HangarApp } from "@/components/hangar/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="h-dvh overflow-hidden bg-bg text-fg">
      <HangarApp />
    </main>
  );
}
