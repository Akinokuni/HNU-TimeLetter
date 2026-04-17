---
name: remotion
description: Build, edit, and troubleshoot Remotion video projects and compositions. Use when Codex needs to create or refine React-based motion graphics, timed scenes, transitions, audio or video layering, still renders, or frame-driven animation inside a Remotion app.
---

# Remotion

Use this skill when working in a Remotion project or when scaffolding one for a user.

## Workflow

1. Identify the composition entrypoint first.
   In most projects this is `src/Root.tsx`, where `<Composition>` components are registered with `id`, `component`, `durationInFrames`, `width`, `height`, `fps`, and `defaultProps`.
2. Keep rendering deterministic.
   Drive motion from `useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, `spring()`, `Sequence`, `Series`, `TransitionSeries`, and `random(seed)`. Never use `Math.random()` and avoid interaction-driven state or event handlers.
3. Prefer Remotion primitives over generic web patterns.
   Use `AbsoluteFill` for layering, `OffthreadVideo` for video, `Audio` for sound, `Img` for still images, and `staticFile()` for assets under `public/`.
4. Default to Remotion-friendly composition settings unless the project already defines them.
   Prefer `1920x1080`, `30fps`, a default composition id of `MyComp`, and clamp interpolations on both sides unless there is a clear reason not to.
5. Open [references/remotion-guide.md](references/remotion-guide.md) when you need concrete API patterns, component rules, sequencing examples, or reminders about what differs from interactive React.

## Implementation Checklist

- Register or update the target `<Composition>` before editing child components.
- Keep `defaultProps` aligned with the component props shape.
- Use `Sequence`, `Series`, or `TransitionSeries` instead of manually faking timing with conditionals alone.
- Use pure calculations based on frame number instead of `useEffect()`, async fetching, or browser interaction patterns.
- Reach for `AbsoluteFill` before introducing complicated layout wrappers when elements need to stack.

## Validation

- Verify the project has the Remotion packages required by the components you use, especially optional packages like `@remotion/transitions` or `@remotion/gif`.
- Render a still first when the user wants quick visual confirmation; render the full composition once timing and assets look correct.
- If rendering fails, check composition id mismatches, asset paths, frame counts, and package imports before changing animation logic.
