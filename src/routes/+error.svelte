<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import IconHome from '~icons/tabler/home';

	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="max-w-3xl">
		<p class="text-muted-foreground mb-2 text-sm font-medium">Error {page.status}</p>
		<h1 class="mb-6 text-2xl font-semibold">{page.error?.message || 'Something went wrong'}</h1>

		<div class="flex gap-3">
			<Button onclick={() => goto('/')} class="h-9">
				<IconHome class="size-4" />
				Home
			</Button>
		</div>
	</div>
</div>
