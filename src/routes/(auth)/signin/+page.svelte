<script lang="ts">
	import IconBrandGoogle from '~icons/tabler/brand-google-filled';
	import { toast } from 'svelte-sonner';

	import { signIn } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	let isLoading = $state(false);

	type ProviderName = (typeof providers)[number]['provider'];

	const providers = [
		{ provider: 'google', icon: IconBrandGoogle, label: 'Sign in with Google' }
	] as const;

	async function handleSignIn(provider: ProviderName) {
		isLoading = true;
		try {
			await signIn.social({ provider, callbackURL: '/' });
		} catch (error) {
			console.error('Failed to sign in', { provider, cause: error });
			toast.error("We couldn't sign you in right now. Please try again.");
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in to Chat</title>
</svelte:head>

<div class="flex h-screen w-screen items-center justify-center">
	<Card>
		<CardHeader>
			<CardTitle>Ready to Chat?</CardTitle>
			<CardDescription>Sign in to your account to continue</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col">
				{#each providers as provider (provider.provider)}
					<Button
						class="flex justify-start"
						onclick={() => handleSignIn(provider.provider)}
						disabled={isLoading}
					>
						<provider.icon class="size-5" />
						<span>{isLoading ? 'Signing in...' : provider.label}</span>
					</Button>
				{/each}
			</div>
		</CardContent>
		<CardFooter class="flex flex-col">
			<p class="text-muted-foreground text-xs">
				By continuing, you agree to our
				<a href="/terms" class="text-blue-500 hover:underline"> Terms of Service </a>
				and
				<a href="/privacy" class="text-blue-500 hover:underline"> Privacy Policy </a>
			</p>
		</CardFooter>
	</Card>
</div>
