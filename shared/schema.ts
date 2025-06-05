import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  isEditor: boolean("is_editor").default(false),
  isGestor: boolean("is_gestor").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const languages = pgTable("languages", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const formats = pgTable("formats", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creativeRequests = pgTable("creative_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  requestedById: integer("requested_by_id").references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'image' or 'video'
  status: varchar("status", { length: 50 }).default("solicitado"), // 'solicitado', 'em_progresso', 'pronto'
  languageId: integer("language_id").references(() => languages.id),
  formatId: integer("format_id").references(() => formats.id),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requestedCreatives: many(creativeRequests, { relationName: "requester" }),
  assignedCreatives: many(creativeRequests, { relationName: "assignee" }),
  projectAssignments: many(projectAssignments),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  assignments: many(projectAssignments),
  creativeRequests: many(creativeRequests),
}));

export const projectAssignmentsRelations = relations(projectAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssignments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectAssignments.userId],
    references: [users.id],
  }),
}));

export const languagesRelations = relations(languages, ({ many }) => ({
  creativeRequests: many(creativeRequests),
}));

export const formatsRelations = relations(formats, ({ many }) => ({
  creativeRequests: many(creativeRequests),
}));

export const creativeRequestsRelations = relations(creativeRequests, ({ one }) => ({
  project: one(projects, {
    fields: [creativeRequests.projectId],
    references: [projects.id],
  }),
  requestedBy: one(users, {
    fields: [creativeRequests.requestedById],
    references: [users.id],
    relationName: "requester",
  }),
  assignedTo: one(users, {
    fields: [creativeRequests.assignedToId],
    references: [users.id],
    relationName: "assignee",
  }),
  language: one(languages, {
    fields: [creativeRequests.languageId],
    references: [languages.id],
  }),
  format: one(formats, {
    fields: [creativeRequests.formatId],
    references: [formats.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  isAdmin: true,
  isEditor: true,
  isGestor: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  id: true,
  name: true,
  domain: true,
  description: true,
});

export const insertLanguageSchema = createInsertSchema(languages).pick({
  id: true,
  name: true,
});

export const insertFormatSchema = createInsertSchema(formats).pick({
  id: true,
  name: true,
});

export const insertCreativeRequestSchema = createInsertSchema(creativeRequests).pick({
  projectId: true,
  requestedById: true,
  title: true,
  description: true,
  type: true,
  languageId: true,
  formatId: true,
  deadline: true,
});

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).pick({
  projectId: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Format = typeof formats.$inferSelect;
export type InsertFormat = z.infer<typeof insertFormatSchema>;
export type CreativeRequest = typeof creativeRequests.$inferSelect;
export type InsertCreativeRequest = z.infer<typeof insertCreativeRequestSchema>;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
