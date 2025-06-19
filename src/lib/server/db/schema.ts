import type { UIMessage } from 'ai';
import { relations, sql } from 'drizzle-orm';
import {
	type AnyPgColumn,
	pgTable,
	timestamp,
	uuid,
	index,
	boolean,
	text,
	uniqueIndex,
	jsonb,
	pgEnum,
	varchar,
	integer
} from 'drizzle-orm/pg-core';

import type { MessageMetadata } from '$lib/messages';
import type { Model } from '$lib/models';
import type { CreationMetadata } from '$lib/creations';

export const usersTable = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		email: text('email').notNull().unique(),
		emailVerified: boolean('email_verified').default(false).notNull(),
		image: text('image'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('idx_user_email').on(table.email)]
);

export const usersRelations = relations(usersTable, ({ many, one }) => ({
	accounts: many(accountsTable),
	sessions: many(sessionsTable),
	verifications: many(verificationsTable),
	settings: one(settingsTable)
}));

export const accountsTable = pgTable(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		providerId: text('provider_id').notNull(),
		accountId: text('account_id').notNull(),
		scope: text('scope'),
		idToken: text('id_token'),
		password: text('password'),
		accessToken: text('access_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshToken: text('refresh_token'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},

	(table) => [
		index('idx_account_user_id').on(table.userId),
		uniqueIndex('uq_account_provider_account').on(table.providerId, table.accountId)
	]
);

export const accountsRelations = relations(accountsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [accountsTable.userId],
		references: [usersTable.id]
	})
}));

export const sessionsTable = pgTable(
	'sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		token: text('token').notNull().unique(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_session_user_id').on(table.userId),
		index('idx_session_token').on(table.token),
		index('idx_session_expires_at').on(table.expiresAt)
	]
);

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [sessionsTable.userId],
		references: [usersTable.id]
	})
}));

export const verificationsTable = pgTable(
	'verifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},

	(table) => [
		index('idx_verification_identifier').on(table.identifier),
		index('idx_verification_expires_at').on(table.expiresAt)
	]
);

export const verificationsRelations = relations(verificationsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [verificationsTable.identifier],
		references: [usersTable.email]
	})
}));

export const settingsTable = pgTable(
	'settings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.unique()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		defaultModel: jsonb('default_model').$type<Model>(),
		defaultSpeechVoice: varchar('default_speech_voice', { length: 50 }).default('alloy'),
		defaultSpeechSpeed: varchar('default_speech_speed', { length: 10 }).default('1.0'),
		preferredName: varchar('preferred_name', { length: 50 }),
		userRole: varchar('user_role', { length: 100 }),
		assistantTraits: jsonb('assistant_traits').$type<string[]>().default([]),
		additionalContext: text('additional_context'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_settings_user_id').on(table.userId),
		uniqueIndex('uq_settings_user_id').on(table.userId)
	]
);

export const settingsRelations = relations(settingsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [settingsTable.userId],
		references: [usersTable.id]
	})
}));

export type Settings = typeof settingsTable.$inferSelect;
export type SettingsInsert = typeof settingsTable.$inferInsert;

export const chatsTable = pgTable(
	'chats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => usersTable.id, { onDelete: 'cascade' })
			.notNull(),
		branchedMessageId: uuid('branched_message_id').references((): AnyPgColumn => messagesTable.id, {
			onDelete: 'set null'
		}),
		streamId: uuid('stream_id').default(sql`null`),
		title: varchar('title', { length: 255 }).notNull().default('Untitled Chat'),
		pinned: boolean('pinned').notNull().default(false),
		lastModelUsed: jsonb('last_model_used').$type<Model>(),
		lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('idx_chat_user_id').on(table.userId),
		index('idx_chat_stream_id').on(table.streamId),
		index('idx_chat_branched_message_id').on(table.branchedMessageId),
		index('idx_chat_last_message_at').on(table.lastMessageAt),
		index('idx_chat_user_last_message').on(table.userId, table.lastMessageAt),
		index('idx_chat_pinned')
			.on(table.pinned)
			.where(sql`pinned = true`)
	]
);

export type Chat = typeof chatsTable.$inferSelect;

export const chatsRelations = relations(chatsTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [chatsTable.userId],
		references: [usersTable.id]
	}),
	messages: many(messagesTable, {
		relationName: 'chatMessages'
	}),
	branchedMessage: one(messagesTable, {
		fields: [chatsTable.branchedMessageId],
		references: [messagesTable.id],
		relationName: 'messageBranchedChats'
	})
}));

export const role = pgEnum('role', ['user', 'assistant', 'system']);

export const messagesTable = pgTable(
	'messages',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		chatId: uuid('chat_id')
			.references(() => chatsTable.id, { onDelete: 'cascade' })
			.notNull(),
		role: role('role').notNull(),
		parts: jsonb('parts').$type<UIMessage['parts']>().notNull().default([]),
		metadata: jsonb('metadata').$type<MessageMetadata>().notNull().default({}),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_message_chat_id').on(table.chatId),
		index('idx_message_chat_created').on(table.chatId, table.createdAt)
	]
);

export type NewMessage = typeof messagesTable.$inferInsert;

export const messagesRelations = relations(messagesTable, ({ one, many }) => ({
	chat: one(chatsTable, {
		fields: [messagesTable.chatId],
		references: [chatsTable.id],
		relationName: 'chatMessages'
	}),
	branchedChats: many(chatsTable, {
		relationName: 'messageBranchedChats'
	})
}));

export const filesTable = pgTable(
	'files',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => usersTable.id, { onDelete: 'cascade' })
			.notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		mediaType: varchar('media_type', { length: 255 }).notNull(),
		size: integer('size').notNull(),
		path: varchar('path', { length: 1024 }).notNull().unique(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_file_user_id').on(table.userId),
		uniqueIndex('uq_file_path').on(table.path)
	]
);

export const filesRelations = relations(filesTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [filesTable.userId],
		references: [usersTable.id]
	}),
	creations: many(creationsTable, {
		relationName: 'fileCreation'
	})
}));

export const creationType = pgEnum('creation_type', ['image', 'video', 'audio', 'document']);

export const creationsTable = pgTable(
	'creations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => usersTable.id, { onDelete: 'cascade' })
			.notNull(),
		fileId: uuid('file_id')
			.references(() => filesTable.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),
		type: creationType('type').notNull(),
		title: varchar('title', { length: 255 }).notNull().default('Untitled Creation'),
		metadata: jsonb('metadata').$type<CreationMetadata>().notNull().default({}),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_creation_user_id').on(table.userId),
		index('idx_creation_type').on(table.type),
		index('idx_creation_created_at').on(table.createdAt)
	]
);

export const creationsRelations = relations(creationsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [creationsTable.userId],
		references: [usersTable.id]
	}),
	file: one(filesTable, {
		fields: [creationsTable.fileId],
		references: [filesTable.id],
		relationName: 'fileCreation'
	})
}));
