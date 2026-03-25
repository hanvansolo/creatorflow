"use client";

import dynamic from "next/dynamic";
import { createScriptAction } from "../actions";

const ScriptEditorPage = dynamic(
  () => import("@/components/scripts/script-editor-page").then((m) => m.ScriptEditorPage),
  { ssr: false }
);

export default function NewScriptPage() {
  return <ScriptEditorPage createAction={createScriptAction} />;
}
