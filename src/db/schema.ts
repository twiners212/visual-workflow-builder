import { pgTable, text, timestamp, boolean, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Better Auth Schema Tables ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  biography: text("biography"),
  preferences: jsonb("preferences").$type<{
    theme?: "system" | "light" | "dark";
    accentColor?: "blue" | "purple" | "green" | "orange" | "red" | "pink" | "indigo" | "yellow";
    canvas?: {
      showGrid?: boolean;
      snapToGrid?: boolean;
      showMinimap?: boolean;
      enableAnimations?: boolean;
    };
    compactMode?: boolean;
    notifications?: {
      workflowFailures?: boolean;
      teamInvitations?: boolean;
      productUpdates?: boolean;
    };
    workflow?: {
      autoSave?: boolean;
      defaultZoom?: number;
    };
    editor?: {
      enableKeyboardShortcuts?: boolean;
      autoSelectNewNode?: boolean;
    };
  }>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Application Schema Tables ---

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(), // Using text/uuid UUID string
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  currentVersionId: text("current_version_id"), // Will be updated to reference a workflow_version id
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workflowVersions = pgTable("workflow_versions", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  status: text("status").$type<"draft" | "published" | "archived">().notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const nodes = pgTable("nodes", {
  id: text("id").primaryKey(), // Text ID matching React Flow string node id
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersions.id, { onDelete: "cascade" }),
  type: text("type").$type<"trigger" | "action" | "logic" | "ai">().notNull(),
  name: text("name").notNull(),
  positionX: doublePrecision("position_x").notNull(),
  positionY: doublePrecision("position_y").notNull(),
  configuration: jsonb("configuration").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const edges = pgTable("edges", {
  id: text("id").primaryKey(),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersions.id, { onDelete: "cascade" }),
  sourceNodeId: text("source_node_id").notNull(),
  targetNodeId: text("target_node_id").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersions.id, { onDelete: "cascade" }),
  status: text("status").$type<"pending" | "running" | "success" | "failed">().notNull().default("pending"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  duration: integer("duration"), // Duration in milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const executionLogs = pgTable("execution_logs", {
  id: text("id").primaryKey(),
  executionId: text("execution_id")
    .notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  nodeId: text("node_id").notNull(),
  status: text("status").$type<"pending" | "running" | "success" | "failed">().notNull(),
  message: text("message"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(workflows),
  assets: many(assets),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, { fields: [workflows.userId], references: [users.id] }),
  versions: many(workflowVersions),
  executions: many(executions),
}));

export const workflowVersionsRelations = relations(workflowVersions, ({ one, many }) => ({
  workflow: one(workflows, { fields: [workflowVersions.workflowId], references: [workflows.id] }),
  nodes: many(nodes),
  edges: many(edges),
  executions: many(executions),
}));

export const nodesRelations = relations(nodes, ({ one }) => ({
  version: one(workflowVersions, { fields: [nodes.workflowVersionId], references: [workflowVersions.id] }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  version: one(workflowVersions, { fields: [edges.workflowVersionId], references: [workflowVersions.id] }),
}));

export const executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, { fields: [executions.workflowId], references: [workflows.id] }),
  version: one(workflowVersions, { fields: [executions.workflowVersionId], references: [workflowVersions.id] }),
  logs: many(executionLogs),
}));

export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  execution: one(executions, { fields: [executionLogs.executionId], references: [executions.id] }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
}));
