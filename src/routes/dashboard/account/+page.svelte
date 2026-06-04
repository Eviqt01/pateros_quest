<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { signOut } from '$lib/stores/auth';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let currentUser = $derived($user);
	let username = $state('');
	let currentUsername = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');
	let confirmDelete = $state(false);

	onMount(async () => {
		if (!currentUser) return;
		const { data } = await supabase
			.from('profiles')
			.select('username')
			.eq('id', currentUser.id)
			.single();

		if (data) {
			username = data.username || '';
			currentUsername = data.username || '';
		}
		loading = false;
	});

	async function updateUsername() {
		if (!currentUser || !username.trim()) return;
		saving = true;
		message = '';

		const { error } = await supabase
			.from('profiles')
			.update({ username: username.trim() })
			.eq('id', currentUser.id);

		if (error) {
			message = error.message;
			messageType = 'error';
		} else {
			currentUsername = username.trim();
			message = 'Username updated successfully!';
			messageType = 'success';
		}
		saving = false;
	}

	async function handleDeleteAccount() {
		if (!currentUser) return;

		// Delete user data first
		await supabase.from('game_scores').delete().eq('user_id', currentUser.id);
		await supabase.from('quiz_progress').delete().eq('user_id', currentUser.id);
		await supabase.from('profiles').delete().eq('id', currentUser.id);

		// Sign out
		await signOut();
		window.location.href = '/';
	}
</script>

<svelte:head>
	<title>Account - Pateros Quest</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-8 text-3xl font-bold text-white">⚙️ Account Settings</h1>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
			></div>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Profile Info -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-semibold text-white">Profile Information</h2>
				<div class="mb-4">
					<p class="text-sm text-gray-400">Email</p>
					<p class="font-medium text-white">{currentUser?.email}</p>
				</div>
				<div>
					<p class="text-sm text-gray-400">Current Username</p>
					<p class="font-medium text-white">{currentUsername || 'Not set'}</p>
				</div>
			</div>

			<!-- Update Username -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-semibold text-white">Update Username</h2>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						updateUsername();
					}}
				>
					<div class="mb-4">
						<input
							type="text"
							bind:value={username}
							placeholder="Enter new username"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
						/>
					</div>

					{#if message}
						<div
							class="mb-4 rounded-lg p-3 text-sm {messageType === 'success'
								? 'border border-green-500/30 bg-green-500/10 text-green-400'
								: 'border border-red-500/30 bg-red-500/10 text-red-400'}"
						>
							{message}
						</div>
					{/if}

					<button
						type="submit"
						disabled={saving || !username.trim() || username === currentUsername}
						class="rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{saving ? 'Saving...' : 'Update Username'}
					</button>
				</form>
			</div>

			<!-- Game History Summary -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
				<div class="flex flex-wrap gap-3">
					<a
						href={resolve('/dashboard')}
						class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
					>
						View Dashboard
					</a>
					<a
						href={resolve('/dashboard/games/puzzle')}
						class="rounded-lg border border-purple-500/30 px-4 py-2 text-sm text-purple-400 transition-colors hover:bg-purple-500/10"
					>
						🧩 Puzzle
					</a>
					<a
						href={resolve('/dashboard/games/quiz')}
						class="rounded-lg border border-blue-500/30 px-4 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-500/10"
					>
						❓ Quiz
					</a>
					<a
						href={resolve('/dashboard/games/flappy')}
						class="rounded-lg border border-green-500/30 px-4 py-2 text-sm text-green-400 transition-colors hover:bg-green-500/10"
					>
						🦆 Flappy
					</a>
				</div>
			</div>

			<!-- Logout -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-semibold text-white">Session</h2>
				<button
					onclick={async () => {
						await signOut();
						window.location.href = '/';
					}}
					class="rounded-lg border border-gray-700 px-6 py-2 font-medium text-gray-300 transition-colors hover:border-red-500/50 hover:text-red-400"
				>
					Logout
				</button>
			</div>

			<!-- Delete Account -->
			<div class="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
				<h2 class="mb-2 text-lg font-semibold text-red-400">Danger Zone</h2>
				<p class="mb-4 text-sm text-gray-400">
					Permanently delete your account and all associated data. This action cannot be undone.
				</p>
				{#if !confirmDelete}
					<button
						onclick={() => (confirmDelete = true)}
						class="rounded-lg border border-red-500/50 px-6 py-2 font-medium text-red-400 transition-colors hover:bg-red-500/10"
					>
						Delete Account
					</button>
				{:else}
					<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
						<p class="mb-3 text-sm font-medium text-red-400">
							Are you sure? This will permanently delete your account, all scores, and game history.
						</p>
						<div class="flex gap-3">
							<button
								onclick={handleDeleteAccount}
								class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
							>
								Yes, Delete Everything
							</button>
							<button
								onclick={() => (confirmDelete = false)}
								class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
