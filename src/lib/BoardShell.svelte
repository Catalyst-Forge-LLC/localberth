<script lang="ts">
	import SiteFooter from '$lib/SiteFooter.svelte';
	import type { Snippet } from 'svelte';

	let { header, children }: { header: Snippet; children: Snippet } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden">
	<div class="shrink-0">
		{@render header()}
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
		{@render children()}
	</div>
	<SiteFooter />
</div>
