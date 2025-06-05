import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertProjectSchema, insertCreativeRequestSchema, insertProjectAssignmentSchema, insertLanguageSchema, insertFormatSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin user if not exists
  const adminExists = await storage.getUserByEmail("felipee.14@hotmail.com");
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await storage.createUser({
      name: "Felipe Menezes",
      email: "felipee.14@hotmail.com",
      password: hashedPassword,
      isAdmin: true,
      isEditor: false,
      isGestor: false,
    });
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if at least one role is selected
      if (!validatedData.isAdmin && !validatedData.isEditor && !validatedData.isGestor) {
        return res.status(400).json({ message: "Pelo menos uma função deve ser selecionada" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // Se apenas as funções estão sendo atualizadas (compatibilidade com código anterior)
      if (userData.isAdmin !== undefined || userData.isEditor !== undefined || userData.isGestor !== undefined) {
        const user = await storage.updateUser(id, userData);
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        // Atualização completa do usuário
        const user = await storage.updateUser(id, userData);
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar projetos" });
    }
  });

  app.get("/api/projects/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar projetos do usuário" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar projeto" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar projeto" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Projeto excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir projeto" });
    }
  });

  app.post("/api/projects/:projectId/assign/:userId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      const assignment = await storage.assignProjectToUser(projectId, userId);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atribuir projeto" });
    }
  });

  // Creative request routes
  app.get("/api/creative-requests", async (req, res) => {
    try {
      const { status, requestedBy, assignedTo } = req.query;
      const requests = await storage.getCreativeRequests({
        status: status as string,
        requestedById: requestedBy ? parseInt(requestedBy as string) : undefined,
        assignedToId: assignedTo ? parseInt(assignedTo as string) : undefined,
      });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar solicitações de criativos" });
    }
  });

  app.post("/api/creative-requests", async (req, res) => {
    try {
      const validatedData = insertCreativeRequestSchema.parse(req.body);
      const request = await storage.createCreativeRequest(validatedData);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar solicitação de criativo" });
    }
  });

  app.patch("/api/creative-requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, assignedToId } = req.body;
      
      const request = await storage.updateCreativeRequestStatus(id, status, assignedToId);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status do criativo" });
    }
  });

  app.patch("/api/creative-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, type, deadline } = req.body;
      
      const request = await storage.updateCreativeRequest(id, { title, description, type, deadline });
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar criativo" });
    }
  });

  app.delete("/api/creative-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCreativeRequest(id);
      res.json({ message: "Criativo excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir criativo" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Language routes
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getAllLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar idiomas" });
    }
  });

  app.post("/api/languages", async (req, res) => {
    try {
      const validatedData = insertLanguageSchema.parse(req.body);
      const language = await storage.createLanguage(validatedData);
      res.json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar idioma" });
    }
  });

  app.patch("/api/languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLanguageSchema.partial().parse(req.body);
      const language = await storage.updateLanguage(id, validatedData);
      res.json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar idioma" });
    }
  });

  app.patch("/api/languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const language = await storage.updateLanguage(id, updateData);
      res.json(language);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar idioma" });
    }
  });

  app.delete("/api/languages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLanguage(id);
      res.json({ message: "Idioma excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir idioma" });
    }
  });

  // Format routes
  app.get("/api/formats", async (req, res) => {
    try {
      const formats = await storage.getAllFormats();
      res.json(formats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar formatos" });
    }
  });

  app.post("/api/formats", async (req, res) => {
    try {
      const validatedData = insertFormatSchema.parse(req.body);
      const format = await storage.createFormat(validatedData);
      res.json(format);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar formato" });
    }
  });

  app.patch("/api/formats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFormatSchema.partial().parse(req.body);
      const format = await storage.updateFormat(id, validatedData);
      res.json(format);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar formato" });
    }
  });

  app.patch("/api/formats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const format = await storage.updateFormat(id, updateData);
      res.json(format);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar formato" });
    }
  });

  app.delete("/api/formats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFormat(id);
      res.json({ message: "Formato excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir formato" });
    }
  });

  app.post("/api/reset-all-data", async (req, res) => {
    try {
      await storage.resetAllData();
      res.json({ message: "Todos os dados foram resetados com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao resetar dados" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
