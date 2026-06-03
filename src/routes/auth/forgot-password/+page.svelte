<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { resolve } from '$app/paths';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleForgotPassword() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		loading = true;
		error = '';

		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

		if (resetError) {
			error = resetError.message;
			loading = false;
			return;
		}

		success = true;
		loading = false;

		setTimeout(() => {
			window.location.href = `/auth/reset-password?email=${encodeURIComponent(email)}`;
		}, 1500);
	}
</script>

<svelte:head>
	<title>Forgot Password - Pateros Quest</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Reset Password</h2>
			<p class="mt-2 text-gray-400">Enter your email to receive a 6-digit reset code</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
			{#if success}
				<div class="text-center">
					<div class="mb-4 text-5xl">📧</div>
					<h3 class="text-xl font-semibold text-green-400">Check Your Email</h3>
					<p class="mt-3 text-gray-400">
						We sent a <span class="font-medium text-white">6-digit code</span> to
						<span class="font-medium text-amber-400">{email}</span>
					</p>
					<p class="mt-2 text-sm text-gray-500">Redirecting you to enter the code...</p>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleForgotPassword();
					}}
				>
					{#if error}
						<div
							class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
						>
							{error}
						</div>
					{/if}

					<div class="mb-6">
						<label for="email" class="mb-2 block text-sm font-medium text-gray-300">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
							autocomplete="email"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-amber-500 py-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{loading ? 'Sending...' : 'Send Reset Code'}
					</button>

					<p class="mt-6 text-center text-sm text-gray-400">
						Remember your password?

						<a
							href={resolve('/auth/login')}
							class="font-medium text-amber-400 hover:text-amber-300"
						>
							Login
						</a>
					</p>
				</form>
			{/if}
		</div>
	</div>
</main>
