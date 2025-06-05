import { 
  users, 
  projects, 
  creativeRequests, 
  projectAssignments,
  languages,
  formats,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type CreativeRequest,
  type InsertCreativeRequest,
  type ProjectAssignment,
  type InsertProjectAssignment,
  type Language,
  type InsertLanguage,
  type Format,
  type InsertFormat
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUserRoles(id: number, roles: { isAdmin?: boolean; isEditor?: boolean; isGestor?: boolean }): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Project methods
  getAllProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(insertProject: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  assignProjectToUser(projectId: number, userId: number): Promise<ProjectAssignment>;

  // Creative request methods
  getCreativeRequests(filters?: {
    status?: string;
    requestedById?: number;
    assignedToId?: number;
  }): Promise<CreativeRequest[]>;
  createCreativeRequest(insertRequest: InsertCreativeRequest): Promise<CreativeRequest>;
  updateCreativeRequestStatus(id: number, status: string, assignedToId?: number): Promise<CreativeRequest>;
  updateCreativeRequest(id: number, data: Partial<InsertCreativeRequest>): Promise<CreativeRequest>;
  deleteCreativeRequest(id: number): Promise<void>;

  // Language methods
  getAllLanguages(): Promise<Language[]>;
  createLanguage(insertLanguage: InsertLanguage): Promise<Language>;
  updateLanguage(id: number, data: Partial<InsertLanguage>): Promise<Language>;
  deleteLanguage(id: number): Promise<void>;

  // Format methods
  getAllFormats(): Promise<Format[]>;
  createFormat(insertFormat: InsertFormat): Promise<Format>;
  updateFormat(id: number, data: Partial<InsertFormat>): Promise<Format>;
  deleteFormat(id: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    pending: number;
    progress: number;
    completed: number;
    users: number;
  }>;

  // Reset all data
  resetAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserRoles(id: number, roles: { isAdmin?: boolean; isEditor?: boolean; isGestor?: boolean }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(roles)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    // Se a senha estiver vazia, não a incluir na atualização
    if (data.password === '') {
      delete data.password;
    }
    
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    const userProjects = await db
      .select({ project: projects })
      .from(projectAssignments)
      .innerJoin(projects, eq(projectAssignments.projectId, projects.id))
      .where(eq(projectAssignments.userId, userId));
    
    return userProjects.map(row => row.project);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    // Verificar se o ID já existe
    if (insertProject.id) {
      const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.id, insertProject.id))
        .limit(1);
      
      if (existingProject.length > 0) {
        throw new Error(`Projeto com ID ${insertProject.id} já existe`);
      }
    }

    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    // Primeiro, verificar se há creative requests vinculados ao projeto
    const relatedRequests = await db
      .select()
      .from(creativeRequests)
      .where(eq(creativeRequests.projectId, id));
    
    if (relatedRequests.length > 0) {
      throw new Error("Não é possível excluir o projeto pois existem criativos vinculados a ele");
    }
    
    // Excluir assignments do projeto
    await db.delete(projectAssignments).where(eq(projectAssignments.projectId, id));
    
    // Excluir o projeto
    await db.delete(projects).where(eq(projects.id, id));
  }

  async assignProjectToUser(projectId: number, userId: number): Promise<ProjectAssignment> {
    const [assignment] = await db
      .insert(projectAssignments)
      .values({ projectId, userId })
      .returning();
    return assignment;
  }

  async getCreativeRequests(filters?: {
    status?: string;
    requestedById?: number;
    assignedToId?: number;
  }): Promise<CreativeRequest[]> {
    if (!filters) {
      return await db.select().from(creativeRequests);
    }

    const conditions = [];
    if (filters.status) {
      conditions.push(eq(creativeRequests.status, filters.status));
    }
    if (filters.requestedById) {
      conditions.push(eq(creativeRequests.requestedById, filters.requestedById));
    }
    if (filters.assignedToId) {
      conditions.push(eq(creativeRequests.assignedToId, filters.assignedToId));
    }

    if (conditions.length === 0) {
      return await db.select().from(creativeRequests);
    }

    return await db.select().from(creativeRequests).where(and(...conditions));
  }

  async createCreativeRequest(insertRequest: InsertCreativeRequest): Promise<CreativeRequest> {
    const [request] = await db
      .insert(creativeRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateCreativeRequestStatus(id: number, status: string, assignedToId?: number): Promise<CreativeRequest> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedToId) {
      updateData.assignedToId = assignedToId;
    }

    const [request] = await db
      .update(creativeRequests)
      .set(updateData)
      .where(eq(creativeRequests.id, id))
      .returning();
    return request;
  }

  async updateCreativeRequest(id: number, data: Partial<InsertCreativeRequest>): Promise<CreativeRequest> {
    const [request] = await db
      .update(creativeRequests)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(creativeRequests.id, id))
      .returning();
    return request;
  }

  async deleteCreativeRequest(id: number): Promise<void> {
    await db
      .delete(creativeRequests)
      .where(eq(creativeRequests.id, id));
  }

  async getDashboardStats(): Promise<{
    pending: number;
    progress: number;
    completed: number;
    users: number;
  }> {
    // Count pending requests
    const pendingRequests = await db
      .select()
      .from(creativeRequests)
      .where(eq(creativeRequests.status, 'solicitado'));

    // Count progress requests
    const progressRequests = await db
      .select()
      .from(creativeRequests)
      .where(eq(creativeRequests.status, 'em_progresso'));

    // Count completed requests
    const completedRequests = await db
      .select()
      .from(creativeRequests)
      .where(eq(creativeRequests.status, 'pronto'));

    // Count all users
    const allUsers = await db.select().from(users);

    return {
      pending: pendingRequests.length,
      progress: progressRequests.length,
      completed: completedRequests.length,
      users: allUsers.length,
    };
  }

  async getAllLanguages(): Promise<Language[]> {
    return await db.select().from(languages);
  }

  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const [language] = await db
      .insert(languages)
      .values(insertLanguage)
      .returning();
    return language;
  }

  async updateLanguage(id: number, data: Partial<InsertLanguage>): Promise<Language> {
    const [language] = await db
      .update(languages)
      .set(data)
      .where(eq(languages.id, id))
      .returning();
    return language;
  }

  async deleteLanguage(id: number): Promise<void> {
    await db.delete(languages).where(eq(languages.id, id));
  }

  async getAllFormats(): Promise<Format[]> {
    return await db.select().from(formats);
  }

  async createFormat(insertFormat: InsertFormat): Promise<Format> {
    const [format] = await db
      .insert(formats)
      .values(insertFormat)
      .returning();
    return format;
  }

  async updateFormat(id: number, data: Partial<InsertFormat>): Promise<Format> {
    const [format] = await db
      .update(formats)
      .set(data)
      .where(eq(formats.id, id))
      .returning();
    return format;
  }

  async deleteFormat(id: number): Promise<void> {
    await db.delete(formats).where(eq(formats.id, id));
  }

  async resetAllData(): Promise<void> {
    // Excluir todos os creative requests
    await db.delete(creativeRequests);
    
    // Excluir todos os project assignments
    await db.delete(projectAssignments);
    
    // Excluir todos os projetos
    await db.delete(projects);
    
    // Excluir idiomas e formatos personalizados
    await db.delete(languages);
    await db.delete(formats);
  }
}

export const storage = new DatabaseStorage();