<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let email = $derived(page.url.searchParams.get('email') || '');
	let otp = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);
	let resendLoading = $state(false);
	let resendMessage = $state('');

	async function handleVerify() {
		if (!email || !otp) {
			error = 'Please enter the verification code';
			return;
		}

		loading = true;
		error = '';

		const { error: verifyError } = await supabase.auth.verifyOtp({
			email,
			token: otp,
			type: 'signup'
		});

		if (verifyError) {
			error = verifyError.message;
			loading = false;
			return;
		}

		success = true;
		loading = false;

		setTimeout(() => {
			window.location.href = '/dashboard';
		}, 2000);
	}

	async function handleResend() {
		if (!email) {
			resendMessage = 'No email provided';
			return;
		}

		resendLoading = true;
		resendMessage = '';

		const { error: resendError } = await supabase.auth.resend({
			email,
			type: 'signup'
		});

		if (resendError) {
			resendMessage = resendError.message;
		} else {
			resendMessage = 'Verification code sent!';
		}

		resendLoading = false;
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Verify Your Email</h2>
			<p class="mt-2 text-gray-400">
				We sent a verification code to
				<span class="font-medium text-amber-400">{email}</span>
			</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
			{#if success}
				<div class="text-center">
					<div class="mb-4 text-5xl">✅</div>
					<h3 class="text-xl font-semibold text-green-400">Email Verified!</h3>
					<p class="mt-2 text-gray-400">Redirecting to dashboard...</p>
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleVerify();
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
						<label for="otp" class="mb-2 block text-sm font-medium text-gray-300">
							Verification Code
						</label>
						<input
							id="otp"
							type="text"
							bind:value={otp}
							placeholder="Enter 6-digit code"
							required
							maxlength="6"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center font-mono text-2xl tracking-widest text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-amber-500 py-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{loading ? 'Verifying...' : 'Verify Email'}
					</button>

					<div class="mt-6 text-center">
						<button
							type="button"
							onclick={handleResend}
							disabled={resendLoading}
							class="text-sm text-amber-400 hover:text-amber-300 disabled:opacity-50"
						>
							{resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
						</button>
						{#if resendMessage}
							<p class="mt-2 text-sm text-gray-400">{resendMessage}</p>
						{/if}
					</div>
				</form>
			{/if}
		</div>
	</div>
</main>
