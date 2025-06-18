export function formatDate(dateString: string | Date) {
	if (!dateString) return 'Unknown';

	const date = new Date(dateString);

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatDuration(durationMs: number): string {
	if (durationMs < 1000) {
		return `${Math.round(durationMs)}ms`;
	}

	const seconds = durationMs / 1000;

	if (seconds < 60) {
		return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);

	if (minutes < 60) {
		return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function timeAgo(timestamp: string | Date): string {
	const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
	const now = new Date();
	const diffSeconds = (date.getTime() - now.getTime()) / 1000;
	const absSeconds = Math.abs(diffSeconds);

	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

	if (absSeconds < 60) return rtf.format(Math.round(diffSeconds), 'second');
	if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
	if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
	if (absSeconds < 2628000) return rtf.format(Math.round(diffSeconds / 86400), 'day');
	if (absSeconds < 31536000) return rtf.format(Math.round(diffSeconds / 2628000), 'month');

	return rtf.format(Math.round(diffSeconds / 31536000), 'year');
}

export function formatTime(seconds: number): string {
	if (!seconds || isNaN(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getToday() {
	return new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}
