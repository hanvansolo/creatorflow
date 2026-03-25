import { ScriptEditorPage } from "@/components/scripts/script-editor-page";
import { createScriptAction } from "../actions";

export default function NewScriptPage() {
  return <ScriptEditorPage createAction={createScriptAction} />;
}
