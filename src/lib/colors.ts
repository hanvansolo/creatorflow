// Consistent color coding across the app — vivid, no pastels
export const contentColors = {
  idea: {
    text: "text-yellow-400",
    bg: "bg-yellow-400/15",
    border: "border-yellow-400/30",
    icon: "text-yellow-400",
    link: "text-yellow-500 dark:text-yellow-400 decoration-yellow-400/40 hover:decoration-yellow-400/80",
  },
  note: {
    text: "text-cyan-400",
    bg: "bg-cyan-400/15",
    border: "border-cyan-400/30",
    icon: "text-cyan-400",
    link: "text-cyan-500 dark:text-cyan-400 decoration-cyan-400/40 hover:decoration-cyan-400/80",
  },
  script: {
    text: "text-green-400",
    bg: "bg-green-400/15",
    border: "border-green-400/30",
    icon: "text-green-400",
    link: "text-green-500 dark:text-green-400 decoration-green-400/40 hover:decoration-green-400/80",
  },
  project: {
    text: "text-violet-400",
    bg: "bg-violet-400/15",
    border: "border-violet-400/30",
    icon: "text-violet-400",
    link: "text-violet-500 dark:text-violet-400 decoration-violet-400/40 hover:decoration-violet-400/80",
  },
  file: {
    text: "text-orange-400",
    bg: "bg-orange-400/15",
    border: "border-orange-400/30",
    icon: "text-orange-400",
    link: "text-orange-500 dark:text-orange-400 decoration-orange-400/40 hover:decoration-orange-400/80",
  },
  chat: {
    text: "text-rose-400",
    bg: "bg-rose-400/15",
    border: "border-rose-400/30",
    icon: "text-rose-400",
    link: "text-rose-500 dark:text-rose-400 decoration-rose-400/40 hover:decoration-rose-400/80",
  },
} as const;

// Detect content type from a URL path
export function getContentTypeFromUrl(url: string): keyof typeof contentColors | null {
  if (url.startsWith("/ideas")) return "idea";
  if (url.startsWith("/notes")) return "note";
  if (url.startsWith("/scripts")) return "script";
  if (url.startsWith("/projects")) return "project";
  if (url.startsWith("/library")) return "file";
  if (url.startsWith("/chat")) return "chat";
  return null;
}
