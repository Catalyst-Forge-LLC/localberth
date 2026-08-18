<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div>
		<p class="text-sm tracking-wide text-[var(--accent)]">localhost is the machine</p>
		<h1 class="text-3xl font-semibold">LocalBerth</h1>
		<p class="mt-1 text-[var(--muted)]">Named port leases and what’s actually listening.</p>
	</div>
	<p class="text-sm text-[var(--muted)]">dashboard :54321</p>
</header>

<div class="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
	<table class="w-full min-w-[40rem] text-left text-sm">
		<thead class="border-b border-[var(--line)] text-[var(--muted)]">
			<tr>
				<th class="px-4 py-3 font-medium">Name</th>
				<th class="px-4 py-3 font-medium">Port</th>
				<th class="px-4 py-3 font-medium">Bind</th>
				<th class="px-4 py-3 font-medium">Listening</th>
				<th class="px-4 py-3 font-medium">Process</th>
				<th class="px-4 py-3 font-medium">Firewall</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row}
				<tr class="border-t border-[var(--line)]">
					<td class="px-4 py-3 font-medium">
						{row.lease?.name ?? '—'}
						{#if !row.lease}
							<span class="ml-2 text-xs text-[var(--warn)]">observed</span>
						{/if}
					</td>
					<td class="px-4 py-3 tabular-nums">{row.lease?.port ?? row.observed?.port}</td>
					<td class="px-4 py-3 text-[var(--muted)]">{row.lease?.bind ?? row.observed?.bind}</td>
					<td class="px-4 py-3">
						{#if row.listening}
							<span class="text-[var(--accent)]">yes</span>
						{:else}
							<span class="text-[var(--muted)]">no</span>
						{/if}
					</td>
					<td class="px-4 py-3 text-[var(--muted)]">
						{row.observed?.process ?? '—'}
						{#if row.observed?.pid}
							<span class="text-xs">({row.observed.pid})</span>
						{/if}
					</td>
					<td class="px-4 py-3 text-[var(--muted)]">{row.lease?.firewall ?? '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<p class="mt-6 text-sm text-[var(--muted)]">
	<code class="text-[var(--text)]">localberth claim name --port N</code>
	·
	<code class="text-[var(--text)]">localberth get name</code>
	·
	<code class="text-[var(--text)]">localberth scan</code>
</p>
