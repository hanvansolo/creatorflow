import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ideas, notes, scripts, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type GraphNode = {
  id: string;
  type: "idea" | "note" | "script" | "project";
  title: string;
  pinned?: boolean;
  status?: string;
};

type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ nodes: [], edges: [] }, { status: 401 });

  // Fetch all content
  const [allIdeas, allNotes, allScripts, allProjects] = await Promise.all([
    db.query.ideas.findMany({ where: eq(ideas.userId, userId) }),
    db.query.notes.findMany({ where: eq(notes.userId, userId) }),
    db.query.scripts.findMany({ where: eq(scripts.userId, userId) }),
    db.query.projects.findMany({ where: eq(projects.userId, userId) }),
  ]);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add project nodes
  for (const p of allProjects) {
    nodes.push({ id: p.id, type: "project", title: p.title, status: p.status });
  }

  // Add idea nodes + edges
  for (const idea of allIdeas) {
    nodes.push({ id: idea.id, type: "idea", title: idea.title, pinned: idea.pinned, status: idea.status });
    if (idea.projectId) {
      edges.push({ source: idea.id, target: idea.projectId, label: "spawned" });
    }
  }

  // Add note nodes + edges
  for (const note of allNotes) {
    nodes.push({ id: note.id, type: "note", title: note.title });
    if (note.projectId) {
      edges.push({ source: note.id, target: note.projectId, label: "belongs to" });
    }
    // Parse content for internal links
    if (note.content) {
      const linkRegex = /\/(ideas|notes|scripts)\/([a-f0-9-]+)/g;
      let match;
      while ((match = linkRegex.exec(note.content)) !== null) {
        const targetId = match[2];
        if (targetId !== note.id) {
          edges.push({ source: note.id, target: targetId, label: "links to" });
        }
      }
    }
  }

  // Add script nodes + edges
  for (const script of allScripts) {
    nodes.push({ id: script.id, type: "script", title: script.title, status: script.status });
    if (script.projectId) {
      edges.push({ source: script.id, target: script.projectId, label: "belongs to" });
    }
    if (script.ideaId) {
      edges.push({ source: script.id, target: script.ideaId, label: "from idea" });
    }
    // Parse content for internal links
    if (script.content) {
      const linkRegex = /\/(ideas|notes|scripts)\/([a-f0-9-]+)/g;
      let match;
      while ((match = linkRegex.exec(script.content)) !== null) {
        const targetId = match[2];
        if (targetId !== script.id) {
          edges.push({ source: script.id, target: targetId, label: "links to" });
        }
      }
    }
  }

  // Also check idea bodies for links
  for (const idea of allIdeas) {
    if (idea.body) {
      const linkRegex = /\/(ideas|notes|scripts)\/([a-f0-9-]+)/g;
      let match;
      while ((match = linkRegex.exec(idea.body)) !== null) {
        const targetId = match[2];
        if (targetId !== idea.id) {
          edges.push({ source: idea.id, target: targetId, label: "links to" });
        }
      }
    }
  }

  // Deduplicate edges
  const edgeSet = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const key = `${e.source}-${e.target}`;
    const reverseKey = `${e.target}-${e.source}`;
    if (edgeSet.has(key) || edgeSet.has(reverseKey)) return false;
    edgeSet.add(key);
    return true;
  });

  // Only include edges where both nodes exist
  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges = uniqueEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return Response.json({ nodes, edges: validEdges });
}
