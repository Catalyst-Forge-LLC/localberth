<script lang="ts">
	import SiteFooter from '$lib/SiteFooter.svelte';
	import type { Snippet } from 'svelte';

	let { header, children }: { header: Snippet; children: Snippet } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden">
	<div class="shrink-0 px-5 pt-4 pb-3">
		{@render header()}
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
		{@render children()}
	</div>
	<SiteFooter />
</div>
