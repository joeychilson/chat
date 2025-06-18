import type { ThemeRegistrationResolved } from 'shiki';

const lightTheme: ThemeRegistrationResolved = {
	type: 'light',
	name: 'light',
	displayName: 'Light Theme',
	fg: '#393a34',
	bg: '#ffffff',
	semanticHighlighting: true,
	semanticTokenColors: {
		class: '#5a6aa6',
		interface: '#2e808f',
		namespace: '#b05a78',
		property: '#998418',
		type: '#2e808f'
	},
	settings: [
		{
			scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
			settings: {
				foreground: '#6e7781'
			}
		},
		{
			scope: [
				'delimiter.bracket',
				'delimiter',
				'invalid.illegal.character-not-allowed-here.html',
				'keyword.operator.rest',
				'keyword.operator.spread',
				'keyword.operator.type.annotation',
				'keyword.operator.relational',
				'keyword.operator.assignment',
				'keyword.operator.type',
				'meta.brace',
				'meta.tag.block.any.html',
				'meta.tag.inline.any.html',
				'meta.tag.structure.input.void.html',
				'meta.type.annotation',
				'meta.embedded.block.github-actions-expression',
				'storage.type.function.arrow',
				'meta.objectliteral.ts',
				'punctuation',
				'punctuation.definition.string.begin.html.vue',
				'punctuation.definition.string.end.html.vue'
			],
			settings: {
				foreground: '#57606a'
			}
		},
		{
			scope: ['constant', 'entity.name.constant', 'variable.language', 'meta.definition.variable'],
			settings: {
				foreground: '#a65e2b'
			}
		},
		{
			scope: ['entity', 'entity.name'],
			settings: {
				foreground: '#59873a'
			}
		},
		{
			scope: 'variable.parameter.function',
			settings: {
				foreground: '#393a34'
			}
		},
		{
			scope: ['entity.name.tag', 'tag.html'],
			settings: {
				foreground: '#1e754f'
			}
		},
		{
			scope: 'entity.name.function',
			settings: {
				foreground: '#59873a'
			}
		},
		{
			scope: ['keyword', 'storage.type.class.jsdoc', 'punctuation.definition.template-expression'],
			settings: {
				foreground: '#1e754f'
			}
		},
		{
			scope: [
				'storage',
				'storage.type',
				'support.type.builtin',
				'constant.language.undefined',
				'constant.language.null',
				'constant.language.import-export-all.ts'
			],
			settings: {
				foreground: '#ab5959'
			}
		},
		{
			scope: [
				'text.html.derivative',
				'storage.modifier.package',
				'storage.modifier.import',
				'storage.type.java'
			],
			settings: {
				foreground: '#393a34'
			}
		},
		{
			scope: ['string', 'string punctuation.section.embedded source', 'attribute.value'],
			settings: {
				foreground: '#b56959'
			}
		},
		{
			scope: ['punctuation.definition.string'],
			settings: {
				foreground: '#b56959'
			}
		},
		{
			scope: ['punctuation.support.type.property-name'],
			settings: {
				foreground: '#998418'
			}
		},
		{
			scope: 'support',
			settings: {
				foreground: '#998418'
			}
		},
		{
			scope: [
				'property',
				'meta.property-name',
				'meta.object-literal.key',
				'entity.name.tag.yaml',
				'attribute.name'
			],
			settings: {
				foreground: '#998418'
			}
		},
		{
			scope: ['entity.other.attribute-name', 'invalid.deprecated.entity.other.attribute-name.html'],
			settings: {
				foreground: '#b07d48'
			}
		},
		{
			scope: ['variable', 'identifier'],
			settings: {
				foreground: '#b07d48'
			}
		},
		{
			scope: ['support.type.primitive', 'entity.name.type'],
			settings: {
				foreground: '#2e8f82'
			}
		},
		{
			scope: 'namespace',
			settings: {
				foreground: '#b05a78'
			}
		},
		{
			scope: ['keyword.operator', 'keyword.operator.assignment.compound', 'meta.var.expr.ts'],
			settings: {
				foreground: '#ab5959'
			}
		},
		{
			scope: 'invalid.broken',
			settings: {
				fontStyle: 'italic',
				foreground: '#b31d28'
			}
		},
		{
			scope: 'invalid.deprecated',
			settings: {
				fontStyle: 'italic',
				foreground: '#b31d28'
			}
		},
		{
			scope: 'invalid.illegal',
			settings: {
				fontStyle: 'italic',
				foreground: '#b31d28'
			}
		},
		{
			scope: 'invalid.unimplemented',
			settings: {
				fontStyle: 'italic',
				foreground: '#b31d28'
			}
		},
		{
			scope: 'carriage-return',
			settings: {
				background: '#d73a49',
				fontStyle: 'italic underline',
				foreground: '#fafbfc'
			}
		},
		{
			scope: 'message.error',
			settings: {
				foreground: '#b31d28'
			}
		},
		{
			scope: 'string variable',
			settings: {
				foreground: '#b56959'
			}
		},
		{
			scope: ['source.regexp', 'string.regexp'],
			settings: {
				foreground: '#ab5e3f'
			}
		},
		{
			scope: [
				'string.regexp.character-class',
				'string.regexp constant.character.escape',
				'string.regexp source.ruby.embedded',
				'string.regexp string.regexp.arbitrary-repitition'
			],
			settings: {
				foreground: '#b56959'
			}
		},
		{
			scope: 'string.regexp constant.character.escape',
			settings: {
				foreground: '#bda437'
			}
		},
		{
			scope: ['support.constant'],
			settings: {
				foreground: '#a65e2b'
			}
		},
		{
			scope: ['keyword.operator.quantifier.regexp', 'constant.numeric', 'number'],
			settings: {
				foreground: '#2f798a'
			}
		},
		{
			scope: ['keyword.other.unit'],
			settings: {
				foreground: '#ab5959'
			}
		},
		{
			scope: ['constant.language.boolean', 'constant.language'],
			settings: {
				foreground: '#1e754f'
			}
		},
		{
			scope: 'meta.module-reference',
			settings: {
				foreground: '#1c6b48'
			}
		},
		{
			scope: 'punctuation.definition.list.begin.markdown',
			settings: {
				foreground: '#a65e2b'
			}
		},
		{
			scope: ['markup.heading', 'markup.heading entity.name'],
			settings: {
				fontStyle: 'bold',
				foreground: '#1c6b48'
			}
		},
		{
			scope: 'markup.quote',
			settings: {
				foreground: '#2e808f'
			}
		},
		{
			scope: 'markup.italic',
			settings: {
				fontStyle: 'italic',
				foreground: '#393a34'
			}
		},
		{
			scope: 'markup.bold',
			settings: {
				fontStyle: 'bold',
				foreground: '#393a34'
			}
		},
		{
			scope: 'markup.raw',
			settings: {
				foreground: '#1c6b48'
			}
		},
		{
			scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
			settings: {
				background: '#ffeef0',
				foreground: '#b31d28'
			}
		},
		{
			scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
			settings: {
				background: '#f0fff4',
				foreground: '#22863a'
			}
		},
		{
			scope: ['markup.changed', 'punctuation.definition.changed'],
			settings: {
				background: '#ffebda',
				foreground: '#e36209'
			}
		},
		{
			scope: ['markup.ignored', 'markup.untracked'],
			settings: {
				background: '#005cc5',
				foreground: '#f6f8fa'
			}
		},
		{
			scope: 'meta.diff.range',
			settings: {
				fontStyle: 'bold',
				foreground: '#6f42c1'
			}
		},
		{
			scope: 'meta.diff.header',
			settings: {
				foreground: '#005cc5'
			}
		},
		{
			scope: 'meta.separator',
			settings: {
				fontStyle: 'bold',
				foreground: '#005cc5'
			}
		},
		{
			scope: 'meta.output',
			settings: {
				foreground: '#005cc5'
			}
		},
		{
			scope: [
				'brackethighlighter.tag',
				'brackethighlighter.curly',
				'brackethighlighter.round',
				'brackethighlighter.square',
				'brackethighlighter.angle',
				'brackethighlighter.quote'
			],
			settings: {
				foreground: '#586069'
			}
		},
		{
			scope: 'brackethighlighter.unmatched',
			settings: {
				foreground: '#b31d28'
			}
		},
		{
			scope: [
				'constant.other.reference.link',
				'string.other.link',
				'punctuation.definition.string.begin.markdown',
				'punctuation.definition.string.end.markdown'
			],
			settings: {
				foreground: '#b56959'
			}
		},
		{
			scope: ['markup.underline.link.markdown', 'markup.underline.link.image.markdown'],
			settings: {
				fontStyle: 'underline',
				foreground: '#393a3490'
			}
		},
		{
			scope: ['type.identifier', 'constant.other.character-class.regexp'],
			settings: {
				foreground: '#5a6aa6'
			}
		},
		{
			scope: ['entity.other.attribute-name.html.vue'],
			settings: {
				foreground: '#59873a'
			}
		},
		{
			scope: ['invalid.illegal.unrecognized-tag.html'],
			settings: {
				fontStyle: 'normal'
			}
		}
	]
};

export default lightTheme;
