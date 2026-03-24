import type {
  users,
  projects,
  ideas,
  notes,
  scripts,
  files,
  folders,
  tags,
  chatSessions,
  chatMessages,
  contentEmbeddings,
  itemTags,
} from "@/lib/db/schema";

// Infer types from Drizzle schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type ItemTag = typeof itemTags.$inferSelect;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;

// Shared types
export type ItemType = "idea" | "note" | "script" | "file";

export type IdeaStatus = "new" | "exploring" | "in_progress" | "done" | "archived";
export type ScriptStatus = "draft" | "editing" | "ready" | "published";
export type ProjectStatus = "active" | "archived" | "completed";
export type SubscriptionStatus = "free" | "active" | "past_due" | "canceled";
export type SubscriptionPlan = "free" | "pro";
