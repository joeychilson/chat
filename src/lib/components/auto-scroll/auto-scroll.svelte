<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		items: unknown[];
		isStreaming?: boolean;
		scrollThreshold?: number;
		mutationDelay?: number;
		onScrollButtonVisibilityChange?: (visible: boolean) => void;
		class?: string;
		role?: string;
		'aria-label'?: string;
		children: Snippet;
	}

	let {
		items,
		isStreaming = false,
		scrollThreshold = 100,
		mutationDelay = 350,
		onScrollButtonVisibilityChange,
		class: className = '',
		role,
		'aria-label': ariaLabel,
		children
	}: Props = $props();

	let scrollContainer: HTMLElement;
	let isUserScrolledUp = $state(false);
	let previousItemCount = $state(items.length);

	function checkScrollNeeded() {
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const isScrollNeeded = scrollHeight > clientHeight;
		const isScrolledUp = scrollHeight - scrollTop - clientHeight > scrollThreshold;

		isUserScrolledUp = isScrolledUp;
		const showScrollButton = isScrollNeeded && isScrolledUp;

		onScrollButtonVisibilityChange?.(showScrollButton);
	}

	function scrollToBottom() {
		if (!scrollContainer) return;
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function autoScroll(element: HTMLElement): { destroy(): void } {
		scrollContainer = element;

		function handleScroll() {
			checkScrollNeeded();
		}

		element.addEventListener('scroll', handleScroll);

		const observer = new MutationObserver(() => {
			requestAnimationFrame(checkScrollNeeded);

			setTimeout(() => {
				requestAnimationFrame(checkScrollNeeded);
			}, mutationDelay);
		});

		observer.observe(element, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ['style', 'class']
		});

		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(checkScrollNeeded);
		});

		resizeObserver.observe(element);

		scrollToBottom();

		return {
			destroy() {
				element.removeEventListener('scroll', handleScroll);
				observer.disconnect();
				resizeObserver.disconnect();
			}
		};
	}

	$effect(() => {
		if (!scrollContainer) return;

		const currentItemCount = items.length;
		const lastItem = items[items.length - 1];

		const shouldAutoScroll = currentItemCount > previousItemCount || (isStreaming && lastItem);

		if (shouldAutoScroll && !isUserScrolledUp) {
			requestAnimationFrame(scrollToBottom);
		}

		previousItemCount = currentItemCount;
		requestAnimationFrame(checkScrollNeeded);
	});

	export function scrollToBottomManually() {
		scrollToBottom();
	}
</script>

<div class={className} {role} aria-label={ariaLabel} use:autoScroll>
	{@render children()}
</div>
