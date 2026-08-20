<script lang="ts">
	import BrandMark from '$lib/BrandMark.svelte';
	import type { Snippet } from 'svelte';

	let {
		hostname,
		addresses,
		children
	}: {
		hostname: string;
		addresses: string[];
		children?: Snippet;
	} = $props();
</script>

<header class="mb-4">
	<div class="flex items-center gap-3">
		<BrandMark />
		<div class="min-w-0">
			<p class="text-lg font-semibold tracking-tight">LocalBerth</p>
			<p class="text-sm">{hostname}</p>
			{#if addresses.length > 0}
				<p class="text-xs tabular-nums text-[var(--muted)]">{addresses.join(' · ')}</p>
			{/if}
		</div>
	</div>
	{#if children}
		<div class="mt-2 text-xs text-[var(--muted)]">
			{@render children()}
		</div>
	{/if}
</header>
