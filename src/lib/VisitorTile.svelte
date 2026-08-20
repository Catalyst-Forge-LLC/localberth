<script lang="ts">
	import { OPEN_TARGET, visitorFaviconUrl, visitorTileLetter } from '$lib/dashboard-url';

	let { name, port, href }: { name: string; port: number; href: string | null } = $props();

	const letter = $derived(visitorTileLetter(name));
	const favicon = $derived(href ? visitorFaviconUrl(href) : null);
	let broken = $state(false);

	const tileClass =
		'flex flex-col items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-4 text-center text-[var(--text)] no-underline';
</script>

{#snippet face()}
	<span
		class="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white/8 text-lg font-semibold text-[var(--muted)]"
		aria-hidden="true"
	>
		{letter}
		{#if favicon && !broken}
			<img
				class="absolute inset-0 size-full object-contain"
				src={favicon}
				alt=""
				onerror={() => {
					broken = true;
				}}
			/>
		{/if}
	</span>
	<span class="w-full truncate text-sm font-medium">{name}</span>
	<span class="tabular-nums text-xs text-[var(--muted)]">{port}</span>
{/snippet}

{#if href}
	<a class="{tileClass} hover:bg-white/[0.07]" {href} target={OPEN_TARGET} rel="noopener" aria-label="Open {name}">
		{@render face()}
	</a>
{:else}
	<div class={tileClass}>
		{@render face()}
	</div>
{/if}
