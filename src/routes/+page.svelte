<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import BrandMark from '$lib/BrandMark.svelte';
	import RowDetail from '$lib/RowDetail.svelte';
	import VisitorTile from '$lib/VisitorTile.svelte';
	import { OPEN_TARGET, rowOpenUrl, visitorHttpUrl } from '$lib/dashboard-url';
	import { isVisitorSelf } from '$lib/visitor';
	import { rowBindDisplay } from '$lib/row-detail';
	import type { BoardRow } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expanded = $state<string | null>(null);
	let peekLine = $state<Record<string, string>>({});

	function rowId(row: BoardRow): string {
		if (row.lease) return `lease:${row.lease.name}`;
		return `obs:${row.observed?.port ?? ''}:${row.observed?.bind ?? ''}`;
	}

	async function toggle(row: BoardRow, event: MouseEvent) {
		if ((event.target as HTMLElement | null)?.closest('a')) return;
		const key = rowId(row);
		if (expanded === key) {
			expanded = null;
			return;
		}
		expanded = key;
		if (!row.listening) {
			peekLine[key] = 'Not listening.';
			return;
		}
		const port = row.lease?.port ?? row.observed?.port;
		if (!port) {
			peekLine[key] = 'Not listening.';
			return;
		}
		peekLine[key] = 'Peeking…';
		const res = await fetch(`/api/peek?port=${port}`);
		const body = (await res.json()) as { line?: string };
		if (expanded === key) peekLine[key] = body.line || 'Not HTTP.';
	}

	onMount(() => {
		const id = setInterval(() => {
			void invalidateAll();
		}, 8000);
		return () => clearInterval(id);
	});
</script>

