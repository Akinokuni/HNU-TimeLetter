# Remotion Guide

Use this reference when building or editing Remotion compositions and you need concrete rules or snippets.

Official docs: https://www.remotion.dev/docs/

## Composition Defaults

- The root entry is commonly `src/Root.tsx`.
- Register videos through `<Composition />`.
- Default values when a project does not already dictate otherwise:
  - `id="MyComp"`
  - `fps={30}`
  - `width={1920}`
  - `height={1080}`
- Keep `defaultProps` aligned with the React component props shape.

Example:

```tsx
import {Composition} from 'remotion';
import {MyComp} from './MyComp';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="MyComp"
				component={MyComp}
				durationInFrames={120}
				width={1920}
				height={1080}
				fps={30}
				defaultProps={{}}
			/>
		</>
	);
};
```

## Core Hooks And Helpers

- `useCurrentFrame()` returns the current frame, starting at `0`.
- `useVideoConfig()` exposes `fps`, `durationInFrames`, `width`, and `height`.
- `interpolate()` maps frame ranges to output ranges. Clamp both ends by default.
- `spring()` is the preferred helper for physically eased motion.
- `random(seed)` is allowed. `Math.random()` is not, because Remotion rendering must stay deterministic.

Examples:

```tsx
import {interpolate, useCurrentFrame} from 'remotion';

export const FadeIn: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return <div style={{opacity}}>Hello</div>;
};
```

```tsx
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const PopIn: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const scale = spring({
		fps,
		frame,
		config: {damping: 200},
	});

	return <div style={{transform: `scale(${scale})`}}>Hello</div>;
};
```

## Media And Layering Rules

- Use `OffthreadVideo` for video.
- Use `Audio` for sound.
- Use `Img` for non-animated images.
- Use `Gif` from `@remotion/gif` for animated GIFs.
- Use `staticFile()` for assets stored under `public/`.
- Use `AbsoluteFill` to layer elements on top of each other.

Examples:

```tsx
import {AbsoluteFill, Audio, Img, OffthreadVideo, staticFile} from 'remotion';

export const MediaStack: React.FC = () => {
	return (
		<AbsoluteFill>
			<OffthreadVideo src={staticFile('bg.mp4')} style={{width: '100%'}} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<Img src={staticFile('logo.png')} style={{width: 420}} />
			</AbsoluteFill>
			<Audio src={staticFile('music.mp3')} volume={0.45} />
		</AbsoluteFill>
	);
};
```

Trim media with these props:

- `startFrom`: skip frames from the beginning.
- `endAt`: stop playback at a specific frame.
- `volume`: set audio level from `0` to `1`.

## Sequencing And Transitions

- Use `Sequence` to offset a block in time with `from` and `durationInFrames`.
- Use `Series` for back-to-back sections.
- Use `TransitionSeries` from `@remotion/transitions` when sections need transitions.
- A child inside `Sequence` sees its own local frame starting at `0`.

Examples:

```tsx
import {Sequence} from 'remotion';

export const TimedBlock: React.FC = () => {
	return (
		<Sequence from={30} durationInFrames={45}>
			<div>Appears after frame 30</div>
		</Sequence>
	);
};
```

```tsx
import {Series} from 'remotion';

export const Chapters: React.FC = () => {
	return (
		<Series>
			<Series.Sequence durationInFrames={40}>
				<div>Intro</div>
			</Series.Sequence>
			<Series.Sequence durationInFrames={50}>
				<div>Middle</div>
			</Series.Sequence>
		</Series>
	);
};
```

```tsx
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';

export const Scenes: React.FC = () => {
	return (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={60}>
				<div>Scene A</div>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition
				timing={springTiming({config: {damping: 200}})}
				presentation={fade()}
			/>
			<TransitionSeries.Sequence durationInFrames={60}>
				<div>Scene B</div>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition
				timing={linearTiming({durationInFrames: 30})}
				presentation={wipe()}
			/>
			<TransitionSeries.Sequence durationInFrames={60}>
				<div>Scene C</div>
			</TransitionSeries.Sequence>
		</TransitionSeries>
	);
};
```

## Remotion Is Not Interactive React

Remotion components are rendered frame-by-frame into media output, so they behave differently from app UI components.

- Do not rely on clicks, hover state, forms, or other interaction handlers.
- Avoid `useState()` or `useEffect()` for interactive or time-based behavior.
- Keep logic pure and derived from frame number plus props.
- Pass all required values through composition props ahead of render time.

Example translation:

```tsx
import {interpolate, useCurrentFrame} from 'remotion';

export const AnimatedButton: React.FC = () => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [0, 30], [1, 1.2], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				transform: `scale(${scale})`,
				background: 'blue',
				padding: '10px 20px',
				display: 'inline-block',
			}}
		>
			Click me!
		</div>
	);
};
```
