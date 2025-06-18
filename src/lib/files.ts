import IconPhoto from '~icons/tabler/photo';
import IconMusic from '~icons/tabler/music';
import IconVideo from '~icons/tabler/video';
import IconFileText from '~icons/tabler/file-text';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/heic',
	'image/heif'
] as const;
export const DOCUMENT_TYPES = [
	'application/pdf',
	'text/plain',
	'text/markdown',
	'text/csv',
	'text/xml'
] as const;
export const AUDIO_TYPES = [
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/aiff',
	'audio/aac',
	'audio/flac'
] as const;
export const VIDEO_TYPES = [
	'video/mp4',
	'video/webm',
	'video/mov',
	'video/avi',
	'video/x-flv',
	'video/mpg',
	'video/wmv',
	'video/3gpp'
] as const;
export const CODE_TYPES = [
	'text/javascript',
	'text/typescript',
	'text/python',
	'text/html',
	'text/css',
	'text/json'
] as const;

export const ALLOWED_FILE_TYPES = [
	...IMAGE_TYPES,
	...DOCUMENT_TYPES,
	...AUDIO_TYPES,
	...VIDEO_TYPES,
	...CODE_TYPES
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export interface File {
	id: string;
	name: string;
	mediaType: AllowedFileType;
	url: string;
	createdAt?: Date;
}

const FILE_TYPE_MAP: Record<
	AllowedFileType,
	{
		extension: string;
		friendlyName: string;
		category: 'image' | 'document' | 'audio' | 'video' | 'code';
	}
> = {
	'image/jpeg': { extension: '.jpg', friendlyName: 'JPEG', category: 'image' },
	'image/png': { extension: '.png', friendlyName: 'PNG', category: 'image' },
	'image/gif': { extension: '.gif', friendlyName: 'GIF', category: 'image' },
	'image/webp': { extension: '.webp', friendlyName: 'WebP', category: 'image' },
	'image/heic': { extension: '.heic', friendlyName: 'HEIC', category: 'image' },
	'image/heif': { extension: '.heif', friendlyName: 'HEIF', category: 'image' },
	'application/pdf': { extension: '.pdf', friendlyName: 'PDF', category: 'document' },
	'text/plain': { extension: '.txt', friendlyName: 'Text', category: 'document' },
	'text/markdown': { extension: '.md', friendlyName: 'Markdown', category: 'document' },
	'text/csv': { extension: '.csv', friendlyName: 'CSV', category: 'document' },
	'text/xml': { extension: '.xml', friendlyName: 'XML', category: 'document' },
	'audio/mpeg': { extension: '.mp3', friendlyName: 'MP3', category: 'audio' },
	'audio/wav': { extension: '.wav', friendlyName: 'WAV', category: 'audio' },
	'audio/ogg': { extension: '.ogg', friendlyName: 'OGG', category: 'audio' },
	'audio/aiff': { extension: '.aiff', friendlyName: 'AIFF', category: 'audio' },
	'audio/aac': { extension: '.aac', friendlyName: 'AAC', category: 'audio' },
	'audio/flac': { extension: '.flac', friendlyName: 'FLAC', category: 'audio' },
	'video/mp4': { extension: '.mp4', friendlyName: 'MP4', category: 'video' },
	'video/webm': { extension: '.webm', friendlyName: 'WebM', category: 'video' },
	'video/mov': { extension: '.mov', friendlyName: 'MOV', category: 'video' },
	'video/avi': { extension: '.avi', friendlyName: 'AVI', category: 'video' },
	'video/x-flv': { extension: '.flv', friendlyName: 'FLV', category: 'video' },
	'video/mpg': { extension: '.mpg', friendlyName: 'MPG', category: 'video' },
	'video/wmv': { extension: '.wmv', friendlyName: 'WMV', category: 'video' },
	'video/3gpp': { extension: '.3gp', friendlyName: '3GP', category: 'video' },
	'text/javascript': { extension: '.js', friendlyName: 'JavaScript', category: 'code' },
	'text/typescript': { extension: '.ts', friendlyName: 'TypeScript', category: 'code' },
	'text/html': { extension: '.html', friendlyName: 'HTML', category: 'code' },
	'text/css': { extension: '.css', friendlyName: 'CSS', category: 'code' },
	'text/json': { extension: '.json', friendlyName: 'JSON', category: 'code' },
	'text/python': { extension: '.py', friendlyName: 'Python', category: 'code' }
};

const EXTENSION_TO_MIME_MAP = Object.fromEntries(
	Object.entries(FILE_TYPE_MAP).flatMap(([mimeType, { extension }]) => [
		[extension, mimeType as AllowedFileType],
		...(extension === '.jpg' ? [['.jpeg', mimeType as AllowedFileType]] : []),
		...(extension === '.md' ? [['.markdown', mimeType as AllowedFileType]] : [])
	])
);

export const ACCEPTED_FILE_EXTENSIONS = Object.keys(EXTENSION_TO_MIME_MAP) as readonly string[];

export function isAllowedFileType(mediaType: string): mediaType is AllowedFileType {
	const baseMimeType = mediaType.split(';')[0].trim();
	return ALLOWED_FILE_TYPES.includes(baseMimeType as AllowedFileType);
}

export function isFileAllowed(file: globalThis.File): {
	allowed: boolean;
	detectedType?: AllowedFileType;
} {
	const baseMimeType = file.type.split(';')[0].trim();

	if (isAllowedFileType(baseMimeType)) {
		return { allowed: true, detectedType: baseMimeType };
	}

	const fileName = file.name.toLowerCase();
	for (const [extension, mimeType] of Object.entries(EXTENSION_TO_MIME_MAP)) {
		if (fileName.endsWith(extension)) {
			return { allowed: true, detectedType: mimeType as AllowedFileType };
		}
	}

	return { allowed: false };
}

export function getFileTypeCategory(
	mediaType: AllowedFileType
): 'image' | 'document' | 'audio' | 'video' | 'code' {
	const fileInfo = FILE_TYPE_MAP[mediaType];
	if (!fileInfo) {
		throw new Error(`Unknown file type category for: ${mediaType}`);
	}
	return fileInfo.category;
}

export function getExtensionFromMediaType(mediaType: string): string {
	const normalizedType = mediaType.split(';')[0].trim();
	if (!isAllowedFileType(normalizedType)) {
		return '';
	}
	return FILE_TYPE_MAP[normalizedType]?.extension || '';
}

export function getAcceptStringForMediaTypes(mediaTypes: readonly AllowedFileType[]): string {
	const extensions: string[] = [];

	for (const mediaType of mediaTypes) {
		const fileInfo = FILE_TYPE_MAP[mediaType];
		if (fileInfo) {
			extensions.push(fileInfo.extension);
			if (fileInfo.extension === '.jpg') extensions.push('.jpeg');
			if (fileInfo.extension === '.md') extensions.push('.markdown');
		}
	}

	return extensions.join(',');
}

export function getFriendlyMediaType(mediaType: string): string {
	const normalizedType = mediaType.split(';')[0].trim();
	if (!isAllowedFileType(normalizedType)) {
		return normalizedType;
	}
	return FILE_TYPE_MAP[normalizedType]?.friendlyName || normalizedType;
}

export function getMediaIcon(mediaType: string) {
	const normalizedType = mediaType.split(';')[0].trim();
	if (!isAllowedFileType(normalizedType)) {
		return IconFileText;
	}

	const category = getFileTypeCategory(normalizedType);
	switch (category) {
		case 'image':
			return IconPhoto;
		case 'audio':
			return IconMusic;
		case 'video':
			return IconVideo;
		default:
			return IconFileText;
	}
}

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const getFileExtension = (language: string): string => {
	const langMap: Record<string, string> = {
		abap: '.abap',
		'actionscript-3': '.as',
		ada: '.ada',
		'angular-html': '.html',
		'angular-ts': '.ts',
		apache: '.conf',
		apex: '.apex',
		apl: '.apl',
		applescript: '.applescript',
		ara: '.ara',
		asciidoc: '.adoc',
		adoc: '.adoc',
		asm: '.asm',
		astro: '.astro',
		awk: '.awk',
		ballerina: '.bal',
		bat: '.bat',
		batch: '.bat',
		beancount: '.beancount',
		berry: '.be',
		be: '.be',
		bibtex: '.bib',
		bicep: '.bicep',
		blade: '.blade.php',
		bsl: '.bsl',
		'1c': '.bsl',
		c: '.c',
		cadence: '.cdc',
		cdc: '.cdc',
		cairo: '.cairo',
		clarity: '.clar',
		clojure: '.clj',
		clj: '.clj',
		cmake: '.cmake',
		cobol: '.cob',
		codeowners: 'CODEOWNERS',
		codeql: '.ql',
		ql: '.ql',
		coffee: '.coffee',
		coffeescript: '.coffee',
		'common-lisp': '.lisp',
		lisp: '.lisp',
		coq: '.coq',
		cpp: '.cpp',
		'c++': '.cpp',
		crystal: '.cr',
		csharp: '.cs',
		'c#': '.cs',
		cs: '.cs',
		css: '.css',
		csv: '.csv',
		cue: '.cue',
		cypher: '.cypher',
		cql: '.cql',
		d: '.d',
		dart: '.dart',
		dax: '.dax',
		desktop: '.desktop',
		diff: '.diff',
		docker: 'Dockerfile',
		dockerfile: 'Dockerfile',
		dotenv: '.env',
		'dream-maker': '.dm',
		edge: '.edge',
		elixir: '.ex',
		elm: '.elm',
		'emacs-lisp': '.el',
		elisp: '.el',
		erb: '.erb',
		erlang: '.erl',
		erl: '.erl',
		fennel: '.fnl',
		fish: '.fish',
		fluent: '.ftl',
		ftl: '.ftl',
		'fortran-fixed-form': '.f',
		f: '.f',
		for: '.for',
		f77: '.f77',
		'fortran-free-form': '.f90',
		f90: '.f90',
		f95: '.f95',
		f03: '.f03',
		f08: '.f08',
		f18: '.f18',
		fsharp: '.fs',
		'f#': '.fs',
		fs: '.fs',
		gdresource: '.tres',
		gdscript: '.gd',
		gdshader: '.gdshader',
		genie: '.gs',
		gherkin: '.feature',
		'git-commit': '.gitcommit',
		'git-rebase': '.gitrebase',
		gleam: '.gleam',
		'glimmer-js': '.gjs',
		gjs: '.gjs',
		'glimmer-ts': '.gts',
		gts: '.gts',
		glsl: '.glsl',
		gnuplot: '.gp',
		go: '.go',
		graphql: '.graphql',
		gql: '.gql',
		groovy: '.groovy',
		hack: '.hack',
		haml: '.haml',
		handlebars: '.hbs',
		hbs: '.hbs',
		haskell: '.hs',
		hs: '.hs',
		haxe: '.hx',
		hcl: '.hcl',
		hjson: '.hjson',
		hlsl: '.hlsl',
		html: '.html',
		'html-derivative': '.html',
		http: '.http',
		hxml: '.hxml',
		hy: '.hy',
		imba: '.imba',
		ini: '.ini',
		properties: '.properties',
		java: '.java',
		javascript: '.js',
		js: '.js',
		jinja: '.jinja',
		jison: '.jison',
		json: '.json',
		json5: '.json5',
		jsonc: '.jsonc',
		jsonl: '.jsonl',
		jsonnet: '.jsonnet',
		jssm: '.jssm',
		fsl: '.fsl',
		jsx: '.jsx',
		julia: '.jl',
		jl: '.jl',
		kotlin: '.kt',
		kt: '.kt',
		kts: '.kts',
		kusto: '.kql',
		kql: '.kql',
		latex: '.tex',
		lean: '.lean',
		lean4: '.lean',
		less: '.less',
		liquid: '.liquid',
		llvm: '.ll',
		log: '.log',
		logo: '.logo',
		lua: '.lua',
		luau: '.luau',
		make: 'Makefile',
		makefile: 'Makefile',
		markdown: '.md',
		md: '.md',
		marko: '.marko',
		matlab: '.m',
		mdc: '.mdc',
		mdx: '.mdx',
		mermaid: '.mmd',
		mmd: '.mmd',
		mipsasm: '.s',
		mips: '.s',
		mojo: '.mojo',
		move: '.move',
		narrat: '.nar',
		nar: '.nar',
		nextflow: '.nf',
		nf: '.nf',
		nginx: '.conf',
		nim: '.nim',
		nix: '.nix',
		nushell: '.nu',
		nu: '.nu',
		'objective-c': '.m',
		objc: '.m',
		'objective-cpp': '.mm',
		ocaml: '.ml',
		pascal: '.pas',
		perl: '.pl',
		php: '.php',
		plsql: '.sql',
		po: '.po',
		pot: '.pot',
		potx: '.potx',
		polar: '.polar',
		postcss: '.pcss',
		powerquery: '.pq',
		powershell: '.ps1',
		ps: '.ps1',
		ps1: '.ps1',
		prisma: '.prisma',
		prolog: '.pl',
		proto: '.proto',
		protobuf: '.proto',
		pug: '.pug',
		jade: '.jade',
		puppet: '.pp',
		purescript: '.purs',
		python: '.py',
		py: '.py',
		qml: '.qml',
		qmldir: '.qmldir',
		qss: '.qss',
		r: '.r',
		racket: '.rkt',
		raku: '.raku',
		perl6: '.p6',
		razor: '.razor',
		reg: '.reg',
		regexp: '.regex',
		regex: '.regex',
		rel: '.rel',
		riscv: '.s',
		rst: '.rst',
		ruby: '.rb',
		rb: '.rb',
		rust: '.rs',
		rs: '.rs',
		sas: '.sas',
		sass: '.sass',
		scala: '.scala',
		scheme: '.scm',
		scss: '.scss',
		sdbl: '.sdbl',
		'1c-query': '.sdbl',
		shaderlab: '.shader',
		shader: '.shader',
		shellscript: '.sh',
		bash: '.sh',
		sh: '.sh',
		shell: '.sh',
		zsh: '.zsh',
		shellsession: '.sh',
		console: '.sh',
		smalltalk: '.st',
		solidity: '.sol',
		soy: '.soy',
		'closure-templates': '.soy',
		sparql: '.sparql',
		splunk: '.spl',
		spl: '.spl',
		sql: '.sql',
		'ssh-config': '.config',
		stata: '.do',
		stylus: '.styl',
		styl: '.styl',
		svelte: '.svelte',
		swift: '.swift',
		'system-verilog': '.sv',
		systemd: '.service',
		talonscript: '.talon',
		talon: '.talon',
		tasl: '.tasl',
		tcl: '.tcl',
		templ: '.templ',
		terraform: '.tf',
		tf: '.tf',
		tfvars: '.tfvars',
		tex: '.tex',
		toml: '.toml',
		'ts-tags': '.ts',
		lit: '.ts',
		tsv: '.tsv',
		tsx: '.tsx',
		turtle: '.ttl',
		twig: '.twig',
		typescript: '.ts',
		ts: '.ts',
		typespec: '.tsp',
		tsp: '.tsp',
		typst: '.typ',
		typ: '.typ',
		v: '.v',
		vala: '.vala',
		vb: '.vb',
		cmd: '.cmd',
		verilog: '.v',
		vhdl: '.vhdl',
		viml: '.vim',
		vim: '.vim',
		vimscript: '.vim',
		vue: '.vue',
		'vue-html': '.vue',
		vyper: '.vy',
		vy: '.vy',
		wasm: '.wasm',
		wenyan: '.wy',
		文言: '.wy',
		wgsl: '.wgsl',
		wikitext: '.wiki',
		mediawiki: '.wiki',
		wiki: '.wiki',
		wit: '.wit',
		wolfram: '.wl',
		wl: '.wl',
		xml: '.xml',
		xsl: '.xsl',
		yaml: '.yaml',
		yml: '.yml',
		zenscript: '.zs',
		zig: '.zig'
	};
	return langMap[language.toLowerCase()] || '.txt';
};