{#if data.face === 'visitor'}
	<header class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<BrandMark />
		<p class="text-xs text-[var(--muted)]">reachable on this machine</p>
	</header>

	{#if data.visitorRows.length === 0}
		<p class="text-sm text-[var(--muted)]">
			Nothing listening past loopback. Claim with
			<code class="text-[var(--text)]">--lan</code>
			or start the app on all interfaces.
		</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each data.visitorRows as row}
				{#if row.lease}
					{@const here = isVisitorSelf(row)}
					<VisitorTile
						name={row.lease.name}
						port={row.lease.port}
						href={here || !data.pageHost ? null : visitorHttpUrl(data.pageHost, row.lease.port)}
						{here}
					/>
				{/if}
			{/each}
		</div>
	{/if}
{:else}
	<header class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<BrandMark />
		<p class="text-xs text-[var(--muted)]">
			:54321 ·
			{#if data.showSystem}
				<a class="text-[var(--accent)]" href="/">Hide system ports</a>
			{:else}
				<a class="text-[var(--accent)]" href="/?system=1">
					Show {data.hiddenSystem} system port{data.hiddenSystem === 1 ? '' : 's'}
				</a>
			{/if}
		</p>
	</header>

	<section class="mb-5">
		<h2 class="mb-1.5 text-xs font-medium text-[var(--muted)]">Leases</h2>
		<div class="overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
			<table class="w-full min-w-[40rem] text-left text-sm">
				<thead class="border-b border-[var(--line)] text-[0.68rem] font-medium tracking-wide text-[var(--muted)] uppercase">
					<tr>
						<th class="px-3.5 py-2.5">Name</th>
						<th class="px-3.5 py-2.5">Port</th>
						<th class="px-3.5 py-2.5">Bind</th>
						<th class="px-3.5 py-2.5">Listening</th>
						<th class="px-3.5 py-2.5">Process</th>
						<th class="px-3.5 py-2.5">Firewall</th>
						<th class="w-8 px-2 py-2.5"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaseRows as row, i}
						{@const href = rowOpenUrl(row)}
						{@const key = rowId(row)}
						<tr
							class="cursor-pointer border-t border-[var(--line)] hover:bg-[var(--wash)] {i % 2 === 1
								? 'bg-black/[0.03]'
								: ''} {expanded === key ? 'bg-[var(--wash)]' : ''}"
							onclick={(event) => toggle(row, event)}
						>
							<td class="px-3.5 py-2.5 font-medium">{row.lease?.name}</td>
							<td class="px-3.5 py-2.5 tabular-nums">{row.lease?.port}</td>
							<td class="px-3.5 py-2.5 text-[var(--muted)]">{rowBindDisplay(row)}</td>
							<td class="px-3.5 py-2.5">
								{#if row.listening}
									<span class="text-[var(--accent)]">yes</span>
								{:else}
									<span class="text-[var(--muted)]">no</span>
								{/if}
							</td>
							<td class="px-3.5 py-2.5 text-[var(--muted)]">
								{row.observed?.process ?? '—'}
								{#if row.observed?.pid}
									<span class="text-xs">({row.observed.pid})</span>
								{/if}
							</td>
							<td class="px-3.5 py-2.5 text-[var(--muted)]">{row.lease?.firewall}</td>
							<td class="w-8 px-2 py-2 text-right">
								{#if href}
									<a
										class="inline-flex text-[var(--accent)]"
										href={href}
										target={OPEN_TARGET}
										rel="noopener"
										title="Open"
										aria-label="Open"
									>
										<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
											<path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" />
											<path d="M9 2h5v5" />
											<path d="M14 2 8 8" />
										</svg>
									</a>
								{/if}
							</td>
						</tr>
						<tr class="detail">
							<td class="p-0" colspan="7">
								<div class="grid transition-[grid-template-rows] duration-200 {expanded === key ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
									<div class="min-h-0 overflow-hidden">
										<div class="px-4 pb-3.5 pt-2.5 text-sm {expanded === key ? '' : 'invisible'}">
											<RowDetail
												{row}
												peek={peekLine[key] ?? (row.listening ? 'Peeking…' : 'Not listening.')}
											/>
										</div>
									</div>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2 class="mb-1.5 text-xs font-medium text-[var(--muted)]">Observed</h2>
		<div class="overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
			<table class="w-full min-w-[40rem] text-left text-sm">
				<thead class="border-b border-[var(--line)] text-[0.68rem] font-medium tracking-wide text-[var(--muted)] uppercase">
					<tr>
						<th class="px-3.5 py-2.5">Port</th>
						<th class="px-3.5 py-2.5">Bind</th>
						<th class="px-3.5 py-2.5">Process</th>
						<th class="w-8 px-2 py-2.5"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.observedRows as row, i}
						{@const href = rowOpenUrl(row)}
						{@const key = rowId(row)}
						<tr
							class="cursor-pointer border-t border-[var(--line)] hover:bg-[var(--wash)] {i % 2 === 1
								? 'bg-black/[0.03]'
								: ''} {expanded === key ? 'bg-[var(--wash)]' : ''}"
							onclick={(event) => toggle(row, event)}
						>
							<td class="px-3.5 py-2.5 tabular-nums">{row.observed?.port}</td>
							<td class="px-3.5 py-2.5 text-[var(--muted)]">{row.observed?.bind}</td>
							<td class="px-3.5 py-2.5 text-[var(--muted)]">
								{row.observed?.process ?? '—'}
								{#if row.observed?.pid}
									<span class="text-xs">({row.observed.pid})</span>
								{/if}
							</td>
							<td class="w-8 px-2 py-2 text-right">
								{#if href}
									<a
										class="inline-flex text-[var(--accent)]"
										href={href}
										target={OPEN_TARGET}
										rel="noopener"
										title="Open"
										aria-label="Open"
									>
										<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
											<path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" />
											<path d="M9 2h5v5" />
											<path d="M14 2 8 8" />
										</svg>
									</a>
								{/if}
							</td>
						</tr>
						<tr>
							<td class="p-0" colspan="4">
								<div class="grid transition-[grid-template-rows] duration-200 {expanded === key ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
									<div class="min-h-0 overflow-hidden">
										<div class="px-4 pb-3.5 pt-2.5 text-sm {expanded === key ? '' : 'invisible'}">
											<RowDetail
												{row}
												peek={peekLine[key] ?? (row.listening ? 'Peeking…' : 'Not listening.')}
											/>
										</div>
									</div>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td class="px-3 py-2 text-[var(--muted)]" colspan="3">
								Nothing extra listening (system ports hidden).
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<p class="mt-6 text-sm text-[var(--muted)]">
		<code class="text-[var(--text)]">localberth claim name --port N</code>
		·
		<code class="text-[var(--text)]">localberth get name</code>
		·
		<code class="text-[var(--text)]">localberth release name</code>
		·
		<code class="text-[var(--text)]">localberth serve</code>
	</p>
{/if}
