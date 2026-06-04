<script lang="ts">
	import { user, profile } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	// Types
	type Difficulty = 'easy' | 'medium' | 'hard';
	type Role = 'admin' | 'user';

	interface Question {
		id: string;
		question: string;
		options: string[];
		answer: number;
		created_at: string;
	}

	interface Puzzle {
		id: string;
		title: string;
		image_url: string;
		difficulty: Difficulty;
		created_at: string;
	}

	interface UserProfile {
		id: string;
		username: string | null;
		role: Role | null;
		created_at: string;
	}

	// Runes
	let activeTab = $state<'questions' | 'puzzles' | 'users'>('questions');
	let currentUser = $derived($user);
	let currentProfile = $derived($profile);

	// Questions state
	let questions = $state<Question[]>([]);
	let questionsLoading = $state(true);
	let editingQuestionId = $state<string | null>(null);
	let qQuestion = $state('');
	let qOptions = $state(['', '', '', '']);
	let qAnswer = $state(0);
	let qError = $state('');
	let qSuccess = $state('');

	// Puzzle images state
	let puzzles = $state<Puzzle[]>([]);
	let puzzlesLoading = $state(true);
	let pTitle = $state('');
	let pImageUrl = $state('');
	let pDifficulty = $state<Difficulty>('easy');
	let pFile = $state<File | null>(null);
	let pError = $state('');
	let pSuccess = $state('');
	let uploadingFile = $state(false);

	// Users state
	let usersList = $state<UserProfile[]>([]);
	let usersLoading = $state(true);
	let uError = $state('');
	let uSuccess = $state('');

	// Auth Guard
	$effect(() => {
		if (!questionsLoading && currentProfile && currentProfile.role !== 'admin') {
			goto(resolve('/dashboard'));
		}
	});

	// Default Quiz Questions to Seed
	const defaultQuestions: Omit<Question, 'id' | 'created_at'>[] = [
		{
			question: 'What is the capital of France?',
			options: ['London', 'Berlin', 'Paris', 'Madrid'],
			answer: 2
		},
		{
			question: 'Which planet is known as the Red Planet?',
			options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
			answer: 1
		},
		{
			question: 'What is the largest ocean on Earth?',
			options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
			answer: 3
		},
		{
			question: 'Who painted the Mona Lisa?',
			options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'],
			answer: 1
		},
		{
			question: 'What is the chemical symbol for gold?',
			options: ['Go', 'Gd', 'Au', 'Ag'],
			answer: 2
		},
		{ question: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
		{
			question: 'What is the fastest land animal?',
			options: ['Lion', 'Cheetah', 'Horse', 'Gazelle'],
			answer: 1
		},
		{
			question: 'Which country has the most people?',
			options: ['India', 'USA', 'China', 'Indonesia'],
			answer: 0
		},
		{
			question: 'What year did World War II end?',
			options: ['1943', '1944', '1945', '1946'],
			answer: 2
		},
		{
			question: 'What is the smallest bone in the human body?',
			options: ['Femur', 'Stapes', 'Tibia', 'Radius'],
			answer: 1
		},
		{
			question: 'Which element has the atomic number 1?',
			options: ['Helium', 'Oxygen', 'Carbon', 'Hydrogen'],
			answer: 3
		},
		{
			question: 'What is the hardest natural substance?',
			options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
			answer: 2
		},
		{
			question: 'Who wrote Romeo and Juliet?',
			options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'],
			answer: 1
		},
		{
			question: 'What is the largest mammal?',
			options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
			answer: 1
		},
		{ question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
		{
			question: 'What is the main language spoken in Brazil?',
			options: ['Spanish', 'Portuguese', 'French', 'Italian'],
			answer: 1
		},
		{
			question: 'Which gas do plants absorb?',
			options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
			answer: 2
		},
		{
			question: 'What is the tallest mountain in the world?',
			options: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'],
			answer: 2
		},
		{
			question: 'Who invented the telephone?',
			options: ['Edison', 'Tesla', 'Bell', 'Marconi'],
			answer: 2
		},
		{
			question: 'What is the currency of Japan?',
			options: ['Yuan', 'Won', 'Yen', 'Ringgit'],
			answer: 2
		}
	];

	// Default Puzzle Images to Seed
	const defaultImages: Omit<Puzzle, 'id' | 'created_at'>[] = [
		{
			title: 'San Roque Parish Church',
			image_url: '/images/puzzles/pateros_church.png',
			difficulty: 'easy'
		},
		{
			title: 'Traditional Balut Making',
			image_url: '/images/puzzles/balut_making.png',
			difficulty: 'medium'
		},
		{
			title: 'Scenic Pateros River Sunset',
			image_url: '/images/puzzles/pateros_river.png',
			difficulty: 'hard'
		}
	];

	onMount(() => {
		loadQuestions();
		loadPuzzles();
		loadUsers();
	});

	// Questions Operations
	async function loadQuestions() {
		questionsLoading = true;
		const { data, error } = await supabase
			.from('quiz_questions')
			.select('*')
			.order('created_at', { ascending: false });

		if (!error && data) questions = data as Question[];
		questionsLoading = false;
	}

	async function saveQuestion() {
		qError = '';
		qSuccess = '';
		if (!qQuestion.trim() || qOptions.some((opt) => !opt.trim())) {
			qError = 'Please fill in the question and all 4 options.';
			return;
		}

		const questionData = {
			question: qQuestion.trim(),
			options: qOptions.map((opt) => opt.trim()),
			answer: qAnswer
		};

		if (editingQuestionId) {
			const { error } = await supabase
				.from('quiz_questions')
				.update(questionData)
				.eq('id', editingQuestionId);

			if (error) {
				qError = error.message;
			} else {
				qSuccess = 'Question updated successfully!';
				resetQuestionForm();
				await loadQuestions();
			}
		} else {
			const { error } = await supabase.from('quiz_questions').insert(questionData);

			if (error) {
				qError = error.message;
			} else {
				qSuccess = 'Question added successfully!';
				resetQuestionForm();
				await loadQuestions();
			}
		}
	}

	function editQuestion(q: Question) {
		editingQuestionId = q.id;
		qQuestion = q.question;
		qOptions = [...q.options];
		qAnswer = q.answer;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function deleteQuestion(id: string) {
		if (!confirm('Are you sure you want to delete this question?')) return;
		const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
		if (error) alert('Failed to delete question: ' + error.message);
		else await loadQuestions();
	}

	function resetQuestionForm() {
		editingQuestionId = null;
		qQuestion = '';
		qOptions = ['', '', '', ''];
		qAnswer = 0;
	}

	async function seedQuestions() {
		if (!confirm('This will seed default questions into the database. Proceed?')) return;
		const { error } = await supabase.from('quiz_questions').insert(defaultQuestions);
		if (error) alert('Seeding failed: ' + error.message);
		else {
			alert('Successfully seeded 20 questions!');
			await loadQuestions();
		}
	}

	// Puzzle Operations
	async function loadPuzzles() {
		puzzlesLoading = true;
		const { data, error } = await supabase
			.from('puzzle_images')
			.select('*')
			.order('created_at', { ascending: false });

		if (!error && data) puzzles = data as Puzzle[];
		puzzlesLoading = false;
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			pFile = target.files[0];
			pImageUrl = '';
		}
	}

	async function savePuzzle() {
		pError = '';
		pSuccess = '';
		if (!pTitle.trim()) {
			pError = 'Please enter a title.';
			return;
		}
		if (!pFile && !pImageUrl.trim()) {
			pError = 'Please provide an Image URL or select a file to upload.';
			return;
		}

		let finalImageUrl = pImageUrl.trim();

		if (pFile) {
			uploadingFile = true;
			const fileExt = pFile.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
			const filePath = `puzzles/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('puzzle-images')
				.upload(filePath, pFile);

			if (uploadError) {
				pError =
					'Storage upload failed. Please ensure a "puzzle-images" bucket exists, or use an image URL instead.';
				uploadingFile = false;
				return;
			}

			const { data } = supabase.storage.from('puzzle-images').getPublicUrl(filePath);
			finalImageUrl = data.publicUrl;
			uploadingFile = false;
		}

		const { error } = await supabase.from('puzzle_images').insert({
			title: pTitle.trim(),
			image_url: finalImageUrl,
			difficulty: pDifficulty
		});

		if (error) {
			pError = error.message;
		} else {
			pSuccess = 'Puzzle image added successfully!';
			pTitle = '';
			pImageUrl = '';
			pFile = null;
			const fileInput = document.getElementById('puzzle-file') as HTMLInputElement;
			if (fileInput) fileInput.value = '';
			await loadPuzzles();
		}
	}

	async function deletePuzzle(id: string, imageUrl: string) {
		if (!confirm('Are you sure you want to delete this puzzle image?')) return;

		if (imageUrl.includes('/storage/v1/object/public/puzzle-images/')) {
			const path = imageUrl.split('/puzzle-images/').pop();
			if (path) await supabase.storage.from('puzzle-images').remove([path]);
		}

		const { error } = await supabase.from('puzzle_images').delete().eq('id', id);
		if (error) alert('Failed to delete puzzle: ' + error.message);
		else await loadPuzzles();
	}

	async function seedImages() {
		if (!confirm('This will seed default Pateros images into the database. Proceed?')) return;
		const { error } = await supabase.from('puzzle_images').insert(defaultImages);
		if (error) alert('Seeding failed: ' + error.message);
		else {
			alert('Successfully seeded 3 default images!');
			await loadPuzzles();
		}
	}

	// Users Operations
	async function loadUsers() {
		usersLoading = true;
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.order('created_at', { ascending: false });

		if (!error && data) usersList = data as UserProfile[];
		usersLoading = false;
	}

	async function toggleUserRole(userId: string, currentRole: Role | null) {
		uError = '';
		uSuccess = '';
		const newRole: Role = currentRole === 'admin' ? 'user' : 'admin';

		if (userId === currentUser?.id) {
			uError = 'You cannot change your own role.';
			return;
		}

		const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
		if (error) uError = error.message;
		else {
			uSuccess = 'User role updated successfully!';
			await loadUsers();
		}
	}
</script>

<svelte:head>
	<title>Admin Panel - Pateros Quest</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="flex items-center gap-2 text-3xl font-bold text-white">
				<span>Admin Panel</span>
			</h1>
			<p class="mt-1 text-gray-400">Manage questions, puzzle images, and user roles</p>
		</div>
		<div class="flex gap-2">
			{#if activeTab === 'questions'}
				<button
					onclick={seedQuestions}
					class="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
				>
					Seed Default Questions
				</button>
			{/if}
			{#if activeTab === 'puzzles'}
				<button
					onclick={seedImages}
					class="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/20"
				>
					Seed Default Images
				</button>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-800">
		<nav class="-mb-px flex space-x-8" aria-label="Tabs">
			{#each [['questions', '❓ Quiz Questions', questions.length], ['puzzles', '🧩 Puzzle Images', puzzles.length], ['users', '👥 User Management', usersList.length]] as const as [tab, label, count] (tab)}
				<button
					onclick={() => (activeTab = tab)}
					class="border-b-2 px-1 pb-4 text-sm font-medium transition-colors {activeTab === tab
						? 'border-amber-500 text-amber-400'
						: 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300'}"
				>
					{label} ({count})
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab Contents -->
	{#if activeTab === 'questions'}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Add/Edit form -->
			<div class="self-start rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-1">
				<h3 class="mb-4 text-lg font-semibold text-white">
					{editingQuestionId ? '📝 Edit Question' : '✨ Add New Question'}
				</h3>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						saveQuestion();
					}}
					class="space-y-4"
				>
					{#if qError}
						<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
							{qError}
						</div>
					{/if}
					{#if qSuccess}
						<div
							class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
						>
							{qSuccess}
						</div>
					{/if}

					<div>
						<label for="q-text" class="block text-sm font-medium text-gray-300">Question</label>
						<textarea
							id="q-text"
							bind:value={qQuestion}
							rows="3"
							required
							class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
							placeholder="Enter question text here..."
						></textarea>
					</div>

					<div class="space-y-3">
						<span class="block text-sm font-medium text-gray-300">Options</span>
						{#each [0, 1, 2, 3] as const as i (i)}
							<div class="flex items-center gap-2">
								<input
									type="radio"
									name="correct-answer"
									checked={qAnswer === i}
									onchange={() => (qAnswer = i)}
									class="h-4 w-4 border-gray-700 bg-gray-800 text-amber-500 focus:ring-amber-500"
								/>
								<input
									type="text"
									bind:value={qOptions[i]}
									required
									placeholder="Option {String.fromCharCode(65 + i)}"
									class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
								/>
							</div>
						{/each}
						<span class="text-xs text-gray-500"
							>Select the radio button next to the correct answer option.</span
						>
					</div>

					<div class="flex gap-2 pt-2">
						<button
							type="submit"
							class="flex-1 rounded-lg bg-amber-500 py-2.5 font-semibold text-gray-950 transition-colors hover:bg-amber-400"
						>
							{editingQuestionId ? 'Update Question' : 'Add Question'}
						</button>
						{#if editingQuestionId}
							<button
								type="button"
								onclick={resetQuestionForm}
								class="rounded-lg border border-gray-700 px-4 py-2.5 font-medium text-gray-300 hover:bg-gray-800"
							>
								Cancel
							</button>
						{/if}
					</div>
				</form>
			</div>

			<!-- List questions -->
			<div class="space-y-4 lg:col-span-2">
				<h3 class="text-lg font-semibold text-white">Quiz Questions List</h3>
				{#if questionsLoading}
					<div class="flex justify-center py-10">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
						></div>
					</div>
				{:else if questions.length === 0}
					<div
						class="rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-500"
					>
						No questions found. Click "Seed Default Questions" above or add one now!
					</div>
				{:else}
					<div class="max-h-[600px] space-y-4 overflow-y-auto pr-2">
						{#each questions as q (q.id)}
							<div
								class="flex flex-col justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-6 md:flex-row md:items-start"
							>
								<div class="flex-1 space-y-2">
									<p class="text-lg font-medium text-white">{q.question}</p>
									<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
										{#each q.options as opt, idx (idx)}
											<div class="flex items-center gap-2 text-sm">
												<span
													class="font-bold {idx === q.answer ? 'text-green-400' : 'text-gray-500'}"
												>
													{String.fromCharCode(65 + idx)}.
												</span>
												<span
													class={idx === q.answer
														? 'font-semibold text-green-300'
														: 'text-gray-400'}
												>
													{opt}
												</span>
											</div>
										{/each}
									</div>
								</div>
								<div class="flex gap-2 self-end md:self-start">
									<button
										onclick={() => editQuestion(q)}
										class="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800"
									>
										Edit
									</button>
									<button
										onclick={() => deleteQuestion(q.id)}
										class="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'puzzles'}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Add form -->
			<div class="self-start rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-1">
				<h3 class="mb-4 text-lg font-semibold text-white">🧩 Add Puzzle Image</h3>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						savePuzzle();
					}}
					class="space-y-4"
				>
					{#if pError}
						<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
							{pError}
						</div>
					{/if}
					{#if pSuccess}
						<div
							class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
						>
							{pSuccess}
						</div>
					{/if}

					<div>
						<label for="p-title" class="block text-sm font-medium text-gray-300">Title</label>
						<input
							id="p-title"
							type="text"
							bind:value={pTitle}
							required
							class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
							placeholder="e.g. Pateros Duck Farm"
						/>
					</div>

					<div>
						<label for="p-diff" class="block text-sm font-medium text-gray-300">Difficulty</label>
						<select
							id="p-diff"
							bind:value={pDifficulty}
							class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
						>
							<option value="easy">Easy (3×3 Grid)</option>
							<option value="medium">Medium (4×4 Grid)</option>
							<option value="hard">Hard (5×5 Grid)</option>
						</select>
					</div>

					<div class="space-y-4 border-t border-gray-800 pt-4">
						<span class="block text-sm font-medium text-gray-300">Image Source</span>
						<div>
							<label for="p-url" class="block text-xs text-gray-400"
								>Option A: External Image URL</label
							>
							<input
								id="p-url"
								type="url"
								bind:value={pImageUrl}
								disabled={!!pFile}
								class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
								placeholder="https://example.com/image.jpg"
							/>
						</div>

						<div class="relative flex items-center py-2">
							<div class="grow border-t border-gray-800"></div>
							<span class="mx-4 shrink text-xs text-gray-500 uppercase">or</span>
							<div class="grow border-t border-gray-800"></div>
						</div>

						<div>
							<label for="puzzle-file" class="block text-xs text-gray-400"
								>Option B: Upload File</label
							>
							<input
								id="puzzle-file"
								type="file"
								accept="image/*"
								onchange={handleFileChange}
								disabled={!!pImageUrl}
								class="mt-1 w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-400 hover:file:bg-amber-500/20 disabled:opacity-50"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={uploadingFile}
						class="w-full rounded-lg bg-amber-500 py-2.5 pt-3 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
					>
						{uploadingFile ? 'Uploading File...' : 'Add Puzzle'}
					</button>
				</form>
			</div>

			<!-- List Puzzles -->
			<div class="space-y-4 lg:col-span-2">
				<h3 class="text-lg font-semibold text-white">Puzzle Images List</h3>
				{#if puzzlesLoading}
					<div class="flex justify-center py-10">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
						></div>
					</div>
				{:else if puzzles.length === 0}
					<div
						class="rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-500"
					>
						No puzzle images found. Click "Seed Default Images" above or add one now!
					</div>
				{:else}
					<div class="grid max-h-[600px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
						{#each puzzles as p (p.id)}
							<div
								class="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-4"
							>
								<div
									class="group relative mb-3 aspect-video overflow-hidden rounded-lg border border-gray-800 bg-gray-950"
								>
									<img src={p.image_url} alt={p.title} class="h-full w-full object-cover" />
									<span
										class="absolute top-2 right-2 rounded bg-gray-900/80 px-2 py-0.5 text-xs font-semibold tracking-wider uppercase
										{p.difficulty === 'easy'
											? 'text-green-400'
											: p.difficulty === 'medium'
												? 'text-yellow-400'
												: 'text-red-400'}"
									>
										{p.difficulty}
									</span>
								</div>
								<div class="mt-1 flex items-center justify-between">
									<div>
										<h4 class="max-w-[180px] truncate font-medium text-white">{p.title}</h4>
										<span class="text-xs text-gray-500"
											>Added {new Date(p.created_at).toLocaleDateString()}</span
										>
									</div>
									<button
										onclick={() => deletePuzzle(p.id, p.image_url)}
										class="rounded-lg border border-red-500/20 p-2 text-red-400 transition-colors hover:bg-red-500/10"
									>
										🗑️
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'users'}
		<div class="rounded-xl border border-gray-800 bg-gray-900">
			<div class="border-b border-gray-800 p-6">
				<h3 class="text-lg font-semibold text-white">Registered Users</h3>
				<p class="text-sm text-gray-500">View user profiles and toggle admin privileges</p>
			</div>

			{#if uError}
				<div
					class="m-6 mb-0 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
				>
					{uError}
				</div>
			{/if}
			{#if uSuccess}
				<div
					class="m-6 mb-0 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
				>
					{uSuccess}
				</div>
			{/if}

			{#if usersLoading}
				<div class="flex justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
					></div>
				</div>
			{:else}
				<div class="divide-y divide-gray-800">
					{#each usersList as u (u.id)}
						<div class="flex items-center justify-between p-6">
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium text-white">{u.username ?? 'Anonymous User'}</p>
									<span
										class="rounded px-2 py-0.5 text-xs font-semibold tracking-wider uppercase
										{u.role === 'admin' ? 'bg-red-500/15 text-red-400' : 'bg-gray-800 text-gray-400'}"
									>
										{u.role ?? 'user'}
									</span>
								</div>
								<p class="mt-1 text-xs text-gray-500">User ID: {u.id}</p>
								<p class="text-xs text-gray-500">
									Joined: {new Date(u.created_at).toLocaleDateString()}
								</p>
							</div>

							{#if u.id !== currentUser?.id}
								<button
									onclick={() => toggleUserRole(u.id, u.role)}
									class="rounded-lg px-4 py-2 text-sm font-semibold transition-all
										{u.role === 'admin'
										? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
										: 'bg-red-500 text-white shadow-md shadow-red-500/10 hover:bg-red-600'}"
								>
									{u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
								</button>
							{:else}
								<span class="text-sm font-medium text-gray-500 italic">You (Current Admin)</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
