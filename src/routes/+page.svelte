<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import BoardHeader from '$lib/BoardHeader.svelte';
	import BoardShell from '$lib/BoardShell.svelte';
	import RowDetail from '$lib/RowDetail.svelte';
	import VisitorTile from '$lib/VisitorTile.svelte';
	import { OPEN_TARGET, rowOpenUrl, visitorHttpUrl } from '$lib/dashboard-url';
	import { rowBindDisplay } from '$lib/row-detail';
	import type { BoardRow } from '$lib/types';
	import type { VisitorSnapshot } from '$lib/visitor';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expanded = $state<string | null>(null);
	let peekLine = $state<Record<string, string>>({});
	let visitorFeed = $state<VisitorSnapshot | null>(null);
	let tab = $state<'leases' | 'observed'>('leases');

	const visitorMachine = $derived(visitorFeed ?? data.machine);
	const visitorTiles = $derived(visitorFeed?.tiles ?? data.visitorTiles);

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
		if (data.face === 'visitor') {
			const id = setInterval(() => {
				void fetch('/api/visitor')
					.then((res) => res.json() as Promise<VisitorSnapshot>)
					.then((body) => {
						visitorFeed = body;
					});
			}, 8000);
			return () => clearInterval(id);
		}
		const id = setInterval(() => {
			void invalidateAll();
		}, 8000);
		return () => clearInterval(id);
	});
</script>

{#if data.face === 'visitor'}
	<BoardShell>
		{#snippet header()}
			<BoardHeader hostname={visitorMachine.hostname} addresses={visitorMachine.addresses} />
		{/snippet}
		{#if visitorTiles.length === 0}
			<p class="text-sm text-[var(--muted)]">
				Nothing listening past loopback. Claim with
				<code class="text-[var(--text)]">--lan</code>
				or start the app on all interfaces.
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each visitorTiles as tile (tile.name)}
					<VisitorTile
						name={tile.name}
						port={tile.port}
						title={tile.title}
						icon={tile.icon}
						href={data.pageHost ? visitorHttpUrl(data.pageHost, tile.port) : null}
					/>
				{/each}
			</div>
		{/if}
	</BoardShell>
{:else}
	<BoardShell fill>
		{#snippet header()}
	<BoardHeader hostname={data.machine.hostname} addresses={data.machine.addresses}>
		:54321 ·
		{#if data.showSystem}
			<a href="/">Hide system ports</a>
		{:else}
			<a href="/?system=1">
				Show {data.hiddenSystem} system port{data.hiddenSystem === 1 ? '' : 's'}
			</a>
		{/if}
	</BoardHeader>
		{/snippet}

	<div class="flex min-h-0 flex-1 flex-col">
		<div class="mb-3 flex shrink-0 gap-1" role="tablist" aria-label="Board">
			<button
				type="button"
				role="tab"
				id="tab-leases"
				aria-controls="pane-leases"
				aria-selected={tab === 'leases'}
				class="rounded-t px-3 py-1.5 text-sm {tab === 'leases'
					? 'border-b-2 border-[var(--accent)] font-medium text-[var(--text)]'
					: 'text-[var(--muted)] hover:text-[var(--text)]'}"
				onclick={() => (tab = 'leases')}
			>
				Leases
				<span class="tabular-nums text-[var(--muted)]">{data.leaseRows.length}</span>
			</button>
			<button
				type="button"
				role="tab"
				id="tab-observed"
				aria-controls="pane-observed"
				aria-selected={tab === 'observed'}
				class="rounded-t px-3 py-1.5 text-sm {tab === 'observed'
					? 'border-b-2 border-[var(--accent)] font-medium text-[var(--text)]'
					: 'text-[var(--muted)] hover:text-[var(--text)]'}"
				onclick={() => (tab = 'observed')}
			>
				Observed
				<span class="tabular-nums text-[var(--muted)]">{data.observedRows.length}</span>
			</button>
		</div>

		{#if tab === 'leases'}
			<div id="pane-leases" role="tabpanel" aria-labelledby="tab-leases" class="min-h-0 flex-1 overflow-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
				<table class="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
					<thead class="text-[0.68rem] font-medium tracking-wide text-[var(--muted)] uppercase">
						<tr>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Name</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Port</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Bind</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Listening</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Process</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Firewall</th>
							<th class="sticky top-0 z-10 w-8 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-2 py-2.5"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.leaseRows as row, i}
							{@const href = rowOpenUrl(row)}
							{@const key = rowId(row)}
							<tr
								class="cursor-pointer hover:bg-[var(--wash)] {i % 2 === 1
									? 'bg-black/[0.03]'
									: ''} {expanded === key ? 'bg-[var(--wash)]' : ''}"
								onclick={(event) => toggle(row, event)}
							>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 font-medium">{row.lease?.name}</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 tabular-nums">{row.lease?.port}</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 text-[var(--muted)]">{rowBindDisplay(row)}</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5">
									{#if row.listening}
										<span class="text-[var(--accent)]">yes</span>
									{:else}
										<span class="text-[var(--muted)]">no</span>
									{/if}
								</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 text-[var(--muted)]">
									{row.observed?.process ?? '—'}
									{#if row.observed?.pid}
										<span class="text-xs">({row.observed.pid})</span>
									{/if}
								</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 text-[var(--muted)]">{row.lease?.firewall}</td>
								<td class="w-8 border-t border-[var(--line)] px-2 py-2 text-right">
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
		{:else}
			<div id="pane-observed" role="tabpanel" aria-labelledby="tab-observed" class="min-h-0 flex-1 overflow-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
				<table class="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
					<thead class="text-[0.68rem] font-medium tracking-wide text-[var(--muted)] uppercase">
						<tr>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Port</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Bind</th>
							<th class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5">Process</th>
							<th class="sticky top-0 z-10 w-8 border-b border-[var(--line)] bg-[var(--bg-elevated)] px-2 py-2.5"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.observedRows as row, i}
							{@const href = rowOpenUrl(row)}
							{@const key = rowId(row)}
							<tr
								class="cursor-pointer hover:bg-[var(--wash)] {i % 2 === 1
									? 'bg-black/[0.03]'
									: ''} {expanded === key ? 'bg-[var(--wash)]' : ''}"
								onclick={(event) => toggle(row, event)}
							>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 tabular-nums">{row.observed?.port}</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 text-[var(--muted)]">{row.observed?.bind}</td>
								<td class="border-t border-[var(--line)] px-3.5 py-2.5 text-[var(--muted)]">
									{row.observed?.process ?? '—'}
									{#if row.observed?.pid}
										<span class="text-xs">({row.observed.pid})</span>
									{/if}
								</td>
								<td class="w-8 border-t border-[var(--line)] px-2 py-2 text-right">
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
								<td class="px-3 py-2 text-[var(--muted)]" colspan="4">
									Nothing extra listening (system ports hidden).
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<p class="mt-3 shrink-0 text-sm text-[var(--muted)]">
			<code class="text-[var(--text)]">localberth claim name --port N</code>
			·
			<code class="text-[var(--text)]">localberth get name</code>
			·
			<code class="text-[var(--text)]">localberth release name</code>
			·
			<code class="text-[var(--text)]">localberth serve</code>
		</p>
	</div>
	</BoardShell>
{/if}
