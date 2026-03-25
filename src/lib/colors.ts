// Consistent color coding across the app
export const contentColors = {
  idea: {
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-500",
    link: "text-amber-600 dark:text-amber-400 decoration-amber-500/30 hover:decoration-amber-500/60",
  },
  note: {
    text: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-500",
    link: "text-blue-600 dark:text-blue-400 decoration-blue-500/30 hover:decoration-blue-500/60",
  },
  script: {
    text: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
    link: "text-emerald-600 dark:text-emerald-400 decoration-emerald-500/30 hover:decoration-emerald-500/60",
  },
  project: {
    text: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "text-purple-500",
    link: "text-purple-600 dark:text-purple-400 decoration-purple-500/30 hover:decoration-purple-500/60",
  },
  file: {
    text: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: "text-orange-500",
    link: "text-orange-600 dark:text-orange-400 decoration-orange-500/30 hover:decoration-orange-500/60",
  },
  chat: {
    text: "text-pink-500 dark:text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    icon: "text-pink-500",
    link: "text-pink-600 dark:text-pink-400 decoration-pink-500/30 hover:decoration-pink-500/60",
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
