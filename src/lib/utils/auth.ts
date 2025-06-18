export function getDeviceInfo(userAgent: string = '') {
	const ua = userAgent.toLowerCase();

	let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
	let browser = 'Unknown';
	let os = 'Unknown';

	if (ua.includes('ipad') || (ua.includes('macintosh') && ua.includes('touch'))) {
		deviceType = 'tablet';
	} else if (
		ua.includes('mobile') ||
		ua.includes('android') ||
		ua.includes('iphone') ||
		ua.includes('ipod') ||
		ua.includes('blackberry') ||
		ua.includes('windows phone')
	) {
		deviceType = 'mobile';
	} else if (ua.includes('tablet')) {
		deviceType = 'tablet';
	}

	if (ua.includes('edg/')) browser = 'Edge';
	else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
	else if (ua.includes('firefox/')) browser = 'Firefox';
	else if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('edg/'))
		browser = 'Safari';
	else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

	if (ua.includes('windows nt')) {
		os = 'Windows';
	} else if (ua.includes('macintosh') || ua.includes('mac os x')) {
		os = 'macOS';
	} else if (ua.includes('iphone') || ua.includes('ipod')) {
		os = 'iOS';
	} else if (ua.includes('ipad')) {
		os = 'iPadOS';
	} else if (ua.includes('android')) {
		os = 'Android';
	} else if (ua.includes('linux')) {
		os = 'Linux';
	} else if (ua.includes('x11')) {
		os = 'Unix';
	}

	return { deviceType, browser, os };
}
