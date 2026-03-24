import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(100000).optional(),
  contentPlain: z.string().max(100000).optional(),
  projectId: z.string().uuid().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
