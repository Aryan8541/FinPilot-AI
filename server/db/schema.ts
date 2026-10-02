import * as sqliteSchema from "./schema.sqlite";
import * as postgresSchema from "./schema.postgres";

const isPostgres = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");

// Keep one import surface for routers while selecting the matching Drizzle tables at runtime.
const activeSchema = isPostgres ? postgresSchema : sqliteSchema;

export const accountTypeValues = activeSchema.accountTypeValues;
export const categoryTypeValues = activeSchema.categoryTypeValues;
export const messageRoleValues = activeSchema.messageRoleValues;
export const userRoleValues = activeSchema.userRoleValues;
export const users = activeSchema.users as typeof sqliteSchema.users;
export const sessions = activeSchema.sessions as typeof sqliteSchema.sessions;
export const authAccounts = activeSchema.authAccounts as typeof sqliteSchema.authAccounts;
export const verification = activeSchema.verification as typeof sqliteSchema.verification;
export const accounts = activeSchema.accounts as typeof sqliteSchema.accounts;
export const categories = activeSchema.categories as typeof sqliteSchema.categories;
export const transactions = activeSchema.transactions as typeof sqliteSchema.transactions;
export const chatSessions = activeSchema.chatSessions as typeof sqliteSchema.chatSessions;
export const chatMessages = activeSchema.chatMessages as typeof sqliteSchema.chatMessages;
export const importLogs = activeSchema.importLogs as typeof sqliteSchema.importLogs;
export const adminAuditLogs = activeSchema.adminAuditLogs as typeof sqliteSchema.adminAuditLogs;

export const usersRelations = activeSchema.usersRelations;
export const sessionsRelations = activeSchema.sessionsRelations;
export const authAccountsRelations = activeSchema.authAccountsRelations;
export const accountsRelations = activeSchema.accountsRelations;
export const categoriesRelations = activeSchema.categoriesRelations;
export const transactionsRelations = activeSchema.transactionsRelations;
export const chatSessionsRelations = activeSchema.chatSessionsRelations;
export const chatMessagesRelations = activeSchema.chatMessagesRelations;
export const importLogsRelations = activeSchema.importLogsRelations;
export const adminAuditLogsRelations = activeSchema.adminAuditLogsRelations;
