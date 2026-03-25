"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { createScriptAction } from "../actions";

const ScriptEditorPage = dynamic(
  () => import("@/components/scripts/script-editor-page").then((m) => m.ScriptEditorPage),
  { ssr: false }
);

export default function NewScriptPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || undefined;

  return <ScriptEditorPage createAction={createScriptAction} defaultProjectId={projectId} />;
}
