import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export const getSupabasePublishableKey = () =>
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasValidSupabaseKey = (key?: string) =>
	!!key &&
	!key.includes("invalid") &&
	!key.includes("your_anon") &&
	key !== "undefined" &&
	(key.startsWith("sb_publishable_") || (key.startsWith("eyJ") && key.length >= 100));

export function hasValidSupabaseConfig(url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = getSupabasePublishableKey()) {
	return (
		!!url &&
		!url.includes("invalid") &&
		!url.includes("your_project") &&
		url !== "undefined" &&
		url.startsWith("https://") &&
		hasValidSupabaseKey(key)
	);
}

export const isSupabaseClientConfigured = hasValidSupabaseConfig();

export function getSupabaseClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = getSupabasePublishableKey();

	if (!url || url.includes("invalid") || url.includes("your_project") || url === "undefined" || !url.startsWith("https://")) {
		const msg =
			"FitCore: Invalid NEXT_PUBLIC_SUPABASE_URL!\n" +
			"Current value: " + url + "\n\n" +
			"Fix: Add your real Supabase URL to .env.local\n" +
			"Get it from: supabase.com/dashboard -> Settings -> API -> Project URL\n" +
			"Then restart the dev server: npm run dev";
		console.error(msg);
		throw new Error("Invalid Supabase URL. Check .env.local and restart server.");
	}

	if (!hasValidSupabaseKey(key)) {
		const msg =
			"FitCore: Invalid NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!\n" +
			"Fix: Add your real publishable key to .env.local\n" +
			"Get it from: supabase.com/dashboard -> Settings -> API -> publishable key\n" +
			"Then restart the dev server: npm run dev";
		console.error(msg);
		throw new Error("Invalid Supabase publishable key. Check .env.local and restart server.");
	}

	return createBrowserClient<Database>(url, key as string);
}

const getLazySupabaseClient = () => getSupabaseClient() as unknown as Record<PropertyKey, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const supabase = new Proxy({} as Record<PropertyKey, unknown>, {
	get(_target, property) {
		const client = getLazySupabaseClient();
		const value = client[property];
		return typeof value === "function" ? value.bind(client) : value;
	},
}) as unknown as any;
/* eslint-enable @typescript-eslint/no-explicit-any */
