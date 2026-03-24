import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["active", "archived", "completed"]).default("active"),
  color: z.string().max(20).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
