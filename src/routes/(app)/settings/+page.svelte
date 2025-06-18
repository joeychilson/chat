<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';

	import { toast } from 'svelte-sonner';

	import IconDeviceDesktop from '~icons/tabler/device-desktop';
	import IconShield from '~icons/tabler/shield';
	import IconLoader from '~icons/tabler/loader-2';
	import IconDeviceMobile from '~icons/tabler/device-mobile';
	import IconDeviceTablet from '~icons/tabler/device-tablet';
	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconWarning from '~icons/tabler/alert-triangle';

	import { client, deleteUser } from '$lib/auth';
	import { ChatModelSelector, ChatModelOptions } from '$lib/components/chat/model';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import { defaultModel, type Model } from '$lib/models';
	import { getDeviceInfo } from '$lib/utils/auth';
	import { formatDate } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();

	let sessions = $state(data.sessions);
	let isSessionsDialogOpen = $state(false);
	let isRevokingOthers = $state(false);
	let isRevokingAll = $state(false);
	let revokingSessions = $state(new Set<string>());
	let expandedSessions = $state(new Set<string>());

	const activeSessions = $derived(
		sessions
			.filter((session) => new Date(session.expiresAt) > new Date())
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	);

	const currentSessionId = $derived(activeSessions.length > 0 ? activeSessions[0].id : null);

	function toggleSessionDetails(sessionId: string) {
		if (expandedSessions.has(sessionId)) {
			expandedSessions.delete(sessionId);
		} else {
			expandedSessions.add(sessionId);
		}
		expandedSessions = new Set(expandedSessions);
	}

	async function revokeSession(sessionId: string, token: string) {
		revokingSessions.add(sessionId);
		revokingSessions = revokingSessions;

		try {
			await client.revokeSession({ token });
			sessions = sessions.filter((session) => session.id !== sessionId);
		} catch (error) {
			console.error('Failed to revoke session', { sessionId, cause: error });
		} finally {
			revokingSessions.delete(sessionId);
			revokingSessions = revokingSessions;
		}
	}

	async function revokeOtherSessions() {
		isRevokingOthers = true;
		try {
			await client.revokeOtherSessions();
			sessions = sessions.filter((session) => session.id === currentSessionId);
		} catch (error) {
			console.error('Failed to revoke other sessions', { cause: error });
		} finally {
			isRevokingOthers = false;
		}
	}

	async function revokeAllSessions() {
		isRevokingAll = true;
		try {
			await client.revokeSessions();
			sessions = [];
			isSessionsDialogOpen = false;
		} catch (error) {
			console.error('Failed to revoke all sessions', { cause: error });
		} finally {
			isRevokingAll = false;
		}
	}

	const requiredDeleteText = 'DELETE MY ACCOUNT';

	let deleteDialogOpen = $state(false);
	let deleteConfirmationText = $state('');
	let isDeleting = $state(false);

	let userDefaultModel: Model = $state(data.userSettings?.defaultModel || defaultModel);
	let isUpdatingModel = $state(false);
	let userDefaultSpeechVoice = $state(data.userSettings?.defaultSpeechVoice || 'alloy');
	let userDefaultSpeechSpeed = $state(data.userSettings?.defaultSpeechSpeed || '1.0');
	let isUpdatingSpeech = $state(false);

	async function handleModelChange(newModel: Model) {
		isUpdatingModel = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ defaultModel: newModel })
			});

			if (!response.ok) throw new Error('Failed to update model');

			userDefaultModel = newModel;
			toast.success('Default model updated successfully');
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update default model', { cause: error });
			toast.error("We couldn't update your default model. Please try again.");
		} finally {
			isUpdatingModel = false;
		}
	}

	async function handleSpeechVoiceChange(newVoice: string) {
		isUpdatingSpeech = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ defaultSpeechVoice: newVoice })
			});

			if (!response.ok) throw new Error('Failed to update voice');

			userDefaultSpeechVoice = newVoice;
			toast.success('Default voice updated successfully');
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update default voice', { cause: error });
			toast.error("We couldn't update your default voice. Please try again.");
		} finally {
			isUpdatingSpeech = false;
		}
	}

	async function handleSpeechSpeedChange(newSpeed: string) {
		isUpdatingSpeech = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ defaultSpeechSpeed: newSpeed })
			});

			if (!response.ok) throw new Error('Failed to update speed');

			userDefaultSpeechSpeed = newSpeed;
			toast.success('Default speed updated successfully');
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update default speed', { cause: error });
			toast.error("We couldn't update your default speed. Please try again.");
		} finally {
			isUpdatingSpeech = false;
		}
	}

	async function handleDeleteAccount() {
		if (deleteConfirmationText !== requiredDeleteText) {
			toast.error(`Please type exactly: ${requiredDeleteText}`);
			return;
		}

		isDeleting = true;

		try {
			await deleteUser();
			deleteDialogOpen = false;
			toast.success('Your account has been deleted successfully.');
			await goto('/signin', { replaceState: true });
		} catch (error) {
			console.error('Failed to delete account', { cause: error });
			toast.error("We couldn't delete your account right now. Please try again.");
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-4">
	<header class="pt-16 pb-6">
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight">Settings</h1>
			<p class="text-muted-foreground text-sm">
				Manage your account, sessions, and security settings.
			</p>
		</div>
	</header>
	<main class="space-y-8 pt-6">
		<div class="space-y-6">
			<h3 class="text-lg font-semibold">Preferences</h3>

			<div class="space-y-4">
				<div
					class="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4"
				>
					<div class="space-y-1">
						<p class="text-sm font-medium">Default Model</p>
						<p class="text-muted-foreground text-xs">
							Choose the default AI model and options for new chats
						</p>
					</div>
					<div class="flex items-center gap-2">
						<ChatModelOptions
							bind:model={userDefaultModel}
							onModelChange={handleModelChange}
							disabled={isUpdatingModel}
						/>
						<ChatModelSelector
							bind:model={userDefaultModel}
							onModelChange={handleModelChange}
							disabled={isUpdatingModel}
						/>
					</div>
				</div>

				<div
					class="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4"
				>
					<div class="space-y-1">
						<p class="text-sm font-medium">Default Speech Settings</p>
						<p class="text-muted-foreground text-xs">
							Choose the default voice and speed for text-to-speech generation
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Select.Root
							value={userDefaultSpeechSpeed}
							onValueChange={handleSpeechSpeedChange}
							type="single"
						>
							<Select.Trigger class="w-24" disabled={isUpdatingSpeech}>
								<span class="text-sm">{userDefaultSpeechSpeed}x</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="0.25">0.25x</Select.Item>
								<Select.Item value="0.5">0.5x</Select.Item>
								<Select.Item value="0.75">0.75x</Select.Item>
								<Select.Item value="1.0">1.0x</Select.Item>
								<Select.Item value="1.25">1.25x</Select.Item>
								<Select.Item value="1.5">1.5x</Select.Item>
								<Select.Item value="2.0">2.0x</Select.Item>
								<Select.Item value="4.0">4.0x</Select.Item>
							</Select.Content>
						</Select.Root>
						<Select.Root
							value={userDefaultSpeechVoice}
							onValueChange={handleSpeechVoiceChange}
							type="single"
						>
							<Select.Trigger class="w-32" disabled={isUpdatingSpeech}>
								<span class="text-sm"
									>{userDefaultSpeechVoice.charAt(0).toUpperCase() +
										userDefaultSpeechVoice.slice(1)}</span
								>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="alloy">Alloy</Select.Item>
								<Select.Item value="echo">Echo</Select.Item>
								<Select.Item value="fable">Fable</Select.Item>
								<Select.Item value="onyx">Onyx</Select.Item>
								<Select.Item value="nova">Nova</Select.Item>
								<Select.Item value="shimmer">Shimmer</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<h3 class="text-lg font-semibold">Security & Privacy</h3>

			<div class="space-y-4">
				<div
					class="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4"
				>
					<div class="space-y-1">
						<p class="text-sm font-medium">Login Sessions</p>
						<p class="text-muted-foreground text-xs">Manage your active login sessions</p>
					</div>
					<Dialog bind:open={isSessionsDialogOpen}>
						<DialogTrigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>Manage</Button>
							{/snippet}
						</DialogTrigger>

						<DialogContent class="max-w-md">
							<DialogHeader>
								<DialogTitle>Login Sessions</DialogTitle>
								<DialogDescription
									>Manage your active login sessions across all devices.</DialogDescription
								>
							</DialogHeader>

							<div class="space-y-4">
								{#if activeSessions.length === 0}
									<div class="py-8 text-center">
										<IconShield class="text-muted-foreground mx-auto mb-2 size-8" />
										<h3 class="mb-1 font-medium">No Active Sessions</h3>
										<p class="text-muted-foreground text-sm">
											You currently have no active login sessions
										</p>
									</div>
								{:else}
									<div class="flex items-center justify-between">
										<div>
											<h3 class="font-medium">Active Sessions</h3>
											<p class="text-muted-foreground text-xs">
												{activeSessions.length} session{activeSessions.length === 1 ? '' : 's'}
											</p>
										</div>
										{#if activeSessions.length > 1}
											<AlertDialog>
												<AlertDialogTrigger>
													{#snippet child({ props })}
														<Button variant="outline" disabled={isRevokingOthers} {...props}>
															{#if isRevokingOthers}
																<IconLoader class="size-4 animate-spin" />
															{/if}
															Revoke Others
														</Button>
													{/snippet}
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Revoke Other Sessions</AlertDialogTitle>
														<AlertDialogDescription>
															This will sign you out of all other devices. You'll stay signed in on
															this device.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction onclick={revokeOtherSessions}
															>Revoke Others</AlertDialogAction
														>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										{/if}
									</div>

									<div class="space-y-2">
										{#each activeSessions as session (session.id)}
											{@const deviceInfo = getDeviceInfo(session.userAgent || '')}
											{@const isCurrentSession = session.id === currentSessionId}
											{@const isRevoking = revokingSessions.has(session.id)}
											{@const isExpanded = expandedSessions.has(session.id)}

											<Card class="p-3">
												<div class="flex items-start gap-3">
													<div
														class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded"
													>
														{#if deviceInfo.deviceType === 'mobile'}
															<IconDeviceMobile class="text-primary size-4" />
														{:else if deviceInfo.deviceType === 'tablet'}
															<IconDeviceTablet class="text-primary size-4" />
														{:else}
															<IconDeviceDesktop class="text-primary size-4" />
														{/if}
													</div>

													<div class="min-w-0 flex-1">
														<div class="flex items-start justify-between">
															<div class="min-w-0">
																<div class="flex items-center gap-2">
																	<h4 class="text-sm font-medium">{deviceInfo.browser}</h4>
																	<span class="text-muted-foreground text-xs">{deviceInfo.os}</span>
																	{#if isCurrentSession}
																		<Badge variant="secondary" class="text-xs">Current</Badge>
																	{/if}
																</div>
																<p class="text-muted-foreground text-xs">
																	Last active: {formatDate(session.updatedAt)}
																</p>
															</div>

															<div class="flex items-center">
																<Button
																	variant="ghost"
																	size="icon"
																	onclick={(e) => {
																		e.preventDefault();
																		e.stopPropagation();
																		toggleSessionDetails(session.id);
																	}}
																>
																	<IconChevronDown
																		class="size-4 transition-transform duration-200 {isExpanded
																			? 'rotate-180'
																			: ''}"
																	/>
																</Button>
															</div>
														</div>

														{#if isExpanded}
															<div class="mt-3 space-y-2 border-t pt-3">
																<div class="grid gap-1 text-xs">
																	<div class="flex justify-between">
																		<span class="text-muted-foreground">Created:</span>
																		<span>{formatDate(session.createdAt)}</span>
																	</div>
																	{#if session.ipAddress}
																		<div class="flex justify-between">
																			<span class="text-muted-foreground">IP Address:</span>
																			<span class="font-mono">{session.ipAddress}</span>
																		</div>
																	{/if}
																	<div class="flex justify-between">
																		<span class="text-muted-foreground">Session ID:</span>
																		<span class="font-mono">{session.id.slice(0, 8)}...</span>
																	</div>
																</div>
																{#if session.userAgent}
																	<div>
																		<Label class="text-muted-foreground text-xs font-medium">
																			User Agent:
																		</Label>
																		<div class="bg-muted mt-1 rounded p-2">
																			<code class="text-muted-foreground text-xs break-all">
																				{session.userAgent}
																			</code>
																		</div>
																	</div>
																{/if}
																{#if !isCurrentSession}
																	<div class="flex justify-end pt-2">
																		<Button
																			variant="destructive"
																			size="sm"
																			onclick={() => revokeSession(session.id, session.token)}
																			disabled={isRevoking}
																		>
																			{#if isRevoking}
																				<IconLoader class="size-4 animate-spin" />
																			{/if}
																			Revoke Session
																		</Button>
																	</div>
																{/if}
															</div>
														{/if}
													</div>
												</div>
											</Card>
										{/each}
									</div>

									<Card class="border-destructive/20 bg-destructive/5 p-3">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2">
												<IconWarning class="text-destructive size-4" />
												<div>
													<h4 class="text-destructive text-sm font-medium">Danger Zone</h4>
													<p class="text-muted-foreground text-xs">
														Revoke all sessions and sign out everywhere
													</p>
												</div>
											</div>
											<AlertDialog>
												<AlertDialogTrigger>
													{#snippet child({ props })}
														<Button
															variant="destructive"
															size="sm"
															disabled={isRevokingAll}
															{...props}
														>
															{#if isRevokingAll}
																<IconLoader class="size-4 animate-spin" />
															{/if}
															Revoke All
														</Button>
													{/snippet}
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
														<AlertDialogDescription>
															This will sign you out of all devices, including this one. You'll need
															to sign in again.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction onclick={revokeAllSessions}>
															Revoke All Sessions
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</Card>
								{/if}
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<h3 class="text-destructive text-lg font-semibold">Danger Zone</h3>

			<div class="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium">Delete Account</p>
						<p class="text-muted-foreground text-xs">Permanently delete your account and data</p>
					</div>
					<Dialog
						onOpenChange={() => {
							deleteConfirmationText = '';
							isDeleting = false;
						}}
						bind:open={deleteDialogOpen}
					>
						<DialogTrigger>
							{#snippet child({ props })}
								<Button variant="destructive" size="sm" {...props}>Delete Account</Button>
							{/snippet}
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle class="text-destructive">Delete Account</DialogTitle>
								<DialogDescription class="space-y-2">
									<p>
										This action cannot be undone. This will permanently delete your account and
										remove all of your data from our servers.
									</p>
									<p>
										To confirm, type <strong class="font-mono">{requiredDeleteText}</strong> in the box
										below:
									</p>
								</DialogDescription>
							</DialogHeader>

							<div class="space-y-4">
								<div class="space-y-2">
									<Label for="delete-confirmation">Confirmation</Label>
									<Input
										id="delete-confirmation"
										bind:value={deleteConfirmationText}
										placeholder={requiredDeleteText}
										class="font-mono"
										disabled={isDeleting}
										autocomplete="off"
										spellcheck="false"
									/>
								</div>
							</div>

							<DialogFooter class="flex-col space-y-2">
								<Button
									variant="outline"
									onclick={() => (deleteDialogOpen = false)}
									disabled={isDeleting}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onclick={handleDeleteAccount}
									disabled={deleteConfirmationText !== requiredDeleteText || isDeleting}
								>
									{isDeleting ? 'Deleting...' : 'Delete Account'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	</main>
</div>
