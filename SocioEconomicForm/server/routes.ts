import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupEmailAuth, isEmailAuthenticated } from "./emailAuth";
import { withTenantContext, requireTenant, requireRole, isSaasAdmin, isTenantAdmin, isCorretorOrAdmin } from "./middleware/tenant";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  insertPessoaFisicaSchema,
  insertPessoaJuridicaSchema,
  insertPatrimonioSchema,
  insertOportunidadeSchema,
  insertInteracaoSchema,
  insertDependenteSchema,
  insertSocioSchema,
  insertFuncionarioSchema,
  insertEnderecoSchema,
  insertConviteSchema,
  insertSmtpConfigSchema,
  insertWhatsappConfigSchema,
  insertSubscriptionPlanSchema,
  insertTenantSchema,
  insertSeguradoraMasterSchema,
  insertTipoSeguroMasterSchema,
  insertBusinessRuleTemplateSchema,
  insertSeguradoraProdutoSchema,
  insertTenantSeguradoraContatoSchema,
  insertSaasSmtpConfigSchema,
  insertTenantSmtpConfigSchema,
  insertSaasChatgptConfigSchema,
  insertSaasEvolutionConfigSchema,
  insertUserSchema,
  insertTenantPolicySchema,
  insertTenantChannelConnectionSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendInviteEmail, sendTestEmail } from "./services/email";
import { sendInviteWhatsApp } from "./services/whatsapp";
import { consultarCNPJ, mapCNPJDataToPessoaJuridica, mapCNPJDataToEndereco, mapCNPJDataToSocios } from "./services/cnpj";

function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data?: T; error?: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: fromZodError(result.error).message };
  }
  return { data: result.data };
}

async function checkClientLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const result = await storage.canAddClient(tenantId);
    return { allowed: result.allowed, message: result.message };
  } catch (error) {
    console.error("Error checking client limit:", error);
    return { allowed: true };
  }
}

async function checkUserLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const result = await storage.canAddUser(tenantId);
    return { allowed: result.allowed, message: result.message };
  } catch (error) {
    console.error("Error checking user limit:", error);
    return { allowed: true };
  }
}

async function checkPolicyLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const result = await storage.canAddPolicy(tenantId);
    return { allowed: result.allowed, message: result.message };
  } catch (error) {
    console.error("Error checking policy limit:", error);
    return { allowed: true };
  }
}

async function checkTokenLimit(tenantId: string, tokensToConsume: number): Promise<{ allowed: boolean; message?: string }> {
  try {
    const result = await storage.canConsumeTokens(tenantId, tokensToConsume);
    return { allowed: result.allowed, message: result.message };
  } catch (error) {
    console.error("Error checking token limit:", error);
    return { allowed: true };
  }
}

async function checkConnectionLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const result = await storage.canAddConnection(tenantId);
    return { allowed: result.allowed, message: result.message };
  } catch (error) {
    console.error("Error checking connection limit:", error);
    return { allowed: true };
  }
}

function stripNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
    return {} as Partial<T>;
  }
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined)
  ) as Partial<T>;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupEmailAuth(app);
  
  // Health check endpoint for Docker/Kubernetes
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      // Basic health check - verify database connection
      const dbConnected = await storage.healthCheck();
      
      if (!dbConnected) {
        return res.status(503).json({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: "disconnected",
          error: "Database connection failed"
        });
      }
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected",
        version: process.env.npm_package_version || "1.0.0"
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service unavailable"
      });
    }
  });
  
  app.use("/api", withTenantContext);

  app.get("/api/auth/user", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const fullUser = await storage.getUser(user.id);
      res.json(fullUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/stats", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const stats = await storage.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const clientes = await storage.getAllPessoasFisicas(tenantId);
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching pessoas fisicas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const cliente = await storage.getPessoaFisica(req.params.id, tenantId);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      console.error("Error fetching pessoa fisica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pessoas-fisicas", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const { endereco, ...pfData } = req.body;
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const limitCheck = await checkClientLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message });
      }
      
      const validation = validateBody(insertPessoaFisicaSchema.partial().extend({
        nomeCompleto: z.string().min(1, "Nome é obrigatório"),
        cpf: z.string().min(1, "CPF é obrigatório"),
      }), pfData);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      let enderecoValidation;
      if (endereco && endereco.cep) {
        enderecoValidation = validateBody(insertEnderecoSchema.partial(), endereco);
        if (enderecoValidation.error) {
          return res.status(400).json({ message: enderecoValidation.error });
        }
      }
      
      const cliente = await storage.createPessoaFisica(
        { ...validation.data!, createdBy: userId, tenantId } as any,
        enderecoValidation?.data ? { ...enderecoValidation.data, tenantId } : undefined
      );
      res.status(201).json(cliente);
    } catch (error: any) {
      console.error("Error creating pessoa fisica:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CPF já cadastrado nesta corretora" });
      }
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  app.patch("/api/pessoas-fisicas/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const validation = validateBody(insertPessoaFisicaSchema.partial(), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const cliente = await storage.updatePessoaFisica(req.params.id, validation.data!, tenantId);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      console.error("Error updating pessoa fisica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pessoas-fisicas/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deletePessoaFisica(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pessoa fisica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas/:id/dependentes", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const dependentes = await storage.getDependentesByPF(req.params.id, tenantId);
      res.json(dependentes);
    } catch (error) {
      console.error("Error fetching dependentes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pessoas-fisicas/:id/dependentes", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const pf = await storage.getPessoaFisica(req.params.id, tenantId);
      if (!pf) {
        return res.status(404).json({ message: "Pessoa física não encontrada" });
      }
      
      const validation = validateBody(insertDependenteSchema.omit({ pessoaFisicaId: true }), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const dependente = await storage.createDependente({
        ...validation.data!,
        pessoaFisicaId: req.params.id,
      });
      res.status(201).json(dependente);
    } catch (error) {
      console.error("Error creating dependente:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pessoas-fisicas/:id/dependentes/:depId", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const deleted = await storage.deleteDependente(req.params.depId, req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Dependente não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dependente:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas/:id/patrimonios", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const patrimonios = await storage.getPatrimoniosByPF(req.params.id, tenantId);
      res.json(patrimonios);
    } catch (error) {
      console.error("Error fetching patrimonios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas/:id/oportunidades", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const oportunidades = await storage.getOportunidadesByPF(req.params.id, tenantId);
      res.json(oportunidades);
    } catch (error) {
      console.error("Error fetching oportunidades:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-fisicas/:id/interacoes", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const interacoes = await storage.getInteracoesByPF(req.params.id, tenantId);
      res.json(interacoes);
    } catch (error) {
      console.error("Error fetching interacoes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const empresas = await storage.getAllPessoasJuridicas(tenantId);
      res.json(empresas);
    } catch (error) {
      console.error("Error fetching pessoas juridicas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const empresa = await storage.getPessoaJuridica(req.params.id, tenantId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      console.error("Error fetching pessoa juridica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pessoas-juridicas", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const { endereco, ...pjData } = req.body;
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const limitCheck = await checkClientLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message });
      }
      
      const validation = validateBody(insertPessoaJuridicaSchema.partial().extend({
        razaoSocial: z.string().min(1, "Razão Social é obrigatória"),
        cnpj: z.string().min(1, "CNPJ é obrigatório"),
      }), pjData);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      let enderecoValidation;
      if (endereco && endereco.cep) {
        enderecoValidation = validateBody(insertEnderecoSchema.partial(), endereco);
        if (enderecoValidation.error) {
          return res.status(400).json({ message: enderecoValidation.error });
        }
      }
      
      const empresa = await storage.createPessoaJuridica(
        { ...validation.data!, createdBy: userId, tenantId } as any,
        enderecoValidation?.data ? { ...enderecoValidation.data, tenantId } : undefined
      );
      res.status(201).json(empresa);
    } catch (error: any) {
      console.error("Error creating pessoa juridica:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CNPJ já cadastrado nesta corretora" });
      }
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  app.patch("/api/pessoas-juridicas/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const validation = validateBody(insertPessoaJuridicaSchema.partial(), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const empresa = await storage.updatePessoaJuridica(req.params.id, validation.data!, tenantId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      console.error("Error updating pessoa juridica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pessoas-juridicas/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deletePessoaJuridica(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pessoa juridica:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id/socios", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const socios = await storage.getSociosByPJ(req.params.id, tenantId);
      res.json(socios);
    } catch (error) {
      console.error("Error fetching socios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pessoas-juridicas/:id/socios", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const pj = await storage.getPessoaJuridica(req.params.id, tenantId);
      if (!pj) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      const validation = validateBody(insertSocioSchema.omit({ pessoaJuridicaId: true }), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const socio = await storage.createSocio({
        ...validation.data!,
        pessoaJuridicaId: req.params.id,
      });
      res.status(201).json(socio);
    } catch (error) {
      console.error("Error creating socio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pessoas-juridicas/:id/socios/:socioId", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const deleted = await storage.deleteSocio(req.params.socioId, req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Sócio não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting socio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id/funcionarios", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const funcionarios = await storage.getFuncionariosByPJ(req.params.id, tenantId);
      res.json(funcionarios);
    } catch (error) {
      console.error("Error fetching funcionarios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pessoas-juridicas/:id/funcionarios", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const pj = await storage.getPessoaJuridica(req.params.id, tenantId);
      if (!pj) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      const validation = validateBody(insertFuncionarioSchema.omit({ pessoaJuridicaId: true }), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const funcionario = await storage.createFuncionario({
        ...validation.data!,
        pessoaJuridicaId: req.params.id,
      });
      res.status(201).json(funcionario);
    } catch (error) {
      console.error("Error creating funcionario:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/pessoas-juridicas/:id/funcionarios/:funcId", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const deleted = await storage.deleteFuncionario(req.params.funcId, req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Funcionário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting funcionario:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id/patrimonios", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const patrimonios = await storage.getPatrimoniosByPJ(req.params.id, tenantId);
      res.json(patrimonios);
    } catch (error) {
      console.error("Error fetching patrimonios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id/oportunidades", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const oportunidades = await storage.getOportunidadesByPJ(req.params.id, tenantId);
      res.json(oportunidades);
    } catch (error) {
      console.error("Error fetching oportunidades:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pessoas-juridicas/:id/interacoes", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const interacoes = await storage.getInteracoesByPJ(req.params.id, tenantId);
      res.json(interacoes);
    } catch (error) {
      console.error("Error fetching interacoes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patrimonios", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const patrimonios = await storage.getAllPatrimonios(tenantId);
      res.json(patrimonios);
    } catch (error) {
      console.error("Error fetching patrimonios:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/patrimonios", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const validation = validateBody(insertPatrimonioSchema, req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const patrimonio = await storage.createPatrimonio({ ...validation.data!, tenantId });
      res.status(201).json(patrimonio);
    } catch (error) {
      console.error("Error creating patrimonio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/patrimonios/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const validation = validateBody(insertPatrimonioSchema.partial(), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const patrimonio = await storage.updatePatrimonio(req.params.id, validation.data!, tenantId);
      if (!patrimonio) {
        return res.status(404).json({ message: "Patrimônio não encontrado" });
      }
      res.json(patrimonio);
    } catch (error) {
      console.error("Error updating patrimonio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/patrimonios/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deletePatrimonio(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patrimonio:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/oportunidades", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const oportunidades = await storage.getAllOportunidades(tenantId);
      res.json(oportunidades);
    } catch (error) {
      console.error("Error fetching oportunidades:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/oportunidades", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const validation = validateBody(insertOportunidadeSchema, req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const oportunidade = await storage.createOportunidade({
        ...validation.data!,
        createdBy: userId,
        tenantId,
      });
      res.status(201).json(oportunidade);
    } catch (error) {
      console.error("Error creating oportunidade:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/oportunidades/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const validation = validateBody(insertOportunidadeSchema.partial(), req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const oportunidade = await storage.updateOportunidade(req.params.id, validation.data!, tenantId);
      if (!oportunidade) {
        return res.status(404).json({ message: "Oportunidade não encontrada" });
      }
      res.json(oportunidade);
    } catch (error) {
      console.error("Error updating oportunidade:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/oportunidades/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deleteOportunidade(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting oportunidade:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/interacoes", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const interacoes = await storage.getAllInteracoes(tenantId);
      res.json(interacoes);
    } catch (error) {
      console.error("Error fetching interacoes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/interacoes", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const validation = validateBody(insertInteracaoSchema, req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const interacao = await storage.createInteracao({
        ...validation.data!,
        createdBy: userId,
        tenantId,
      });
      res.status(201).json(interacao);
    } catch (error) {
      console.error("Error creating interacao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/interacoes/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deleteInteracao(req.params.id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interacao:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Convites routes
  app.get("/api/convites", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const convites = await storage.getAllConvitesByCorretor(userId);
      res.json(convites);
    } catch (error) {
      console.error("Error fetching convites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/convites/token/:token", async (req: Request, res: Response) => {
    try {
      const convite = await storage.getConviteByToken(req.params.token);
      if (!convite) {
        return res.status(404).json({ message: "Convite não encontrado" });
      }
      if (convite.status === "expirado" || (convite.expiraEm && new Date(convite.expiraEm) < new Date())) {
        return res.status(410).json({ message: "Convite expirado" });
      }
      if (convite.status === "aceito") {
        return res.status(400).json({ message: "Convite já foi utilizado" });
      }
      res.json(convite);
    } catch (error) {
      console.error("Error fetching convite by token:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/convites", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const validation = validateBody(insertConviteSchema.partial().extend({
        nomeCliente: z.string().min(1, "Nome do cliente é obrigatório"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const convite = await storage.createConvite({
        ...validation.data!,
        corretorId: userId,
        tenantId,
      });
      res.status(201).json(convite);
    } catch (error) {
      console.error("Error creating convite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/convites/bulk", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      const { clientes } = req.body;
      
      if (!Array.isArray(clientes) || clientes.length === 0) {
        return res.status(400).json({ message: "Lista de clientes é obrigatória" });
      }
      
      const created = [];
      for (const cliente of clientes) {
        const convite = await storage.createConvite({
          nomeCliente: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          corretorId: userId,
          tenantId,
        });
        created.push(convite);
      }
      
      res.status(201).json({ created: created.length, convites: created });
    } catch (error) {
      console.error("Error creating bulk convites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/convites/:id/status", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const { status, clienteUserId, token } = req.body;
      
      if (!["pendente", "enviado", "aceito", "expirado", "cancelado"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      const existingConvite = await storage.getConviteById(req.params.id);
      if (!existingConvite) {
        return res.status(404).json({ message: "Convite não encontrado" });
      }

      if (status === "aceito" && clienteUserId) {
        if (!token || existingConvite.token !== token) {
          return res.status(403).json({ message: "Token do convite inválido" });
        }
        if (clienteUserId !== userId) {
          return res.status(403).json({ message: "Você não pode aceitar este convite em nome de outra pessoa" });
        }
      } else if (existingConvite.corretorId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para atualizar este convite" });
      }
      
      const convite = await storage.updateConviteStatus(req.params.id, status, clienteUserId);
      res.json(convite);
    } catch (error) {
      console.error("Error updating convite status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/convites/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      
      const existingConvite = await storage.getConviteById(req.params.id);
      if (!existingConvite) {
        return res.status(404).json({ message: "Convite não encontrado" });
      }

      if (existingConvite.corretorId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para remover este convite" });
      }
      
      await storage.deleteConvite(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting convite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/convites/:id/enviar", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = (req as any).tenantId;
      const convite = await storage.getConviteById(req.params.id);
      
      if (!convite) {
        return res.status(404).json({ message: "Convite não encontrado" });
      }

      if (convite.corretorId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para enviar este convite" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const canal = convite.canalEnvio || "email";

      if (canal === "email") {
        if (!convite.email) {
          return res.status(400).json({ message: "E-mail do cliente não informado" });
        }
        
        const smtpConfig = await storage.getTenantSmtpConfig(tenantId);
        if (!smtpConfig || !smtpConfig.ativo) {
          return res.status(400).json({ message: "Configure o SMTP nas configurações da corretora antes de enviar e-mails" });
        }

        const result = await sendInviteEmail(smtpConfig, convite, baseUrl);
        if (!result.success) {
          return res.status(500).json({ message: `Erro ao enviar e-mail: ${result.error}` });
        }
      } else if (canal === "whatsapp") {
        if (!convite.telefone) {
          return res.status(400).json({ message: "Telefone do cliente não informado" });
        }
        
        const whatsappConfig = await storage.getWhatsappConfigByUser(userId);
        if (!whatsappConfig || !whatsappConfig.ativo) {
          return res.status(400).json({ message: "Configure o WhatsApp nas configurações antes de enviar mensagens" });
        }

        const result = await sendInviteWhatsApp(whatsappConfig, convite, baseUrl);
        if (!result.success) {
          return res.status(500).json({ message: `Erro ao enviar WhatsApp: ${result.error}` });
        }
      } else {
        return res.status(400).json({ message: "Canal de envio inválido" });
      }

      await storage.updateConviteStatus(req.params.id, "enviado");
      const updatedConvite = await storage.getConviteById(req.params.id);
      
      res.json({ success: true, convite: updatedConvite });
    } catch (error) {
      console.error("Error sending convite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SMTP Config routes
  app.get("/api/config/smtp", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const config = await storage.getSmtpConfigByUser(userId);
      if (config) {
        const { senha, ...safeConfig } = config;
        res.json({ ...safeConfig, senha: "********" });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/config/smtp", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const existingConfig = await storage.getSmtpConfigByUser(userId);
      
      const validation = validateBody(insertSmtpConfigSchema.partial().extend({
        host: z.string().min(1, "Host é obrigatório"),
        usuario: z.string().min(1, "Usuário é obrigatório"),
        senha: z.string().optional(),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const configData = {
        ...validation.data!,
        userId,
        tenantId,
        senha: validation.data!.senha || existingConfig?.senha || "",
      };

      if (!configData.senha) {
        return res.status(400).json({ message: "Senha é obrigatória para nova configuração" });
      }
      
      const config = await storage.upsertSmtpConfig(configData);
      
      const { senha, ...safeConfig } = config;
      res.json({ ...safeConfig, senha: "********" });
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/config/smtp", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      await storage.deleteSmtpConfig(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/config/smtp/test", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const { emailDestino } = req.body;
      
      if (!emailDestino) {
        return res.status(400).json({ message: "E-mail de destino é obrigatório" });
      }

      const smtpConfig = await storage.getSmtpConfigByUser(userId);
      if (!smtpConfig || !smtpConfig.ativo) {
        return res.status(400).json({ message: "Configure o SMTP nas configurações antes de enviar e-mails" });
      }

      const testConvite: any = {
        id: "test-" + Date.now(),
        nomeCliente: "Teste",
        email: emailDestino,
        token: "test-token-" + Date.now(),
        telefone: null,
        status: "pendente" as const,
        createdAt: new Date(),
        tenantId: (req as any).tenantId || "",
        corretorId: userId,
        pessoaFisicaId: null,
        pessoaJuridicaId: null,
        mensagemPersonalizada: null,
        canalEnvio: "email" as const,
        enviadoEm: null,
        aceitoEm: null,
        expiraEm: null,
        clienteUserId: null,
      };
      const result = await sendInviteEmail(smtpConfig, testConvite, `${req.protocol}://${req.get("host")}`);

      if (!result.success) {
        return res.status(500).json({ message: `Erro ao enviar e-mail de teste: ${result.error}` });
      }

      res.json({ success: true, message: "E-mail de teste enviado com sucesso!" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp Config routes
  app.get("/api/config/whatsapp", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const config = await storage.getWhatsappConfigByUser(userId);
      if (config) {
        const { apiKey, ...safeConfig } = config;
        res.json({ ...safeConfig, apiKey: "********" });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/config/whatsapp", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const tenantId = req.tenantId!;
      
      const existingConfig = await storage.getWhatsappConfigByUser(userId);
      
      const validation = validateBody(insertWhatsappConfigSchema.partial().extend({
        instanceName: z.string().min(1, "Nome da instância é obrigatório"),
        endpoint: z.string().min(1, "Endpoint é obrigatório"),
        apiKey: z.string().optional(),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const configData = {
        ...validation.data!,
        userId,
        tenantId,
        apiKey: validation.data!.apiKey || existingConfig?.apiKey || "",
      };

      if (!configData.apiKey) {
        return res.status(400).json({ message: "API Key é obrigatória para nova configuração" });
      }
      
      const config = await storage.upsertWhatsappConfig(configData);
      
      const { apiKey, ...safeConfig } = config;
      res.json({ ...safeConfig, apiKey: "********" });
    } catch (error) {
      console.error("Error saving WhatsApp config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/config/whatsapp", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      await storage.deleteWhatsappConfig(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting WhatsApp config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/config/whatsapp/test", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const { telefonDestino } = req.body;
      
      if (!telefonDestino) {
        return res.status(400).json({ message: "Número de telefone é obrigatório" });
      }

      const whatsappConfig = await storage.getWhatsappConfigByUser(userId);
      if (!whatsappConfig || !whatsappConfig.ativo) {
        return res.status(400).json({ message: "Configure o WhatsApp nas configurações antes de enviar mensagens" });
      }

      const testConviteWpp: any = {
        id: "test-" + Date.now(),
        nomeCliente: "Teste",
        telefone: telefonDestino,
        token: "test-token-" + Date.now(),
        email: null,
        status: "pendente" as const,
        createdAt: new Date(),
        tenantId: (req as any).tenantId || "",
        corretorId: userId,
        pessoaFisicaId: null,
        pessoaJuridicaId: null,
        mensagemPersonalizada: null,
        canalEnvio: "whatsapp" as const,
        enviadoEm: null,
        aceitoEm: null,
        expiraEm: null,
        clienteUserId: null,
      };
      const result = await sendInviteWhatsApp(whatsappConfig, testConviteWpp, `${req.protocol}://${req.get("host")}`);

      if (!result.success) {
        return res.status(500).json({ message: `Erro ao enviar mensagem WhatsApp de teste: ${result.error}` });
      }

      res.json({ success: true, message: "Mensagem WhatsApp de teste enviada com sucesso!" });
    } catch (error) {
      console.error("Error sending test WhatsApp:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clientes (users that accepted invites)
  app.get("/api/clientes", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const clientes = await storage.getAllClientes(userId);
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Enriquecimento de Dados - CNPJ (Receita Federal)
  // ============================================
  app.get("/api/enriquecimento/cnpj/:cnpj", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }

      const result = await consultarCNPJ(cnpj);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      const pessoaJuridica = mapCNPJDataToPessoaJuridica(result.data!);
      const endereco = mapCNPJDataToEndereco(result.data!);
      const socios = mapCNPJDataToSocios(result.data!);

      res.json({
        success: true,
        dados: {
          cnpj: result.data!.cnpj,
          razaoSocial: result.data!.razaoSocial,
          nomeFantasia: result.data!.nomeFantasia,
          situacaoCadastral: result.data!.situacaoCadastral,
          dataInicioAtividade: result.data!.dataInicioAtividade,
          capitalSocial: result.data!.capitalSocial,
          naturezaJuridica: result.data!.naturezaJuridica,
          cnaeFiscal: result.data!.cnaeFiscal,
          cnaeFiscalDescricao: result.data!.cnaeFiscalDescricao,
          porte: result.data!.porte,
          telefone: result.data!.telefone1,
          email: result.data!.email,
        },
        pessoaJuridica,
        endereco,
        socios,
      });
    } catch (error) {
      console.error("Error querying CNPJ:", error);
      res.status(500).json({ message: "Erro ao consultar CNPJ" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Subscription Plans
  // ============================================
  app.get("/api/admin/subscription-plans", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/subscription-plans/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/subscription-plans", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertSubscriptionPlanSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        precoMensal: z.string().min(1, "Preço mensal é obrigatório"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const plan = await storage.createSubscriptionPlan(validation.data!);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/subscription-plans/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      if (Object.keys(cleanedBody).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      const existingPlan = await storage.getSubscriptionPlan(req.params.id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      const validation = validateBody(insertSubscriptionPlanSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const plan = await storage.updateSubscriptionPlan(req.params.id, validation.data!);
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSubscriptionPlan(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Tenants
  // ============================================
  app.get("/api/admin/tenants", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const tenantList = await storage.getAllTenants();
      res.json(tenantList);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/tenants/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/tenants", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertTenantSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        cnpj: z.string().min(1, "CNPJ é obrigatório"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      if (validation.data!.planId) {
        const plan = await storage.getSubscriptionPlan(validation.data!.planId);
        if (!plan) {
          return res.status(400).json({ message: "Plano de assinatura não encontrado" });
        }
        if (plan.status !== "ativo") {
          return res.status(400).json({ message: "Plano de assinatura inativo" });
        }
      }
      
      const tenant = await storage.createTenant(validation.data!);
      res.status(201).json(tenant);
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CNPJ já cadastrado" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/tenants/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      if (Object.keys(cleanedBody).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      const existingTenant = await storage.getTenant(req.params.id);
      if (!existingTenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      
      const validation = validateBody(insertTenantSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      if (validation.data!.planId) {
        const plan = await storage.getSubscriptionPlan(validation.data!.planId);
        if (!plan) {
          return res.status(400).json({ message: "Plano de assinatura não encontrado" });
        }
        if (plan.status !== "ativo") {
          return res.status(400).json({ message: "Plano de assinatura inativo" });
        }
      }
      
      const tenant = await storage.updateTenant(req.params.id, validation.data!);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/tenants/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteTenant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Seguradoras Master
  // ============================================
  app.get("/api/admin/seguradoras", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const seguradoras = await storage.getAllSeguradorasMaster();
      res.json(seguradoras);
    } catch (error) {
      console.error("Error fetching seguradoras:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/seguradoras/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const seguradora = await storage.getSeguradoraMaster(req.params.id);
      if (!seguradora) {
        return res.status(404).json({ message: "Seguradora não encontrada" });
      }
      res.json(seguradora);
    } catch (error) {
      console.error("Error fetching seguradora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/seguradoras", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertSeguradoraMasterSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        codigoSusep: z.string().min(1, "Código SUSEP é obrigatório"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const seguradora = await storage.createSeguradoraMaster(validation.data!);
      res.status(201).json(seguradora);
    } catch (error: any) {
      console.error("Error creating seguradora:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Código SUSEP já cadastrado" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/seguradoras/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      if (Object.keys(cleanedBody).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      const validation = validateBody(insertSeguradoraMasterSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const seguradora = await storage.updateSeguradoraMaster(req.params.id, validation.data!);
      if (!seguradora) {
        return res.status(404).json({ message: "Seguradora não encontrada" });
      }
      res.json(seguradora);
    } catch (error) {
      console.error("Error updating seguradora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/seguradoras/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSeguradoraMaster(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting seguradora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Tipos de Seguro Master
  // ============================================
  app.get("/api/admin/tipos-seguro", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const tipos = await storage.getAllTiposSeguroMaster();
      res.json(tipos);
    } catch (error) {
      console.error("Error fetching tipos de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/tipos-seguro/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const tipo = await storage.getTipoSeguroMaster(req.params.id);
      if (!tipo) {
        return res.status(404).json({ message: "Tipo de seguro não encontrado" });
      }
      res.json(tipo);
    } catch (error) {
      console.error("Error fetching tipo de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/tipos-seguro", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertTipoSeguroMasterSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        categoria: z.enum([
          "automovel", "motocicleta", "caminhao", "nautico", "aeronautico",
          "vida", "vida_coletivo", "saude", "saude_coletivo", "odontologico",
          "residencial", "empresarial", "condominio",
          "rc_profissional", "rc_geral", "garantia", "fianca_locaticia",
          "viagem", "pet", "equipamentos", "cyber", "rural",
          "previdencia", "consorcio", "capitalizacao", "transporte", "frota",
          "acidentes_pessoais", "rc_obras", "rc_produtos", "rc_ambiental",
          "rc_empregador", "rc_operacoes", "eventos", "engenharia",
          "gestao", "lucros_cessantes"
        ]),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const tipo = await storage.createTipoSeguroMaster(validation.data!);
      res.status(201).json(tipo);
    } catch (error: any) {
      console.error("Error creating tipo de seguro:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Código já cadastrado" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/tipos-seguro/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      if (Object.keys(cleanedBody).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      const validation = validateBody(insertTipoSeguroMasterSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const tipo = await storage.updateTipoSeguroMaster(req.params.id, validation.data!);
      if (!tipo) {
        return res.status(404).json({ message: "Tipo de seguro não encontrado" });
      }
      res.json(tipo);
    } catch (error) {
      console.error("Error updating tipo de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/tipos-seguro/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteTipoSeguroMaster(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tipo de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Business Rule Templates
  // ============================================
  app.get("/api/admin/business-rules", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getAllBusinessRuleTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching business rules:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/business-rules/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const template = await storage.getBusinessRuleTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Regra de negócio não encontrada" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching business rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/business-rules", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertBusinessRuleTemplateSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        regra: z.object({}).passthrough(),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const template = await storage.createBusinessRuleTemplate(validation.data!);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating business rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/business-rules/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      if (Object.keys(cleanedBody).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      const validation = validateBody(insertBusinessRuleTemplateSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const template = await storage.updateBusinessRuleTemplate(req.params.id, validation.data!);
      if (!template) {
        return res.status(404).json({ message: "Regra de negócio não encontrada" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating business rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/business-rules/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteBusinessRuleTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting business rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin Routes - Seguradora Produtos
  // ============================================
  app.get("/api/admin/seguradora-produtos", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const produtos = await storage.getAllSeguradoraProdutos();
      res.json(produtos);
    } catch (error) {
      console.error("Error fetching seguradora produtos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/seguradoras/:seguradoraId/produtos", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const produtos = await storage.getSeguradoraProdutosBySeguradora(req.params.seguradoraId);
      res.json(produtos);
    } catch (error) {
      console.error("Error fetching seguradora produtos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/seguradora-produtos", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertSeguradoraProdutoSchema.extend({
        seguradoraId: z.string().min(1, "Seguradora é obrigatória"),
        tipoSeguroId: z.string().min(1, "Tipo de seguro é obrigatório"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const produto = await storage.createSeguradoraProduto(validation.data!);
      res.status(201).json(produto);
    } catch (error: any) {
      console.error("Error creating seguradora produto:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Produto já existe para esta seguradora" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/seguradora-produtos/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSeguradoraProduto(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting seguradora produto:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Dashboard Stats
  // ============================================
  app.get("/api/admin/stats", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getSaasAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Tenant Users Management
  // ============================================
  app.get("/api/admin/tenants/:tenantId/users", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsersByTenant(req.params.tenantId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:userId", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const cleanedBody = stripNullValues(req.body || {});
      const validation = validateBody(insertUserSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const user = await storage.updateUser(req.params.userId, validation.data!);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:userId", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteUser(req.params.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Toggle Tenant Active Status
  // ============================================
  app.patch("/api/admin/tenants/:id/toggle-active", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "Campo isActive deve ser boolean" });
      }
      
      const tenant = await storage.updateTenant(req.params.id, { isActive });
      if (!tenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error toggling tenant active status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Global SMTP Config
  // ============================================
  app.get("/api/admin/config/smtp", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const config = await storage.getSaasSmtpConfig();
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/config/smtp", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const { emailRemetente, nomeRemetente, porta, seguro, ...rest } = req.body;
      
      const mappedData = {
        ...rest,
        port: porta,
        secure: seguro,
        remetenteEmail: emailRemetente || null,
        remetenteNome: nomeRemetente || null,
      };
      
      const validation = validateBody(insertSaasSmtpConfigSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        host: z.string().min(1, "Host é obrigatório"),
        usuario: z.string().min(1, "Usuário é obrigatório"),
        senha: z.string().min(1, "Senha é obrigatória"),
      }), mappedData);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const config = await storage.upsertSaasSmtpConfig(validation.data!);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/config/smtp/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSaasSmtpConfig(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/config/smtp/test", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const { emailDestino } = req.body;
      
      if (!emailDestino) {
        return res.status(400).json({ message: "E-mail de destino é obrigatório" });
      }

      const smtpConfig = await storage.getSaasSmtpConfig();
      if (!smtpConfig || !smtpConfig.ativo) {
        return res.status(400).json({ message: "Configure e salve o SMTP antes de testar" });
      }

      const result = await sendTestEmail(smtpConfig, emailDestino);

      if (!result.success) {
        return res.status(500).json({ message: `Erro ao enviar e-mail de teste: ${result.error}` });
      }

      res.json({ success: true, message: "E-mail de teste enviado com sucesso!" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - ChatGPT API Config
  // ============================================
  app.get("/api/admin/config/chatgpt", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const config = await storage.getSaasChatgptConfig();
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching ChatGPT config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/config/chatgpt", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertSaasChatgptConfigSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        apiKey: z.string().min(1, "API Key é obrigatória"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const config = await storage.upsertSaasChatgptConfig(validation.data!);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error saving ChatGPT config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/config/chatgpt/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSaasChatgptConfig(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ChatGPT config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Evolution API Config
  // ============================================
  app.get("/api/admin/config/evolution", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const config = await storage.getSaasEvolutionConfig();
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching Evolution config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/config/evolution", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const validation = validateBody(insertSaasEvolutionConfigSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        instanceName: z.string().min(1, "Nome da instância é obrigatório"),
        endpoint: z.string().min(1, "Endpoint é obrigatório"),
        apiKey: z.string().min(1, "API Key é obrigatória"),
      }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const config = await storage.upsertSaasEvolutionConfig(validation.data!);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error saving Evolution config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/config/evolution/:id", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSaasEvolutionConfig(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Evolution config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // SaaS Admin - Resource Usage Tracking
  // ============================================
  
  // Get usage summary for all tenants (dashboard)
  app.get("/api/admin/usage-summary", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const summary = await storage.getUsageSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching usage summary:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all tenants with their usage data
  app.get("/api/admin/tenants-usage", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const usage = await storage.getAllTenantsUsage();
      res.json(usage);
    } catch (error) {
      console.error("Error fetching all tenants usage:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get usage for specific tenant
  app.get("/api/admin/tenants/:tenantId/usage", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const usage = await storage.getTenantUsage(req.params.tenantId);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching tenant usage:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if tenant can add user (for validation)
  app.get("/api/admin/tenants/:tenantId/can-add-user", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.canAddUser(req.params.tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error checking user limit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if tenant can add client (for validation)
  app.get("/api/admin/tenants/:tenantId/can-add-client", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.canAddClient(req.params.tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error checking client limit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if tenant can add policy (for validation)
  app.get("/api/admin/tenants/:tenantId/can-add-policy", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.canAddPolicy(req.params.tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error checking policy limit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if tenant can add connection (for validation)
  app.get("/api/admin/tenants/:tenantId/can-add-connection", isEmailAuthenticated, isSaasAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.canAddConnection(req.params.tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error checking connection limit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Routes - Apólices (Policies)
  // ============================================
  app.get("/api/tenant/apolices", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const policies = await storage.getTenantPolicies(tenantId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching tenant policies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/apolices", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      
      // Check policy limit
      const limitCheck = await checkPolicyLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message || "Limite de apólices atingido para este plano" });
      }
      
      const validation = validateBody(insertTenantPolicySchema, { ...req.body, tenantId });
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const policy = await storage.createTenantPolicy(validation.data!);
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating tenant policy:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Routes - Channel Connections (WhatsApp/Evolution)
  // ============================================
  app.get("/api/tenant/connections", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const connections = await storage.getTenantConnections(tenantId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching tenant connections:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/connections", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      
      // Check connection limit
      const limitCheck = await checkConnectionLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message || "Limite de conexões atingido para este plano" });
      }
      
      const validation = validateBody(insertTenantChannelConnectionSchema, { ...req.body, tenantId });
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const connection = await storage.createChannelConnection(validation.data!);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating tenant connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tenant/connections/:id/status", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status é obrigatório" });
      }
      
      await storage.updateConnectionStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating connection status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // AI Token Usage Tracking
  // ============================================
  app.get("/api/tenant/token-usage", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const usage = await storage.getCurrentMonthTokenUsage(tenantId);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching token usage:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/token-usage", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { tokens } = req.body;
      
      if (typeof tokens !== 'number' || tokens <= 0) {
        return res.status(400).json({ message: "Tokens deve ser um número positivo" });
      }
      
      // Check token limit before consuming
      const limitCheck = await checkTokenLimit(tenantId, tokens);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message || "Limite de tokens IA atingido para este mês" });
      }
      
      await storage.addTokenUsage(tenantId, tokens);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording token usage:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Routes - Contatos personalizados de seguradoras
  // ============================================
  app.get("/api/tenant/seguradora-contatos", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const contatos = await storage.getTenantSeguradoraContatos(tenantId);
      res.json(contatos);
    } catch (error) {
      console.error("Error fetching tenant seguradora contatos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tenant/seguradora-contatos/:seguradoraId", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const contato = await storage.getTenantSeguradoraContato(tenantId, req.params.seguradoraId);
      if (!contato) {
        return res.status(404).json({ message: "Contato não encontrado" });
      }
      res.json(contato);
    } catch (error) {
      console.error("Error fetching tenant seguradora contato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/tenant/seguradora-contatos/:seguradoraId", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      
      const seguradora = await storage.getSeguradoraMaster(req.params.seguradoraId);
      if (!seguradora) {
        return res.status(400).json({ message: "Seguradora não encontrada" });
      }
      
      const cleanedBody = stripNullValues(req.body || {});
      const validation = validateBody(insertTenantSeguradoraContatoSchema.partial(), cleanedBody);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      
      const contato = await storage.upsertTenantSeguradoraContato({
        ...validation.data!,
        tenantId,
        seguradoraId: req.params.seguradoraId,
      });
      res.json(contato);
    } catch (error) {
      console.error("Error saving tenant seguradora contato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tenant/seguradora-contatos/:id", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.db.delete(storage.tenantSeguradoraContatos).where(
        sql`${storage.tenantSeguradoraContatos.id} = ${req.params.id} AND ${storage.tenantSeguradoraContatos.tenantId} = ${tenantId}`
      );
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant seguradora contato:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tenant Seguradora Senhas (System Passwords)
  app.get("/api/tenant/seguradora-senhas/:seguradoraId", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const senhas = await storage.db.select().from(storage.tenantSeguradoraSenhas).where(
        sql`${storage.tenantSeguradoraSenhas.tenantId} = ${tenantId} AND ${storage.tenantSeguradoraSenhas.seguradoraId} = ${req.params.seguradoraId}`
      );
      res.json(senhas.map(s => ({ ...s, senha: s.senha ? "***REDACTED***" : null })));
    } catch (error) {
      console.error("Error fetching senhas:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/seguradora-senhas", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { seguradoraId, nomeSistema, url, usuario, senha } = req.body;
      const novaSenh = await storage.db.insert(storage.tenantSeguradoraSenhas).values({
        id: sql`gen_random_uuid()`,
        tenantId,
        seguradoraId,
        nomeSistema,
        url,
        usuario,
        senha,
      }).returning();
      res.json(novaSenh[0]);
    } catch (error) {
      console.error("Error creating senha:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tenant/seguradora-senhas/:id", isEmailAuthenticated, requireTenant, isCorretorOrAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.db.delete(storage.tenantSeguradoraSenhas).where(
        sql`${storage.tenantSeguradoraSenhas.id} = ${req.params.id} AND ${storage.tenantSeguradoraSenhas.tenantId} = ${tenantId}`
      );
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting senha:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tenant Seguradora Telefones
  app.get("/api/tenant/seguradora-telefones/:seguradoraId", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const telefones = await storage.db.select().from(storage.tenantSeguradoraTelefones).where(
        sql`${storage.tenantSeguradoraTelefones.tenantId} = ${tenantId} AND ${storage.tenantSeguradoraTelefones.seguradoraId} = ${req.params.seguradoraId}`
      );
      res.json(telefones);
    } catch (error) {
      console.error("Error fetching telefones:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/seguradora-telefones", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { seguradoraId, tipoTelefone, canalContato, valor } = req.body;
      const novoTel = await storage.db.insert(storage.tenantSeguradoraTelefones).values({
        id: sql`gen_random_uuid()`,
        tenantId,
        seguradoraId,
        tipoTelefone,
        canalContato,
        valor,
      }).returning();
      res.json(novoTel[0]);
    } catch (error) {
      console.error("Error creating telefone:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tenant/seguradora-telefones/:id", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.db.delete(storage.tenantSeguradoraTelefones).where(
        sql`${storage.tenantSeguradoraTelefones.id} = ${req.params.id} AND ${storage.tenantSeguradoraTelefones.tenantId} = ${tenantId}`
      );
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting telefone:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Public Routes - Seguradoras e Tipos de Seguro (read-only para tenants)
  // ============================================
  app.get("/api/seguradoras", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const seguradoras = await storage.getAllSeguradorasMaster();
      res.json(seguradoras.filter(s => s.ativo));
    } catch (error) {
      console.error("Error fetching seguradoras:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/seguradoras/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const seguradora = await storage.getSeguradoraMaster(id);
      if (!seguradora || !seguradora.ativo) {
        return res.status(404).json({ message: "Seguradora não encontrada" });
      }
      res.json(seguradora);
    } catch (error) {
      console.error("Error fetching seguradora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tipos-seguro", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const tipos = await storage.getAllTiposSeguroMaster();
      const sorted = tipos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      res.json(sorted.filter(t => t.ativo));
    } catch (error) {
      console.error("Error fetching tipos de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tipos-seguro/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tipoSeguro = await storage.getTipoSeguroMaster(id);
      if (!tipoSeguro || !tipoSeguro.ativo) {
        return res.status(404).json({ message: "Tipo de seguro não encontrado" });
      }
      res.json(tipoSeguro);
    } catch (error) {
      console.error("Error fetching tipo de seguro:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/seguradora-produtos", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const produtos = await storage.getAllSeguradoraProdutos();
      res.json(produtos.filter(p => p.ativo));
    } catch (error) {
      console.error("Error fetching seguradora produtos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public route for tenants to view active business rules (from SaaS Master)
  app.get("/api/regras-negocio", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const rules = await storage.getAllBusinessRuleTemplates();
      const tipos = await storage.getAllTiposSeguroMaster();
      
      // Return all rules with tipo seguro name enrichment
      const enrichedRules = rules.map(rule => ({
        ...rule,
        tipoSeguroNome: rule.tipoSeguroId 
          ? tipos.find(t => t.id === rule.tipoSeguroId)?.nome || "Desconhecido"
          : "Todos os produtos",
      }));
      
      res.json(enrichedRules);
    } catch (error) {
      console.error("Error fetching business rules:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create business rule
  app.post("/api/regras-negocio", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { nome, descricao, tipoPessoa, tipoSeguroId, prioridade, condicoes, scoreBonus, regras, ativo } = req.body;
      
      if (!nome) {
        return res.status(400).json({ message: "Nome é obrigatório" });
      }
      
      const rule = await storage.createBusinessRuleTemplate({
        nome,
        descricao: descricao || null,
        tipoPessoa: tipoPessoa || "ambos",
        tipoSeguroId: tipoSeguroId || null,
        prioridade: prioridade || 0,
        condicoes: condicoes || [],
        scoreBonus: scoreBonus || 10,
        regras: regras || {},
        ativo: ativo !== false,
      });
      
      res.json(rule);
    } catch (error) {
      console.error("Error creating business rule:", error);
      res.status(500).json({ message: "Erro ao criar regra" });
    }
  });

  // Update business rule
  app.put("/api/regras-negocio/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nome, descricao, tipoPessoa, tipoSeguroId, prioridade, condicoes, scoreBonus, regras, ativo } = req.body;
      
      const rule = await storage.updateBusinessRuleTemplate(id, {
        nome,
        descricao: descricao || null,
        tipoPessoa,
        tipoSeguroId: tipoSeguroId || null,
        prioridade,
        condicoes,
        scoreBonus,
        regras,
        ativo,
      });
      
      if (!rule) {
        return res.status(404).json({ message: "Regra não encontrada" });
      }
      
      res.json(rule);
    } catch (error) {
      console.error("Error updating business rule:", error);
      res.status(500).json({ message: "Erro ao atualizar regra" });
    }
  });

  // Delete business rule
  app.delete("/api/regras-negocio/:id", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteBusinessRuleTemplate(id);
      res.json({ message: "Regra removida com sucesso" });
    } catch (error) {
      console.error("Error deleting business rule:", error);
      res.status(500).json({ message: "Erro ao remover regra" });
    }
  });

  // Catalog search: get all relationships for building catalog views
  app.get("/api/catalogo", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const [seguradoras, tiposSeguro, vinculacoes] = await Promise.all([
        storage.getAllSeguradorasMaster(),
        storage.getAllTiposSeguroMaster(),
        storage.getAllSeguradoraProdutos(),
      ]);

      const activeSeguradoras = seguradoras.filter(s => s.ativo);
      const activeTipos = tiposSeguro.filter(t => t.ativo);
      const activeVinculacoes = vinculacoes.filter(v => v.ativo);

      // Build lookup maps
      const seguradoraMap = new Map(activeSeguradoras.map(s => [s.id, s]));
      const tipoMap = new Map(activeTipos.map(t => [t.id, t]));

      // Group vinculacoes by produto
      const produtoParaSeguradoras: Record<string, any[]> = {};
      for (const tipo of activeTipos) {
        produtoParaSeguradoras[tipo.id] = [];
      }
      for (const v of activeVinculacoes) {
        const seguradora = seguradoraMap.get(v.seguradoraId);
        if (seguradora && produtoParaSeguradoras[v.tipoSeguroId]) {
          produtoParaSeguradoras[v.tipoSeguroId].push({
            seguradoraId: v.seguradoraId,
            seguradoraNome: seguradora.nome,
            nomeProduto: v.nomeProduto,
          });
        }
      }

      // Group vinculacoes by seguradora
      const seguradoraParaProdutos: Record<string, any[]> = {};
      for (const seg of activeSeguradoras) {
        seguradoraParaProdutos[seg.id] = [];
      }
      for (const v of activeVinculacoes) {
        const tipo = tipoMap.get(v.tipoSeguroId);
        if (tipo && seguradoraParaProdutos[v.seguradoraId]) {
          seguradoraParaProdutos[v.seguradoraId].push({
            tipoSeguroId: v.tipoSeguroId,
            tipoSeguroNome: tipo.nome,
            categoria: tipo.categoria,
            nomeProduto: v.nomeProduto,
          });
        }
      }

      res.json({
        seguradoras: activeSeguradoras,
        tiposSeguro: activeTipos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
        produtoParaSeguradoras,
        seguradoraParaProdutos,
      });
    } catch (error) {
      console.error("Error fetching catalog:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search insurers by product type
  app.get("/api/catalogo/seguradoras-por-produto/:tipoSeguroId", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { tipoSeguroId } = req.params;
      
      const tipoSeguro = await storage.getTipoSeguroMaster(tipoSeguroId);
      if (!tipoSeguro || !tipoSeguro.ativo) {
        return res.status(404).json({ message: "Tipo de seguro não encontrado" });
      }

      const vinculacoes = await storage.getAllSeguradoraProdutos();
      const seguradoras = await storage.getAllSeguradorasMaster();
      
      const seguradoraMap = new Map(seguradoras.map(s => [s.id, s]));
      
      const resultado = vinculacoes
        .filter(v => v.tipoSeguroId === tipoSeguroId && v.ativo)
        .map(v => {
          const seg = seguradoraMap.get(v.seguradoraId);
          if (!seg || !seg.ativo) return null;
          return {
            seguradora: seg,
            nomeProduto: v.nomeProduto,
            observacoes: v.observacoes,
          };
        })
        .filter(Boolean);

      res.json({
        tipoSeguro,
        seguradoras: resultado,
        total: resultado.length,
      });
    } catch (error) {
      console.error("Error searching seguradoras by produto:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search products by insurer
  app.get("/api/catalogo/produtos-por-seguradora/:seguradoraId", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const { seguradoraId } = req.params;
      
      const seguradora = await storage.getSeguradoraMaster(seguradoraId);
      if (!seguradora || !seguradora.ativo) {
        return res.status(404).json({ message: "Seguradora não encontrada" });
      }

      const vinculacoes = await storage.getSeguradoraProdutosBySeguradora(seguradoraId);
      const tiposSeguro = await storage.getAllTiposSeguroMaster();
      
      const tipoMap = new Map(tiposSeguro.map(t => [t.id, t]));
      
      const resultado = vinculacoes
        .filter(v => v.ativo)
        .map(v => {
          const tipo = tipoMap.get(v.tipoSeguroId);
          if (!tipo || !tipo.ativo) return null;
          return {
            tipoSeguro: tipo,
            nomeProduto: v.nomeProduto,
            observacoes: v.observacoes,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => (a.tipoSeguro.ordem || 0) - (b.tipoSeguro.ordem || 0));

      res.json({
        seguradora,
        produtos: resultado,
        total: resultado.length,
      });
    } catch (error) {
      console.error("Error searching produtos by seguradora:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Public Routes - Planos (público para signup)
  // ============================================
  app.get("/api/public/planos", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans.filter(p => p.status === "ativo"));
    } catch (error) {
      console.error("Error fetching public plans:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Signup - Criar tenant e associar usuário
  // ============================================
  app.post("/api/tenant/signup", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.tenantId) {
        return res.status(400).json({ message: "Usuário já está associado a uma corretora" });
      }

      const { nome, cnpj, email, telefone, planId } = req.body;

      if (!nome || nome.trim().length < 3) {
        return res.status(400).json({ message: "Nome da corretora é obrigatório (mínimo 3 caracteres)" });
      }

      const slug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50) + "-" + Date.now().toString(36);

      let plan = null;
      if (planId) {
        plan = await storage.getSubscriptionPlan(planId);
        if (!plan) {
          return res.status(400).json({ message: "Plano selecionado não existe" });
        }
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await storage.createTenant({
        nome: nome.trim(),
        slug,
        cnpj: cnpj || null,
        email: email || user.email || null,
        telefone: telefone || null,
        planId: planId || null,
        status: "trial",
        trialEndsAt,
      });

      const updatedUser = await storage.upsertUser({
        ...user,
        tenantId: tenant.id,
        role: "tenant_admin",
      });

      res.status(201).json({
        message: "Corretora criada com sucesso!",
        tenant,
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CNPJ já cadastrado por outra corretora" });
      }
      res.status(500).json({ message: "Erro ao criar corretora" });
    }
  });

  // ============================================
  // Tenant Admin Routes - Gerenciamento do Tenant
  // ============================================
  app.get("/api/tenant/info", isEmailAuthenticated, requireTenant, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      
      let plan = null;
      if (tenant.planId) {
        plan = await storage.getSubscriptionPlan(tenant.planId);
      }

      const users = await storage.getUsersByTenant(tenantId);
      const clientesPF = await storage.getAllPessoasFisicas(tenantId);
      const clientesPJ = await storage.getAllPessoasJuridicas(tenantId);
      
      const totalClientes = clientesPF.length + clientesPJ.length;
      const apolicesCount = await storage.countTenantPolicies(tenantId);
      const tokensUsage = await storage.getCurrentMonthTokenUsage(tenantId);
      const connectionsCount = await storage.countActiveConnections(tenantId);

      const getAlertStatus = (used: number, limit: number | null): 'ok' | 'warning' | 'exceeded' | 'unlimited' => {
        if (limit === null) return 'unlimited';
        const percent = (used / limit) * 100;
        if (percent >= 100) return 'exceeded';
        if (percent >= 80) return 'warning';
        return 'ok';
      };

      const limiteUsuarios = plan?.maxUsuarios ?? null;
      const limiteClientes = plan?.maxClientes ?? null;
      const limiteApolices = plan?.maxApolices ?? null;
      const limiteTokensIa = plan?.maxTokensIa ?? null;
      const limiteConexoes = plan?.maxConexoesEvolution ?? null;

      res.json({
        tenant,
        plan,
        stats: {
          totalUsuarios: users.length,
          totalClientes,
          totalApolices: apolicesCount,
          totalTokensIa: tokensUsage,
          totalConexoes: connectionsCount,
          clientesPF: clientesPF.length,
          clientesPJ: clientesPJ.length,
          limiteUsuarios,
          limiteClientes,
          limiteApolices,
          limiteTokensIa,
          limiteConexoes,
        },
        alerts: {
          usuarios: getAlertStatus(users.length, limiteUsuarios),
          clientes: getAlertStatus(totalClientes, limiteClientes),
          apolices: getAlertStatus(apolicesCount, limiteApolices),
          tokensIa: getAlertStatus(tokensUsage, limiteTokensIa),
          conexoes: getAlertStatus(connectionsCount, limiteConexoes),
        },
      });
    } catch (error) {
      console.error("Error fetching tenant info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tenant/info", isEmailAuthenticated, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { nome, cnpj, email, telefone, logoUrl } = req.body;

      const cleanedBody = stripNullValues({ nome, cnpj, email, telefone, logoUrl });
      
      const tenant = await storage.updateTenant(tenantId, cleanedBody);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      res.json(tenant);
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CNPJ já cadastrado por outra corretora" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tenant/users", isEmailAuthenticated, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const users = await storage.getUsersByTenant(tenantId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tenant/users/:userId/role", isEmailAuthenticated, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { userId } = req.params;
      const { role } = req.body;

      if (!["corretor", "tenant_admin"].includes(role)) {
        return res.status(400).json({ message: "Role inválida. Use 'corretor' ou 'tenant_admin'" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== tenantId) {
        return res.status(404).json({ message: "Usuário não encontrado nesta corretora" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        role,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/change-plan", isEmailAuthenticated, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "ID do plano é obrigatório" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan || plan.status !== "ativo") {
        return res.status(400).json({ message: "Plano não encontrado ou inativo" });
      }

      const tenant = await storage.updateTenant(tenantId, {
        planId,
        status: "ativo",
        subscriptionStartDate: new Date(),
      });

      res.json({
        message: "Plano alterado com sucesso!",
        tenant,
        plan,
      });
    } catch (error) {
      console.error("Error changing plan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate provisional password for user (tenant admin or saas admin)
  app.post("/api/tenant/users/:userId/reset-password", isEmailAuthenticated, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Tenant admin can only reset passwords for users in their tenant
      if (req.userRole !== "saas_admin" && user.tenantId !== tenantId) {
        return res.status(403).json({ message: "Sem permissão para alterar senha deste usuário" });
      }

      // Generate random provisional password (8 characters, alphanumeric)
      const provisionalPassword = crypto.randomBytes(4).toString("hex").toUpperCase();
      
      // Hash and update password
      const passwordHash = await bcrypt.hash(provisionalPassword, 10);
      await storage.updateUserPassword(userId, passwordHash);

      res.json({
        message: "Senha provisória gerada com sucesso",
        provisionalPassword,
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Configuration - SMTP
  // ============================================
  
  app.get("/api/tenant/config/smtp", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const config = await storage.getTenantSmtpConfig(tenantId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching tenant SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/config/smtp", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      
      const validation = validateBody(insertTenantSmtpConfigSchema.extend({
        nome: z.string().min(1, "Nome é obrigatório"),
        host: z.string().min(1, "Host é obrigatório"),
        usuario: z.string().min(1, "Usuário é obrigatório"),
        senha: z.string().min(1, "Senha é obrigatória"),
      }).omit({ tenantId: true }), req.body);
      
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }

      const config = await storage.upsertTenantSmtpConfig({
        ...validation.data!,
        tenantId,
      });
      res.status(201).json(config);
    } catch (error) {
      console.error("Error saving tenant SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tenant/config/smtp", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      await storage.deleteTenantSmtpConfig(tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant SMTP config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/config/smtp/test", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { emailDestino } = req.body;
      
      if (!emailDestino) {
        return res.status(400).json({ message: "E-mail de destino é obrigatório" });
      }

      const smtpConfig = await storage.getTenantSmtpConfig(tenantId);
      if (!smtpConfig || !smtpConfig.ativo) {
        return res.status(400).json({ message: "Configure e salve o SMTP antes de testar" });
      }

      const result = await sendTestEmail(smtpConfig, emailDestino);

      if (!result.success) {
        return res.status(500).json({ message: `Erro ao enviar e-mail de teste: ${result.error}` });
      }

      res.json({ success: true, message: "E-mail de teste enviado com sucesso!" });
    } catch (error) {
      console.error("Error sending tenant test email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Tenant Configuration - Evolution API Connections
  // ============================================
  
  app.get("/api/tenant/config/evolution", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const connections = await storage.getTenantConnections(tenantId);
      const whatsappConnections = connections.filter(c => c.channelType === "whatsapp");
      res.json(whatsappConnections);
    } catch (error) {
      console.error("Error fetching tenant Evolution connections:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tenant/config/evolution", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      
      // Check connection limit
      const limitCheck = await storage.canAddConnection(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: `Limite de conexões atingido. Seu plano permite ${limitCheck.limit} conexões e você já possui ${limitCheck.current}.`,
          limitExceeded: true,
          current: limitCheck.current,
          limit: limitCheck.limit
        });
      }

      const { instanceName, phoneNumber } = req.body;
      
      if (!instanceName) {
        return res.status(400).json({ message: "Nome da instância é obrigatório" });
      }

      const connection = await storage.createChannelConnection({
        tenantId,
        channelType: "whatsapp",
        instanceName,
        phoneNumber: phoneNumber || null,
        status: "inativo",
      });
      
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating tenant Evolution connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tenant/config/evolution/:id", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { status } = req.body;
      
      // Verify connection belongs to tenant
      const connections = await storage.getTenantConnections(tenantId);
      const connection = connections.find(c => c.id === id);
      
      if (!connection) {
        return res.status(404).json({ message: "Conexão não encontrada" });
      }

      if (status) {
        await storage.updateConnectionStatus(id, status);
      }
      
      res.json({ message: "Conexão atualizada com sucesso" });
    } catch (error) {
      console.error("Error updating tenant Evolution connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tenant/config/evolution/:id", isEmailAuthenticated, requireTenant, isTenantAdmin, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      
      // Verify connection belongs to tenant
      const connections = await storage.getTenantConnections(tenantId);
      const connection = connections.find(c => c.id === id);
      
      if (!connection) {
        return res.status(404).json({ message: "Conexão não encontrada" });
      }

      await storage.deleteChannelConnection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant Evolution connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User changes their own password
  app.post("/api/account/change-password", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.currentUser as any;
      const userId = currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Verify current password
      const credentials = await storage.getAuthCredentials(userId);
      if (!credentials || !credentials.passwordHash) {
        return res.status(400).json({ message: "Credenciais não encontradas" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, credentials.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Update to new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(userId, newPasswordHash);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user account info
  app.get("/api/account", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.currentUser as any;
      const userId = currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update current user account info
  app.patch("/api/account", isEmailAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.currentUser as any;
      const userId = currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const { firstName, lastName } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName !== undefined ? firstName : user.firstName,
        lastName: lastName !== undefined ? lastName : user.lastName,
      });

      res.json({
        id: updatedUser?.id,
        email: updatedUser?.email,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        role: updatedUser?.role,
        tenantId: updatedUser?.tenantId,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
