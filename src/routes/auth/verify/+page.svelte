<!-- verify.svelte -->
<script lang="ts">
	import { supabase } from '$lib/supabase';
	import OtpInput from '$lib/components/OtpInput.svelte';
	import {
		clearPendingVerificationEmail,
		getPendingVerificationEmail,
		isValidOtpCode,
		setPendingVerificationEmail
	} from '$lib/auth/verification';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let email = $state('');
	let otp = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);
	let resendLoading = $state(false);
	let resendMessage = $state('');

	onMount(() => {
		const fromQuery = page.url.searchParams.get('email');
		const fromStorage = getPendingVerificationEmail();
		email = fromQuery || fromStorage || '';
		if (email) {
			setPendingVerificationEmail(email);
		}
	});

	async function handleVerify() {
		if (!email) {
			error = 'Missing email. Please register again.';
			return;
		}

		if (!isValidOtpCode(otp)) {
			error = 'Enter the 6-digit code from your email';
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

		clearPendingVerificationEmail();
		success = true;
		loading = false;

		setTimeout(() => {
			window.location.href = resolve('/dashboard');
		}, 1500);
	}

	async function handleResend() {
		if (!email) {
			resendMessage = 'Missing email. Go back to register.';
			return;
		}

		resendLoading = true;
		resendMessage = '';
		error = '';

		const { error: resendError } = await supabase.auth.resend({
			email,
			type: 'signup'
		});

		if (resendError) {
			resendMessage = resendError.message;
		} else {
			resendMessage = 'New 6-digit code sent! Check your inbox.';
			otp = '';
		}

		resendLoading = false;
	}
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="text-3xl font-bold text-amber-400">🎮 Pateros Quest</a>
			<h2 class="mt-4 text-2xl font-semibold text-white">Enter verification code</h2>
			{#if email}
				<p class="mt-2 text-gray-400">
					We sent a <span class="font-medium text-white">6-digit code</span> to
					<span class="font-medium text-amber-400">{email}</span>
				</p>
			{:else}
				<p class="mt-2 text-gray-400">Register first to receive a verification code.</p>
			{/if}
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
			{#if success}
				<div class="text-center">
					<div class="mb-4 text-5xl">✅</div>
					<h3 class="text-xl font-semibold text-green-400">Email verified!</h3>
					<p class="mt-2 text-gray-400">Redirecting to dashboard...</p>
				</div>
			{:else if !email}
				<div class="text-center">
					<p class="mb-4 text-gray-400">No email found for verification.</p>
					<a
						href={resolve('/auth/register')}
						class="inline-block rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400"
					>
						Go to Register
					</a>
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
						<p class="mb-4 text-center text-sm text-gray-400">Verification code</p>
						<OtpInput bind:value={otp} disabled={loading} />
					</div>

					<button
						type="submit"
						disabled={loading || !isValidOtpCode(otp)}
						class="w-full rounded-lg bg-amber-500 py-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{loading ? 'Verifying...' : 'Verify & continue'}
					</button>

					<div class="mt-6 text-center">
						<button
							type="button"
							onclick={handleResend}
							disabled={resendLoading}
							class="text-sm text-amber-400 hover:text-amber-300 disabled:opacity-50"
						>
							{resendLoading ? 'Sending...' : "Didn't get a code? Resend"}
						</button>
						{#if resendMessage}
							<p class="mt-2 text-sm text-gray-400">{resendMessage}</p>
						{/if}
					</div>

					<p class="mt-6 text-center text-sm text-gray-500">
						Wrong email?
						<a href={resolve('/auth/register')} class="text-amber-400 hover:text-amber-300"
							>Register again</a
						>
					</p>
				</form>
			{/if}
		</div>
	</div>
</main>
