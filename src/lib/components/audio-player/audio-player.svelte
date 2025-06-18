<script lang="ts">
	import type { FileUIPart } from 'ai';

	import IconDownload from '~icons/tabler/download';
	import IconPlayerPause from '~icons/tabler/player-pause';
	import IconPlayerPlay from '~icons/tabler/player-play';
	import IconSparkles from '~icons/tabler/sparkles';
	import IconVolume from '~icons/tabler/volume';
	import IconVolumeOff from '~icons/tabler/volume-off';

	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { useDownload } from '$lib/hooks/use-download.svelte';
	import type { Message } from '$lib/messages';
	import { formatTime } from '$lib/utils/time';
	import { cn } from '$lib/utils/ui';

	type AudioVariant = 'chat' | 'gallery' | 'list' | 'file';

	interface FileData {
		url: string;
		name?: string;
		isCreation?: boolean;
	}

	interface Props {
		file: FileData | FileUIPart;
		variant?: AudioVariant;
		class?: string;
		message?: Message;
		title?: string;
		creationType?: string;
		modelName?: string;
		timeAgoDisplay?: string;
		formattedSize?: string;
	}

	let {
		file,
		variant = 'chat',
		class: className,
		message,
		title,
		creationType,
		modelName,
		timeAgoDisplay,
		formattedSize
	}: Props = $props();

	const { downloadAttachedFile, isDownloaded } = useDownload();

	let audio: HTMLAudioElement;
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(0.8);
	let isMuted = $state(false);
	let isLoading = $state(false);
	let isSeeking = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined' && audio) {
			if (audio.readyState === 4) {
				const currentSrc = audio.src;
				audio.src = '';
				audio.load();
				setTimeout(() => {
					audio.src = currentSrc;
					audio.load();
				}, 50);
			}
		}
	});

	let progress = $derived((duration > 0 ? currentTime / duration : 0) * 100);

	async function togglePlay(event?: MouseEvent) {
		if (event) {
			event.stopPropagation();
		}
		if (!audio || !file?.url) return;

		if (isPlaying) {
			audio.pause();
		} else {
			try {
				isLoading = true;
				await audio.play();
			} catch (error) {
				console.error('Failed to play audio:', error);
			} finally {
				isLoading = false;
			}
		}
	}

	async function handleProgressClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!audio || !duration || !file?.url) return;

		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickProgress = Math.max(0, Math.min(1, clickX / rect.width));
		const newTime = clickProgress * duration;

		if (variant === 'chat') {
			audio.currentTime = Math.max(0, Math.min(duration, newTime));
		} else {
			try {
				isSeeking = true;
				const wasPlaying = !audio.paused;

				if (wasPlaying) {
					audio.pause();
				}

				audio.currentTime = newTime;

				if (wasPlaying) {
					audio.play();
				}
			} catch (error) {
				console.error('Failed to seek:', error);
				isSeeking = false;
			}
		}
	}

	function toggleMute() {
		if (!audio) return;
		isMuted = !isMuted;
	}

	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseFloat(target.value);
		if (isMuted && volume > 0) {
			isMuted = false;
		}
	}

	function handleProgressKeydown(e: KeyboardEvent) {
		if (!audio || !duration || !file?.url) return;

		const currentProgress = (audio.currentTime / duration) * 100;
		let newProgress = currentProgress;

		switch (e.key) {
			case 'ArrowLeft':
			case 'ArrowDown':
				e.preventDefault();
				newProgress = Math.max(0, currentProgress - 5);
				break;
			case 'ArrowRight':
			case 'ArrowUp':
				e.preventDefault();
				newProgress = Math.min(100, currentProgress + 5);
				break;
			case 'Home':
				e.preventDefault();
				newProgress = 0;
				break;
			case 'End':
				e.preventDefault();
				newProgress = 100;
				break;
			default:
				return;
		}

		const newTime = (newProgress / 100) * duration;
		audio.currentTime = Math.max(0, Math.min(duration, newTime));
	}

	let fileName = $derived(
		title ||
			(file && 'name' in file && file.name) ||
			(file && 'filename' in file && file.filename) ||
			'Audio file'
	);

	let isCreation = $derived(file && 'isCreation' in file ? file.isCreation : false);
</script>

<audio
	bind:this={audio}
	src={file?.url || ''}
	crossorigin="anonymous"
	bind:volume
	bind:muted={isMuted}
	ontimeupdate={() => {
		if (!isSeeking || variant === 'chat') {
			currentTime = audio?.currentTime || 0;
		}
	}}
	onseeked={() => {
		currentTime = audio?.currentTime || 0;
		isSeeking = false;
	}}
	ondurationchange={() => (duration = audio?.duration || 0)}
	onplay={() => (isPlaying = true)}
	onpause={() => (isPlaying = false)}
	onended={() => (isPlaying = false)}
	onloadstart={() => (isLoading = true)}
	oncanplay={() => (isLoading = false)}
	preload={variant === 'chat' ? 'metadata' : 'auto'}
	aria-label={variant === 'chat' && file && 'filename' in file && file.filename
		? `Audio: ${file.filename}`
		: title
			? `Audio creation: ${title}`
			: `Audio file: ${fileName}`}
