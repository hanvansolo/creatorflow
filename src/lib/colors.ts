// Consistent color coding — bold, vivid, saturated
export const contentColors = {
  idea: {
    text: "text-[#FFD60A]",
    bg: "bg-[#FFD60A]/15",
    border: "border-[#FFD60A]/30",
    icon: "text-[#FFD60A]",
    link: "text-[#FFD60A] decoration-[#FFD60A]/40 hover:decoration-[#FFD60A]/80",
  },
  note: {
    text: "text-[#30BCED]",
    bg: "bg-[#30BCED]/15",
    border: "border-[#30BCED]/30",
    icon: "text-[#30BCED]",
    link: "text-[#30BCED] decoration-[#30BCED]/40 hover:decoration-[#30BCED]/80",
  },
  script: {
    text: "text-[#2EC4B6]",
    bg: "bg-[#2EC4B6]/15",
    border: "border-[#2EC4B6]/30",
    icon: "text-[#2EC4B6]",
    link: "text-[#2EC4B6] decoration-[#2EC4B6]/40 hover:decoration-[#2EC4B6]/80",
  },
  project: {
    text: "text-[#9B5DE5]",
    bg: "bg-[#9B5DE5]/15",
    border: "border-[#9B5DE5]/30",
    icon: "text-[#9B5DE5]",
    link: "text-[#9B5DE5] decoration-[#9B5DE5]/40 hover:decoration-[#9B5DE5]/80",
  },
  file: {
    text: "text-[#FF6B35]",
    bg: "bg-[#FF6B35]/15",
    border: "border-[#FF6B35]/30",
    icon: "text-[#FF6B35]",
    link: "text-[#FF6B35] decoration-[#FF6B35]/40 hover:decoration-[#FF6B35]/80",
  },
  chat: {
    text: "text-[#F72585]",
    bg: "bg-[#F72585]/15",
    border: "border-[#F72585]/30",
    icon: "text-[#F72585]",
    link: "text-[#F72585] decoration-[#F72585]/40 hover:decoration-[#F72585]/80",
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
