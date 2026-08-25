import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/download")({ component: DownloadPage });

function DownloadPage() {
  return (
    <main className="min-h-dvh bg-bg px-5 py-10 text-fg">
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">Cessna · 1964</p>
        <h1 className="text-3xl font-medium tracking-tight">Download the hangar</h1>
        <p className="text-sm leading-relaxed text-muted">
          Use one of these. Chat file chips don’t always appear — these links do.
        </p>
        <a
          href="/cessna-172e-hangar.zip"
          download="cessna-172e-hangar.zip"
          className="flex h-14 items-center justify-center rounded-[var(--radius-md)] bg-accent text-base font-medium text-accent-fg"
        >
          Download source zip (606 KB)
        </a>
        <a
          href="https://github.com/asheets1/cessna-172e-hangar/archive/refs/heads/main.zip"
          className="flex h-14 items-center justify-center rounded-[var(--radius-md)] bg-elevated text-base font-medium text-fg"
        >
          Download from GitHub
        </a>
        <a
          href="https://github.com/asheets1/cessna-172e-hangar"
          className="text-sm text-muted underline underline-offset-4"
        >
          Open the GitHub repo
        </a>
        <div className="rounded-[var(--radius-md)] bg-surface p-4 font-mono text-[12px] leading-relaxed text-muted">
          <p className="text-fg">Windows PowerShell after the zip lands in Downloads:</p>
          <pre className="mt-3 whitespace-pre-wrap text-subtle">{`Expand-Archive .\\cessna-172e-hangar.zip -DestinationPath .
cd .\\cessna-172e-hangar
npm install
npm run dev`}</pre>
          <p className="mt-3">Then open http://localhost:8080</p>
        </div>
        <a href="/" className="text-sm text-muted">
          ← Back to hangar
        </a>
      </div>
    </main>
  );
}
