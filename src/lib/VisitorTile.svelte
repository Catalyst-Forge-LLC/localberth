<script lang="ts">
	import { OPEN_TARGET, visitorFaviconCandidates, visitorTileLetter, VISITOR_FAVICON_FILES } from '$lib/dashboard-url';

	let {
		name,
		port,
		href,
		here = false
	}: { name: string; port: number; href: string | null; here?: boolean } = $props();

	const letter = $derived(visitorTileLetter(name));
	const candidates = $derived(
		here ? VISITOR_FAVICON_FILES.map((file) => `/${file}`) : href ? visitorFaviconCandidates(href) : []
	);
	let iconIndex = $state(0);
	let broken = $state(false);

	$effect(() => {
		void candidates;
		iconIndex = 0;
		broken = false;
	});

	const favicon = $derived(!broken && iconIndex < candidates.length ? (candidates[iconIndex] ?? null) : null);

	const tileClass =
		'flex flex-col items-center gap-2 rounded-[10px] border bg-[var(--bg-elevated)] px-3 py-4 text-center text-[var(--text)] no-underline shadow-sm';
	const tileTone = $derived(here ? 'border-[var(--accent)]/35' : 'border-[var(--line)]');
</script>

{#snippet face()}
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
	<span class="w-full truncate text-sm font-medium">{name}</span>
	<span class="text-xs {here ? 'text-[var(--accent)]' : 'tabular-nums text-[var(--muted)]'}">
		{here ? 'This app' : port}
	</span>
{/snippet}

{#if href && !here}
	<a class="{tileClass} {tileTone} hover:bg-[var(--wash)]" {href} target={OPEN_TARGET} rel="noopener" aria-label="Open {name}">
		{@render face()}
	</a>
{:else}
	<div class="{tileClass} {tileTone}" aria-current={here ? 'page' : undefined}>
		{@render face()}
	</div>
{/if}
