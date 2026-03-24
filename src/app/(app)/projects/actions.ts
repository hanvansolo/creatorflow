"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/projects";
import * as projectsService from "@/lib/services/projects";

export async function createProjectAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    status: (formData.get("status") as string) || "active",
    color: (formData.get("color") as string) || undefined,
  };

  const validated = createProjectSchema.parse(raw);
  await projectsService.createProject(userId, validated);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function updateProjectAction(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    status: (formData.get("status") as string) || undefined,
    color: (formData.get("color") as string) || undefined,
  };

  const validated = updateProjectSchema.parse(raw);
  await projectsService.updateProject(userId, id, validated);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
}

export async function deleteProjectAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await projectsService.deleteProject(userId, id);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}
