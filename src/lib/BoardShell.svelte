<script lang="ts">
	import SiteFooter from '$lib/SiteFooter.svelte';
	import type { Snippet } from 'svelte';

	let {
		header,
		children,
		fill = false
	}: { header: Snippet; children: Snippet; fill?: boolean } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden">
	<div class="shrink-0">
		{@render header()}
	</div>
	<div
		class="min-h-0 flex-1 px-5 py-4 {fill
			? 'flex flex-col overflow-hidden'
			: 'overflow-y-auto'}"
	>
		{@render children()}
	</div>
	<SiteFooter />
</div>
