import { z } from "zod";

export const createScriptSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(200000).optional(),
  contentPlain: z.string().max(200000).optional(),
  status: z.enum(["draft", "editing", "ready", "published"]).default("draft"),
  projectId: z.string().uuid().optional().nullable(),
  ideaId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateScriptSchema = createScriptSchema.partial();

export type CreateScriptInput = z.infer<typeof createScriptSchema>;
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
