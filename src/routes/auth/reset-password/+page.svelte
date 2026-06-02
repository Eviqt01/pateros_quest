<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { resolve } from '$app/paths';

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleResetPassword() {
		if (!password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		error = '';

		const { error: updateError } = await supabase.auth.updateUser({
			password
		});

		if (updateError) {
			error = updateError.message;
			loading = false;
			return;
		}

		success = true;
		loading = false;

		setTimeout(() => {
			window.location.href = '/dashboard';
		}, 3000);
	}
</script>

<svelte:head>
	<title>Reset Password - Pateros Quest</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Set New Password</h2>
			<p class="mt-2 text-gray-400">Enter your new password below</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
			{#if success}
				<div class="text-center">
					<div class="mb-4 text-5xl">✅</div>
					<h3 class="text-xl font-semibold text-green-400">Password Updated!</h3>
					<p class="mt-3 text-gray-400">Your password has been reset successfully.</p>
					<p class="mt-2 text-sm text-gray-500">Redirecting to dashboard...</p>
					<a
						href={resolve('/dashboard')}
						class="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400"
					>
						Go to Dashboard
					</a>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleResetPassword();
					}}
				>
					{#if error}
						<div
							class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
						>
							{error}
						</div>
					{/if}

					<div class="mb-4">
						<label for="password" class="mb-2 block text-sm font-medium text-gray-300"
							>New Password</label
						>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="At least 6 characters"
							required
							minlength="6"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
						/>
					</div>

					<div class="mb-6">
						<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-300"
							>Confirm New Password</label
						>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm your new password"
							required
							minlength="6"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
						/>
						{#if confirmPassword && password !== confirmPassword}
							<p class="mt-1 text-sm text-red-400">Passwords do not match</p>
						{/if}
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-amber-500 py-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{loading ? 'Updating...' : 'Update Password'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</main>
