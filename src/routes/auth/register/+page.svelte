<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { resolve } from '$app/paths';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister() {
		if (!email || !password || !confirmPassword) {
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

		const { error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/verify`
			}
		});

		if (signUpError) {
			error = signUpError.message;
			loading = false;
			return;
		}

		// Redirect to verify page with email
		window.location.href = `/auth/verify?email=${encodeURIComponent(email)}`;
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Create Account</h2>
			<p class="mt-2 text-gray-400">Join the adventure today</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleRegister();
			}}
			class="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl"
		>
			{#if error}
				<div
					class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
				>
					{error}
				</div>
			{/if}

			<div class="mb-4">
				<label for="email" class="mb-2 block text-sm font-medium text-gray-300">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
				/>
			</div>

			<div class="mb-4">
				<label for="password" class="mb-2 block text-sm font-medium text-gray-300">Password</label>
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
					>Confirm Password</label
				>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm your password"
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
				{loading ? 'Creating Account...' : 'Register'}
			</button>

			<p class="mt-6 text-center text-sm text-gray-400">
				Already have an account?
				<a href={resolve('/auth/login')} class="font-medium text-amber-400 hover:text-amber-300"
					>Login</a
				>
			</p>
		</form>
	</div>
</main>