></audio>

{#if variant === 'gallery'}
	<div
		class={cn('flex h-full w-full flex-col items-center justify-center p-2', className)}
		role="region"
		aria-label="Audio player gallery view"
	>
		<div class="flex flex-1 items-center justify-center">
			<Button
				onclick={togglePlay}
				variant="ghost"
				size="icon"
				class="bg-background/50 size-14 rounded-full transition hover:scale-105"
				aria-label={isLoading ? 'Loading audio...' : isPlaying ? 'Pause audio' : 'Play audio'}
			>
				{#if isLoading}
					<Skeleton
						class="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent"
						aria-hidden="true"
					/>
				{:else if isPlaying}
					<IconPlayerPause class="size-6" aria-hidden="true" />
				{:else}
					<IconPlayerPlay class="size-6" aria-hidden="true" />
				{/if}
			</Button>
		</div>
		<div class="w-full">
			<div class="text-muted-foreground flex w-full items-center justify-between text-xs">
				<span aria-label="Current time">{formatTime(currentTime)}</span>
				<span aria-label="Total duration">{formatTime(duration)}</span>
			</div>
			<button
				class="bg-muted focus:ring-primary relative mt-1 h-2 w-full cursor-pointer rounded-full border-0 p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
				onclick={handleProgressClick}
				aria-label="Seek to {Math.round(progress)}% of audio duration"
				role="slider"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={Math.round(progress)}
			>
				<div
					class="bg-primary h-full rounded-full transition-all duration-150"
					style="width: {progress}%"
					aria-hidden="true"
				></div>
				<div
					class="bg-primary absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm transition-all duration-150 hover:scale-110"
					style="left: {progress}%"
					aria-hidden="true"
				></div>
			</button>
		</div>
	</div>
{:else if variant === 'list'}
	<div
		class={cn('flex w-full items-center gap-4', className)}
		role="region"
		aria-label="Audio player list view"
	>
		<Button
			onclick={togglePlay}
			variant="outline"
			size="icon"
			class="size-10 flex-shrink-0"
			aria-label={isLoading ? 'Loading audio...' : isPlaying ? 'Pause audio' : 'Play audio'}
		>
			{#if isLoading}
				<Skeleton
					class="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent"
					aria-hidden="true"
				/>
			{:else if isPlaying}
				<IconPlayerPause class="size-4" aria-hidden="true" />
			{:else}
				<IconPlayerPlay class="size-4" aria-hidden="true" />
			{/if}
		</Button>
		<div class="flex min-w-0 flex-1 items-center gap-4">
			<div class="min-w-0 flex-1">
				{#if title}
					<h3 class="truncate text-sm font-medium">{title}</h3>
					<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
						{#if creationType}
							<span>{creationType}</span>
						{/if}
						{#if creationType && modelName}
							<span class="text-muted-foreground/60">•</span>
						{/if}
						{#if modelName}
							<span>{modelName}</span>
						{/if}
					</div>
				{/if}
			</div>
			<button
				class="bg-muted focus:ring-primary relative h-2 flex-1 cursor-pointer rounded-full border-0 p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
				onclick={handleProgressClick}
				aria-label="Seek to {Math.round(progress)}% of audio duration"
				role="slider"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={Math.round(progress)}
			>
				<div
					class="bg-primary h-full rounded-full transition-all duration-150"
					style="width: {progress}%"
					aria-hidden="true"
				></div>
				<div
					class="bg-primary absolute top-1/2 size-3 -translate-y-1/2 rounded-full shadow-sm transition-all duration-150 hover:scale-110"
					style="left: calc({progress}% - 6px)"
					aria-hidden="true"
				></div>
			</button>
			<div class="text-muted-foreground flex flex-shrink-0 items-center gap-1 text-xs">
				<span>{formatTime(currentTime)}</span>
				<span>/</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>
	</div>
{:else if variant === 'file'}
	<div
		class={cn('flex w-full items-center gap-3 sm:gap-4', className)}
		role="region"
		aria-label="Audio file player"
	>
		<div class="bg-muted/50 flex size-10 flex-shrink-0 items-center justify-center rounded">
			<Button
				onclick={togglePlay}
				variant="ghost"
				size="icon"
				class="size-8"
				aria-label={isLoading ? 'Loading audio...' : isPlaying ? 'Pause audio' : 'Play audio'}
			>
				{#if isLoading}
					<Skeleton
						class="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent"
						aria-hidden="true"
					/>
				{:else if isPlaying}
					<IconPlayerPause class="size-4" aria-hidden="true" />
				{:else}
					<IconPlayerPlay class="size-4" aria-hidden="true" />
				{/if}
			</Button>
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="truncate text-sm font-medium">{fileName}</h3>
				{#if isCreation}
					<IconSparkles
						class="size-4 flex-shrink-0 text-amber-500"
						aria-label="AI-generated audio"
					/>
				{/if}
			</div>

			<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
				{#if formattedSize}
					<span>{formattedSize}</span>
					<span class="text-muted-foreground/60">•</span>
				{/if}
				{#if timeAgoDisplay}
					<span>{timeAgoDisplay}</span>
					<span class="text-muted-foreground/60">•</span>
				{/if}
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<button
						class="bg-muted focus:ring-primary relative h-2 min-w-20 flex-1 cursor-pointer rounded-full border-0 p-0 focus:ring-1 focus:ring-offset-1 focus:outline-none"
						onclick={handleProgressClick}
						aria-label="Seek to {Math.round(progress)}% of audio duration"
						role="slider"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={Math.round(progress)}
					>
						<div
							class="bg-primary h-full rounded-full transition-all duration-150"
							style="width: {progress}%"
							aria-hidden="true"
						></div>
						<div
							class="bg-primary absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm transition-all duration-150 hover:scale-110"
							style="left: {progress}%"
							aria-hidden="true"
						></div>
					</button>
					<span
						class="text-muted-foreground/80 text-xs whitespace-nowrap tabular-nums"
						aria-label="Current time {formatTime(currentTime)} of {formatTime(duration)}"
					>
						{formatTime(currentTime)}/{formatTime(duration)}
					</span>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Chat variant (default) -->
	<div
		class={cn(
			'bg-background border-border mt-3 flex w-full max-w-lg items-center gap-3 rounded-lg border p-3 shadow-sm',
			className
		)}
		role="region"
		aria-label={file && 'filename' in file && file.filename
			? `Audio player for ${file.filename}`
			: 'Audio player'}
	>
		<Button
			onclick={togglePlay}
			variant="outline"
			size="icon"
			class="size-10 shrink-0"
			disabled={isLoading}
			aria-label={isLoading ? 'Loading audio...' : isPlaying ? 'Pause audio' : 'Play audio'}
		>
			{#if isLoading}
				<div
					class="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent"
					aria-hidden="true"
				></div>
			{:else if isPlaying}
				<IconPlayerPause class="size-4" aria-hidden="true" />
			{:else}
				<IconPlayerPlay class="size-4" aria-hidden="true" />
			{/if}
		</Button>

		<div class="flex min-w-0 flex-1 flex-col gap-2">
			{#if file && 'filename' in file && file.filename}
				<h3 class="text-foreground truncate text-sm font-medium">{file.filename}</h3>
			{/if}

			<div class="flex items-center gap-3">
				<span class="text-muted-foreground text-xs tabular-nums" aria-label="Current time">
					{formatTime(currentTime)}
				</span>

				<button
					class="bg-muted focus:ring-primary relative h-2 flex-1 cursor-pointer rounded-full border-0 p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={handleProgressClick}
					onkeydown={handleProgressKeydown}
					aria-label="Audio progress slider. Use arrow keys to seek, Home for start, End for end. Current position: {Math.round(
						progress
					)}%"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={Math.round(progress)}
					aria-valuetext="{formatTime(currentTime)} of {formatTime(duration)}"
					role="slider"
					tabindex="0"
				>
					<div
						class="bg-primary h-full rounded-full transition-all duration-150"
						style="width: {progress}%"
						aria-hidden="true"
					></div>
					<div
						class="bg-primary absolute top-1/2 size-3 -translate-y-1/2 rounded-full shadow-sm transition-all duration-150 hover:scale-110"
						style="left: calc({progress}% - 6px)"
						aria-hidden="true"
					></div>
				</button>

				<span class="text-muted-foreground text-xs tabular-nums" aria-label="Total duration">
					{formatTime(duration)}
				</span>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-1" role="group" aria-label="Volume controls">
			<Button
				onclick={toggleMute}
				variant="ghost"
				size="icon"
				class="size-8"
				aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
			>
				{#if isMuted}
					<IconVolumeOff class="size-4" aria-hidden="true" />
				{:else}
					<IconVolume class="size-4" aria-hidden="true" />
				{/if}
			</Button>

			<input
				type="range"
				min="0"
				max="1"
				step="0.1"
				value={volume}
				oninput={handleVolumeChange}
				class="accent-primary bg-muted h-1 w-16 cursor-pointer appearance-none rounded-full"
				aria-label="Volume level: {Math.round(volume * 100)}%"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={Math.round(volume * 100)}
			/>
		</div>

		{#if message}
			<Button
				onclick={() => downloadAttachedFile(message)}
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				disabled={isDownloaded(message.id)}
				aria-label={isDownloaded(message.id)
					? 'Audio file downloaded'
					: `Download ${file && 'filename' in file && file.filename ? file.filename : 'audio file'}`}
			>
				<IconDownload class="size-4" aria-hidden="true" />
			</Button>
		{/if}
	</div>
{/if}
