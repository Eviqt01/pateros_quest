import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
	id: string;
	username: string | null;
	role: 'user' | 'admin';
	created_at: string;
}

export const user = writable<User | null>(null);
export const profile = writable<Profile | null>(null);
export const loading = writable(true);

async function fetchProfile(userId: string) {
	try {
		const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
		if (!error && data) {
			profile.set(data as Profile);
		} else {
			// Fallback if role column is not created yet or profile not found
			profile.set({
				id: userId,
				username: null,
				role: 'user',
				created_at: new Date().toISOString()
			});
		}
	} catch (err) {
		console.error('Failed to fetch profile:', err);
		profile.set({
			id: userId,
			username: null,
			role: 'user',
			created_at: new Date().toISOString()
		});
	}
}

export function initAuth() {
	supabase.auth.getSession().then(async ({ data }) => {
		if (data.session) {
			user.set(data.session.user);
			await fetchProfile(data.session.user.id);
		}
		loading.set(false);
	});

	supabase.auth.onAuthStateChange(async (_event, session) => {
		const currentUser = session?.user ?? null;
		user.set(currentUser);
		if (currentUser) {
			await fetchProfile(currentUser.id);
		} else {
			profile.set(null);
		}
	});
}

export async function signOut() {
	await supabase.auth.signOut();
	user.set(null);
	profile.set(null);
}
