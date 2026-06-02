import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const loading = writable(true);

export function initAuth() {
	supabase.auth.getSession().then(({ data }) => {
		if (data.session) {
			user.set(data.session.user);
		}
		loading.set(false);
	});

	supabase.auth.onAuthStateChange((_event, session) => {
		user.set(session?.user ?? null);
	});
}

export async function signOut() {
	await supabase.auth.signOut();
	user.set(null);
}
