<script lang="ts">
	import { rowDetailFields } from '$lib/row-detail';
	import type { BoardRow } from '$lib/types';

	let { row, peek }: { row: BoardRow; peek: string } = $props();
	const fields = $derived(rowDetailFields(row));
</script>

<dl class="m-0 grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-x-7 gap-y-2.5">
	{#each fields as field}
		<div class={field.wide || field.label === 'Notes' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
			<dt class="text-[0.68rem] tracking-wide text-[var(--muted)] uppercase">{field.label}</dt>
			<dd class="mt-1 {field.warn ? 'text-[var(--warn)]' : ''}">{field.value}</dd>
		</div>
	{/each}
	<div class="col-span-full min-w-0">
		<dt class="text-[0.68rem] tracking-wide text-[var(--muted)] uppercase">HTTP</dt>
		<dd class="mt-1 text-[var(--accent)]">{peek}</dd>
	</div>
</dl>
