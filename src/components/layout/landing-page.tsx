"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Lightbulb,
  Sparkles,
  FolderKanban,
  Rocket,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: Lightbulb,
    color: "#FFD60A",
    title: "Think",
    description: "Capture every spark. Ideas, hunches, shower thoughts — pin the ones that matter.",
  },
  {
    icon: Sparkles,
    color: "#F72585",
    title: "Shape",
    description: "AI co-pilot helps you research, plan, and break ideas into actionable pieces.",
  },
  {
    icon: FolderKanban,
    color: "#9B5DE5",
    title: "Build",
    description: "Kanban boards, tasks, deadlines. Move cards from backlog to done.",
  },
  {
    icon: Rocket,
    color: "#2EC4B6",
    title: "Ship",
    description: "Launch it. Publish it. Deliver it. Thoughts become things.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#9B5DE5] to-[#F72585]">
            <Rocket className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-semibold">JottrPad</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-[#F72585]" />
            Think → Shape → Build → Ship
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Where{" "}
            <span className="bg-gradient-to-r from-[#9B5DE5] to-[#F72585] bg-clip-text text-transparent">
              thoughts become things
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Capture ideas, shape them with AI, build with kanban boards, and ship.
            The only tool that takes you from spark to launch.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* The Journey */}
        <section className="border-t bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold">
              From thought to shipped
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Four steps. One workspace. No friction.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.title} className="relative space-y-3">
                  {i < steps.length - 1 && (
                    <div className="absolute top-5 left-[calc(50%+24px)] hidden h-px w-[calc(100%-48px)] bg-border lg:block" />
                  )}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <step.icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>JottrPad</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
