import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  vector,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// USERS
// ============================================
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("free").notNull(), // free, active, past_due, canceled
  subscriptionPlan: text("subscription_plan").default("free").notNull(), // free, pro
  aiUsageCount: integer("ai_usage_count").default(0).notNull(),
  aiUsageResetAt: timestamp("ai_usage_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// PROJECTS
// ============================================
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("active").notNull(), // active, archived, completed
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
  ]
);

// ============================================
// BOARD COLUMNS (per project)
// ============================================
export const boardColumns = pgTable(
  "board_columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").default(0).notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("board_columns_project_idx").on(table.projectId, table.position),
  ]
);

// ============================================
// TASKS
// ============================================
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => boardColumns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
    dueDate: timestamp("due_date", { withTimezone: true }),
    assignee: text("assignee"), // user ID or name
    labels: jsonb("labels").default([]), // string[]
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tasks_project_idx").on(table.projectId),
    index("tasks_column_idx").on(table.columnId, table.position),
    index("tasks_user_idx").on(table.userId),
  ]
);

// ============================================
// IDEAS
// ============================================
export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body"),
    status: text("status").default("new").notNull(), // new, exploring, in_progress, done, archived
    pinned: boolean("pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ideas_user_id_created_idx").on(table.userId, table.createdAt),
    index("ideas_project_id_idx").on(table.projectId),
  ]
);

// ============================================
// FOLDERS (for notes)
// ============================================
export const folders = pgTable(
  "folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("folders_user_id_idx").on(table.userId),
  ]
);

// ============================================
// NOTES
// ============================================
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    folderId: uuid("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: text("content"),
    contentPlain: text("content_plain"),
    pinned: boolean("pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notes_user_id_created_idx").on(table.userId, table.createdAt),
    index("notes_project_id_idx").on(table.projectId),
    index("notes_folder_id_idx").on(table.folderId),
  ]
);

// ============================================
// SCRIPTS
// ============================================
export const scripts = pgTable(
  "scripts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    ideaId: uuid("idea_id").references(() => ideas.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: text("content"), // HTML from Tiptap
    contentPlain: text("content_plain"),
    status: text("status").default("draft").notNull(), // draft, editing, ready, published
    wordCount: integer("word_count").default(0).notNull(),
    pinned: boolean("pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("scripts_user_id_created_idx").on(table.userId, table.createdAt),
    index("scripts_project_id_idx").on(table.projectId),
    index("scripts_idea_id_idx").on(table.ideaId),
  ]
);

// ============================================
// FILES
// ============================================
export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storagePath: text("storage_path").notNull(),
    storageUrl: text("storage_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("files_user_id_created_idx").on(table.userId, table.createdAt),
    index("files_project_id_idx").on(table.projectId),
  ]
);

// ============================================
// TAGS
// ============================================
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
  },
  (table) => [
    uniqueIndex("tags_user_name_idx").on(table.userId, table.name),
  ]
);

// ============================================
// ITEM TAGS (polymorphic junction)
// ============================================
export const itemTags = pgTable(
  "item_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull(),
    itemType: text("item_type").notNull(), // 'idea', 'note', 'script', 'file'
  },
  (table) => [
    uniqueIndex("item_tags_unique_idx").on(table.tagId, table.itemId, table.itemType),
    index("item_tags_item_idx").on(table.itemId, table.itemType),
    index("item_tags_tag_id_idx").on(table.tagId),
  ]
);

// ============================================
// CONTENT EMBEDDINGS (for AI retrieval)
// ============================================
export const contentEmbeddings = pgTable(
  "content_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull(),
    itemType: text("item_type").notNull(), // 'idea', 'note', 'script', 'file'
    chunkIndex: integer("chunk_index").default(0).notNull(),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("embeddings_user_id_idx").on(table.userId),
    index("embeddings_item_idx").on(table.itemId, table.itemType),
  ]
);

// ============================================
// CHAT SESSIONS
// ============================================
export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_sessions_user_id_idx").on(table.userId),
  ]
);

// ============================================
// CHAT MESSAGES
// ============================================
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user', 'assistant'
    content: text("content").notNull(),
    citations: jsonb("citations"), // [{itemId, itemType, chunkText, title}]
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_session_idx").on(table.sessionId, table.createdAt),
  ]
);

// ============================================
// CANVAS (per project)
// ============================================
export const canvases = pgTable(
  "canvases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" })
      .unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nodes: jsonb("nodes").default([]).notNull(), // React Flow nodes
    edges: jsonb("edges").default([]).notNull(), // React Flow edges
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("canvases_project_id_idx").on(table.projectId),
  ]
);

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  ideas: many(ideas),
  notes: many(notes),
  scripts: many(scripts),
  files: many(files),
  tags: many(tags),
  tasks: many(tasks),
  chatSessions: many(chatSessions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  ideas: many(ideas),
  notes: many(notes),
  scripts: many(scripts),
  files: many(files),
  columns: many(boardColumns),
  tasks: many(tasks),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
  project: one(projects, { fields: [boardColumns.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  column: one(boardColumns, { fields: [tasks.columnId], references: [boardColumns.id] }),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  user: one(users, { fields: [ideas.userId], references: [users.id] }),
  project: one(projects, { fields: [ideas.projectId], references: [projects.id] }),
  scripts: many(scripts),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  project: one(projects, { fields: [notes.projectId], references: [projects.id] }),
  folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
}));

export const scriptsRelations = relations(scripts, ({ one }) => ({
  user: one(users, { fields: [scripts.userId], references: [users.id] }),
  project: one(projects, { fields: [scripts.projectId], references: [projects.id] }),
  idea: one(ideas, { fields: [scripts.ideaId], references: [ideas.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  project: one(projects, { fields: [files.projectId], references: [projects.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  tag: one(tags, { fields: [itemTags.tagId], references: [tags.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));
