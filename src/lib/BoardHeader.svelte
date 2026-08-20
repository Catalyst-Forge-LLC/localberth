<script lang="ts">
	import { addressCaption } from '$lib/address';
	import BrandMark from '$lib/BrandMark.svelte';
	import { copyText } from '$lib/copy-text';
	import type { Snippet } from 'svelte';

	let {
		hostname,
		addresses,
		class: className = '',
		children
	}: {
		hostname: string;
		addresses: string[];
		class?: string;
		children?: Snippet;
	} = $props();

	let copied = $state<string | null>(null);
	let copiedTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	async function copy(value: string) {
		if (!(await copyText(value))) return;
		if (copiedTimer) clearTimeout(copiedTimer);
		copied = value;
		copiedTimer = setTimeout(() => {
			copied = null;
		}, 1200);
	}
</script>

<header class="bg-black text-[var(--tile-band-ink)] {className}">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2">
		<span class="flex shrink-0 items-center gap-2.5">
			<BrandMark class="h-11 w-auto" />
			<span class="text-base font-semibold tracking-tight">LocalBerth</span>
		</span>
		<button
			type="button"
			class="cursor-pointer text-left text-sm text-white/85 hover:text-white"
			onclick={() => copy(hostname)}
		>
			{copied === hostname ? 'Copied' : hostname}
		</button>
		{#each addresses as addr}
			<span class="text-white/30" aria-hidden="true">·</span>
			<button
				type="button"
				class="cursor-pointer text-left text-sm tabular-nums text-white/70 hover:text-white"
				onclick={() => copy(addr)}
			>
				{copied === addr ? 'Copied' : addressCaption(addr)}
			</button>
		{/each}
		{#if children}
			<span class="text-white/30" aria-hidden="true">·</span>
			<span class="text-sm text-white/70 [&_a]:text-[#8fd4cf] [&_a]:no-underline hover:[&_a]:text-white">
				{@render children()}
			</span>
		{/if}
	</div>
</header>
