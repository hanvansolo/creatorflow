'use client';

import { useState, useTransition } from 'react';
import { Code, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface ScriptSetting {
  key: string;
  description: string;
  value: string;
  updatedAt: string | null;
}

interface ScriptsEditorProps {
  scripts: ScriptSetting[];
  secret?: string; // Deprecated, kept for compatibility
}

const SCRIPT_LABELS: Record<string, { label: string; placeholder: string; hint: string }> = {
  script_head: {
    label: 'Head Scripts',
    placeholder: '<!-- Google Analytics, Meta Pixel, etc. -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag("js", new Date());\n  gtag("config", "G-XXXXXXX");\n</script>',
    hint: 'Scripts placed in <head>. Best for: Google Analytics, Meta Pixel, Tag Manager, Schema.org JSON-LD, meta tags.',
  },
  script_body_start: {
    label: 'Body Start Scripts',
    placeholder: '<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
    hint: 'Scripts placed immediately after <body>. Best for: GTM noscript fallback, critical third-party embeds.',
  },
  script_body_end: {
    label: 'Body End Scripts',
    placeholder: '<!-- Chat widget, Intercom, etc. -->\n<script>\n  // Your chat widget or tracking code\n</script>',
    hint: 'Scripts placed before </body>. Best for: Chat widgets (Intercom, Crisp), Hotjar, deferred analytics.',
  },
};

export function ScriptsEditor({ scripts: initialScripts }: ScriptsEditorProps) {
  const [scripts, setScripts] = useState<ScriptSetting[]>(initialScripts);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, 'success' | 'error' | null>>({});
  const [isPending, startTransition] = useTransition();

  const handleChange = (key: string, value: string) => {
    setScripts(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    // Clear status when editing
    setStatus(prev => ({ ...prev, [key]: null }));
  };

  const handleSave = async (key: string) => {
    const script = scripts.find(s => s.key === key);
    if (!script) return;

    setSaving(prev => ({ ...prev, [key]: true }));
    setStatus(prev => ({ ...prev, [key]: null }));

    try {
      const res = await fetch(`/api/admin/scripts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: script.value }),
      });

      if (!res.ok) throw new Error('Failed to save');

      startTransition(() => {
        setStatus(prev => ({ ...prev, [key]: 'success' }));
        // Update the updatedAt
        setScripts(prev => prev.map(s =>
          s.key === key ? { ...s, updatedAt: new Date().toISOString() } : s
        ));
      });

      // Clear success status after 3s
      setTimeout(() => {
        setStatus(prev => ({ ...prev, [key]: null }));
      }, 3000);
    } catch {
      setStatus(prev => ({ ...prev, [key]: 'error' }));
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium">Script Injection</p>
            <p className="mt-1 text-blue-300/80">
              Add analytics, tracking pixels, chat widgets, and other third-party scripts.
              Scripts are injected directly into the page HTML. Be careful with untrusted code.
            </p>
          </div>
        </div>
      </div>

      {scripts.map((script) => {
        const config = SCRIPT_LABELS[script.key] || {
          label: script.key,
          placeholder: '',
          hint: script.description
        };
        const isSaving = saving[script.key];
        const scriptStatus = status[script.key];

        return (
          <div
            key={script.key}
            className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3 bg-zinc-800/80">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-white">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {scriptStatus === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                {scriptStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Error saving
                  </span>
                )}
                <button
                  onClick={() => handleSave(script.key)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-2 text-xs text-zinc-400">{config.hint}</p>
              <textarea
                value={script.value}
                onChange={(e) => handleChange(script.key, e.target.value)}
                placeholder={config.placeholder}
                rows={8}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                spellCheck={false}
              />
              {script.updatedAt && (
                <p className="mt-2 text-xs text-zinc-500">
                  Last updated: {new Date(script.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
