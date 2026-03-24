import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().max(10000).optional(),
  status: z.enum(["new", "exploring", "in_progress", "done", "archived"]).default("new"),
  projectId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateIdeaSchema = createIdeaSchema.partial();

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
