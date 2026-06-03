<!-- login.svelte -->
<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { isEmailNotConfirmedError, setPendingVerificationEmail } from '$lib/auth/verification';
	import { resolve } from '$app/paths';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (signInError) {
			if (isEmailNotConfirmedError(signInError.message)) {
				setPendingVerificationEmail(email);
				await supabase.auth.resend({ email, type: 'signup' });
				window.location.href = `${resolve('/auth/verify')}?email=${encodeURIComponent(email)}`;
				return;
			}
			error = signInError.message;
			loading = false;
			return;
		}

		// Fetch the user's role from the profiles table and redirect accordingly
		if (signInData.user) {
			const { data: profileData } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', signInData.user.id)
				.single();

			if (profileData?.role === 'admin') {
				window.location.href = resolve('/dashboard/admin');
			} else {
				window.location.href = resolve('/dashboard');
			}
		} else {
			window.location.href = resolve('/dashboard');
		}
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Welcome Back</h2>
			<p class="mt-2 text-gray-400">Sign in to continue your quest</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleLogin();
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

			<div class="mb-2">
				<label for="password" class="mb-2 block text-sm font-medium text-gray-300">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Your password"
					required
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
				/>
			</div>

			<div class="mb-6 text-right">
				<a
					href={resolve('/auth/forgot-password')}
					class="text-sm font-medium text-amber-400 hover:text-amber-300">Forgot password?</a
				>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-amber-500 py-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
			>
				{loading ? 'Signing In...' : 'Login'}
			</button>

			<p class="mt-6 text-center text-sm text-gray-400">
				Don't have an account?
				<a href={resolve('/auth/register')} class="font-medium text-amber-400 hover:text-amber-300"
					>Register</a
				>
			</p>
		</form>
	</div>
</main>
