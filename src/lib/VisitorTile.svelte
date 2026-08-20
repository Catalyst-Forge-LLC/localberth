<script lang="ts">
	import { copyText } from '$lib/copy-text';
	import { OPEN_TARGET, visitorTileIcons, visitorTileLetter, VISITOR_FAVICON_FILES } from '$lib/dashboard-url';

	let {
		name,
		port,
		href,
		title = null,
		icon = null,
		here = false
	}: {
		name: string;
		port: number;
		href: string | null;
		title?: string | null;
		icon?: string | null;
		here?: boolean;
	} = $props();

	const letter = $derived(visitorTileLetter(name));
	const heading = $derived(title?.trim() || name);
	const candidates = $derived(
		here ? VISITOR_FAVICON_FILES.map((file) => `/${file}`) : href ? visitorTileIcons(href, icon) : []
	);
	let iconIndex = $state(0);
	let broken = $state(false);
	let copied = $state(false);
	let copiedTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let pressTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let held = false;

	$effect(() => {
		void candidates;
		iconIndex = 0;
		broken = false;
	});

	const favicon = $derived(!broken && iconIndex < candidates.length ? (candidates[iconIndex] ?? null) : null);

	const tileClass =
		'flex min-h-[9.5rem] flex-col overflow-hidden rounded-[10px] border bg-[var(--bg-elevated)] p-0 text-center text-[var(--text)] no-underline shadow-sm select-none [-webkit-touch-callout:none]';
	const tileTone = $derived(here ? 'border-[var(--accent)]/35' : 'border-[var(--line)]');

	function clearPress() {
		if (pressTimer) clearTimeout(pressTimer);
		pressTimer = null;
	}

	async function copyUrl() {
		if (!href) return;
		if (!(await copyText(href))) return;
		held = true;
		if (copiedTimer) clearTimeout(copiedTimer);
		copied = true;
		copiedTimer = setTimeout(() => {
			copied = false;
		}, 1200);
	}

	function onPointerDown(event: PointerEvent) {
		if (!href || here) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		held = false;
		clearPress();
		pressTimer = setTimeout(() => {
			void copyUrl();
		}, 500);
	}

	function onClick(event: MouseEvent) {
		if (!held) return;
		event.preventDefault();
		held = false;
	}

	function onContextMenu(event: MouseEvent) {
		if (!href || here) return;
		event.preventDefault();
		void copyUrl();
	}
</script>

{#snippet face()}
	<span class="flex flex-1 flex-col items-center justify-center gap-2 px-3 pt-4 pb-3">
		<span
			class="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-black/[0.06] text-lg font-semibold text-[var(--muted)]"
			aria-hidden="true"
		>
			{letter}
			{#if favicon && !broken}
				<img
					class="absolute inset-0 size-full object-contain"
					src={favicon}
					alt=""
					onerror={() => {
						if (iconIndex + 1 < candidates.length) iconIndex += 1;
						else broken = true;
					}}
				/>
			{/if}
		</span>
		<span class="w-full truncate text-sm font-medium">{copied ? 'Copied' : heading}</span>
	</span>
	<span
		class="flex h-[18%] min-h-7 w-full items-center justify-center bg-[var(--tile-band)] text-[var(--tile-band-ink)] {here
			? 'text-xs font-medium'
			: 'font-mono text-sm'}"
	>
		{here ? 'This app' : `:${port}`}
	</span>
{/snippet}

{#if href && !here}
	<a
		class="{tileClass} {tileTone} hover:bg-[var(--wash)]"
		{href}
		target={OPEN_TARGET}
		rel="noopener"
		aria-label="Open {heading}"
		onpointerdown={onPointerDown}
		onpointerup={clearPress}
		onpointercancel={clearPress}
		onpointerleave={clearPress}
		onclick={onClick}
		oncontextmenu={onContextMenu}
	>
		{@render face()}
	</a>
{:else}
	<div class="{tileClass} {tileTone}" aria-current={here ? 'page' : undefined}>
		{@render face()}
	</div>
{/if}
