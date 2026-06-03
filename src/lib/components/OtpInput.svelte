<script lang="ts">
	import { normalizeOtpCode } from '$lib/auth/verification';

	type Props = {
		value?: string;
		disabled?: boolean;
		onchange?: (code: string) => void;
	};

	let { value = $bindable(''), disabled = false, onchange }: Props = $props();

	const length = 6;
	let digits = $state<string[]>(Array.from({ length }, () => ''));
	let inputs: HTMLInputElement[] = $state([]);

	$effect(() => {
		const normalized = normalizeOtpCode(value);
		if (normalized === digits.join('')) return;
		digits = Array.from({ length }, (_, i) => normalized[i] ?? '');
	});

	function emitChange() {
		const code = digits.join('');
		value = code;
		onchange?.(code);
	}

	function focusAt(index: number) {
		inputs[index]?.focus();
		inputs[index]?.select();
	}

	function handleInput(index: number, event: Event) {
		const input = event.target as HTMLInputElement;
		const char = normalizeOtpCode(input.value).slice(-1);
		digits[index] = char;
		input.value = char;
		emitChange();

		if (char && index < length - 1) {
			focusAt(index + 1);
		}
	}

	function handleKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace') {
			if (digits[index]) {
				digits[index] = '';
				emitChange();
				return;
			}
			if (index > 0) {
				event.preventDefault();
				digits[index - 1] = '';
				emitChange();
				focusAt(index - 1);
			}
		} else if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			focusAt(index - 1);
		} else if (event.key === 'ArrowRight' && index < length - 1) {
			event.preventDefault();
			focusAt(index + 1);
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = normalizeOtpCode(event.clipboardData?.getData('text') ?? '');
		if (!pasted) return;

		digits = Array.from({ length }, (_, i) => pasted[i] ?? '');
		emitChange();
		focusAt(Math.min(pasted.length, length - 1));
	}
</script>

<div class="flex justify-center gap-2" role="group" aria-label="Six digit verification code">
	{#each digits as digit, index (index)}
		<input
			bind:this={inputs[index]}
			type="text"
			inputmode="numeric"
			autocomplete={index === 0 ? 'one-time-code' : 'off'}
			maxlength="1"
			{disabled}
			value={digit}
			aria-label="Digit {index + 1} of 6"
			class="h-14 w-11 rounded-lg border border-gray-700 bg-gray-800 text-center font-mono text-2xl text-white
				focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none
				disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-12"
			oninput={(e) => handleInput(index, e)}
			onkeydown={(e) => handleKeydown(index, e)}
			onpaste={handlePaste}
		/>
	{/each}
</div>
