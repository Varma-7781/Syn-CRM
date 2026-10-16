import type { ReactNode } from "react";
import { PageHeader } from "./primitives";

export function AppPage({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5 animate-rise">
      <PageHeader title={title} sub={sub} actions={actions} />
      {children}
    </div>
  );
}
