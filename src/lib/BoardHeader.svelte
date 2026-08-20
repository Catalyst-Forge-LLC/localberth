<script lang="ts">
	import BrandMark from '$lib/BrandMark.svelte';
	import { copyText } from '$lib/copy-text';
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

<header class="mb-4">
	<div class="flex items-center gap-3">
		<BrandMark />
		<div class="min-w-0">
			<p class="text-lg font-semibold tracking-tight">LocalBerth</p>
			<button
				type="button"
				class="block max-w-full cursor-pointer truncate text-left text-sm"
				onclick={() => copy(hostname)}
			>
				{copied === hostname ? 'Copied' : hostname}
			</button>
			{#if addresses.length > 0}
				<p class="text-xs tabular-nums text-[var(--muted)]">
					{#each addresses as addr, i}
						{#if i > 0}<span aria-hidden="true"> · </span>{/if}
						<button type="button" class="cursor-pointer text-left" onclick={() => copy(addr)}>
							{copied === addr ? 'Copied' : addr}
						</button>
					{/each}
				</p>
			{/if}
		</div>
	</div>
	{#if children}
		<div class="mt-2 text-xs text-[var(--muted)]">
			{@render children()}
		</div>
	{/if}
</header>
