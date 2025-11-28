import bcrypt from "bcrypt";
import crypto from "crypto";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { consultarCNPJ } from "./services/cnpj";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(hours: number = TOKEN_EXPIRY_HOURS): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function getEmailSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupEmailAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getEmailSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase());
          if (!user) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Conta desativada" });
          }

          // Check if tenant is active (skip for saas_admin and cliente roles)
          if (user.tenantId && user.role !== 'saas_admin' && user.role !== 'cliente') {
            const tenant = await storage.getTenant(user.tenantId);
            if (tenant && tenant.isActive === false) {
              return done(null, false, { message: "Sistema indisponível. Entre em contato com o administrador." });
            }
          }

          const credentials = await storage.getAuthCredentials(user.id);
          if (!credentials || !credentials.passwordHash) {
            return done(null, false, { message: "Conta não possui senha configurada" });
          }

          const isValid = await verifyPassword(password, credentials.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          await storage.updateUserLastLogin(user.id);

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => {
    cb(null, { id: user.id, email: user.email });
  });

  passport.deserializeUser(async (data: any, cb) => {
    try {
      if (!data || !data.id) {
        return cb(null, null);
      }
      const user = await storage.getUser(data.id);
      cb(null, user || null);
    } catch (error) {
      console.error("Deserialize error:", error);
      cb(null, null);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, tenantSlug } = req.body;
      const role = "corretor";

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Senha deve ter pelo menos 8 caracteres" });
      }

      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      let tenantId: string | undefined;
      if (tenantSlug) {
        const tenant = await storage.getTenantBySlug(tenantSlug);
        if (!tenant) {
          return res.status(400).json({ message: "Corretora não encontrada" });
        }
        
        // Check if tenant is active
        if (tenant.isActive === false) {
          return res.status(403).json({ message: "Corretora indisponível para novos cadastros" });
        }
        
        // Check user limit for tenant
        const userLimit = await storage.canAddUser(tenant.id);
        if (!userLimit.allowed) {
          return res.status(403).json({ message: userLimit.message });
        }
        
        tenantId = tenant.id;
      }

      const passwordHash = await hashPassword(password);

      const user = await storage.createUserWithCredentials({
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        tenantId,
        emailVerified: false,
        isActive: true,
      }, passwordHash);

      const token = generateToken();
      await storage.createAuthToken({
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt: getTokenExpiry(48),
      });

      res.status(201).json({
        message: "Conta criada com sucesso. Verifique seu email para ativar.",
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  app.get("/api/auth/consultar-cnpj/:cnpj", async (req, res) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }

      const cleanCnpj = cnpj.replace(/\D/g, "");
      if (cleanCnpj.length !== 14) {
        return res.status(400).json({ message: "CNPJ deve ter 14 dígitos" });
      }

      const result = await consultarCNPJ(cleanCnpj);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        success: true,
        dados: {
          cnpj: result.data!.cnpj,
          razaoSocial: result.data!.razaoSocial,
          nomeFantasia: result.data!.nomeFantasia,
          situacaoCadastral: result.data!.situacaoCadastral,
          dataInicioAtividade: result.data!.dataInicioAtividade,
          telefone: result.data!.telefone1 || result.data!.telefone2 || "",
          email: result.data!.email || "",
          cnaeFiscalDescricao: result.data!.cnaeFiscalDescricao,
        },
        endereco: {
          cep: result.data!.cep,
          logradouro: result.data!.logradouro,
          numero: result.data!.numero,
          complemento: result.data!.complemento,
          bairro: result.data!.bairro,
          cidade: result.data!.municipio,
          estado: result.data!.uf,
        },
      });
    } catch (error) {
      console.error("Erro ao consultar CNPJ:", error);
      res.status(500).json({ message: "Erro ao consultar CNPJ na Receita Federal" });
    }
  });

  app.post("/api/auth/register-corretora", async (req, res) => {
    try {
      const { 
        cnpj, 
        adminEmail, 
        adminPassword, 
        adminFirstName, 
        adminLastName,
        planId 
      } = req.body;

      if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
        return res.status(400).json({ message: "CNPJ inválido" });
      }

      if (!adminEmail) {
        return res.status(400).json({ message: "Email do administrador é obrigatório" });
      }

      if (!adminPassword || adminPassword.length < 8) {
        return res.status(400).json({ message: "Senha deve ter pelo menos 8 caracteres" });
      }

      if (!adminFirstName || !adminLastName) {
        return res.status(400).json({ message: "Nome completo do administrador é obrigatório" });
      }

      const existingUser = await storage.getUserByEmail(adminEmail.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Email do administrador já está cadastrado" });
      }

      const cleanCnpj = cnpj.replace(/\D/g, "");
      const existingTenant = await storage.getTenantByCnpj(cleanCnpj);
      if (existingTenant) {
        return res.status(400).json({ message: "CNPJ já cadastrado por outra corretora" });
      }

      const cnpjResult = await consultarCNPJ(cleanCnpj);
      if (!cnpjResult.success || !cnpjResult.data) {
        return res.status(400).json({ 
          message: cnpjResult.error || "Não foi possível validar o CNPJ na Receita Federal" 
        });
      }

      const cnpjData = cnpjResult.data;
      
      const returnedCnpj = cnpjData.cnpj?.replace(/\D/g, "");
      if (returnedCnpj !== cleanCnpj) {
        return res.status(400).json({ 
          message: "CNPJ retornado pela Receita Federal não corresponde ao informado" 
        });
      }

      if (cnpjData.situacaoCadastral?.toLowerCase() !== "ativa") {
        return res.status(400).json({ 
          message: `CNPJ com situação "${cnpjData.situacaoCadastral}". Apenas empresas ativas podem se cadastrar.` 
        });
      }

      let plan = null;
      if (planId) {
        plan = await storage.getSubscriptionPlan(planId);
        if (!plan) {
          return res.status(400).json({ message: "Plano selecionado não existe" });
        }
      } else {
        const plans = await storage.getAllSubscriptionPlans();
        plan = plans.find(p => p.nome.toLowerCase().includes("starter")) || plans[0];
      }

      const razaoSocial = cnpjData.razaoSocial || "Corretora";
      const nomeFantasia = cnpjData.nomeFantasia;
      const nome = nomeFantasia || razaoSocial;
      const slug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50) + "-" + Date.now().toString(36);

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await storage.createTenant({
        nome: razaoSocial.trim(),
        slug,
        cnpj: cleanCnpj,
        email: cnpjData.email || adminEmail,
        telefone: cnpjData.telefone1 || cnpjData.telefone2 || null,
        planId: plan?.id || null,
        status: "trial",
        trialEndsAt,
      });

      const passwordHash = await hashPassword(adminPassword);

      const user = await storage.createUserWithCredentials({
        email: adminEmail.toLowerCase(),
        firstName: adminFirstName,
        lastName: adminLastName,
        role: "tenant_admin",
        tenantId: tenant.id,
        emailVerified: false,
        isActive: true,
      }, passwordHash);

      const token = generateToken();
      await storage.createAuthToken({
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt: getTokenExpiry(48),
      });

      res.status(201).json({
        message: "Corretora cadastrada com sucesso! Verifique seu email para ativar a conta.",
        tenant: { id: tenant.id, nome: tenant.nome, slug: tenant.slug },
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      console.error("Error registering corretora:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CNPJ já cadastrado por outra corretora" });
      }
      res.status(500).json({ message: error.message || "Erro ao cadastrar corretora" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro interno" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Erro ao iniciar sessão" });
        }
        return res.json({
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/portal/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro interno" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      if (user.role !== "cliente") {
        return res.status(403).json({ message: "Acesso negado. Use o portal de corretores." });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Erro ao iniciar sessão" });
        }
        return res.json({
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao encerrar sessão" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return res.status(500).json({ message: "Erro ao destruir sessão" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logout realizado com sucesso" });
      });
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ message: "Se o email existir, você receberá instruções de recuperação" });
      }

      await storage.invalidateTokensByType(user.id, "password_reset");

      const token = generateToken();
      await storage.createAuthToken({
        userId: user.id,
        token,
        type: "password_reset",
        expiresAt: getTokenExpiry(1),
      });

      res.json({ message: "Se o email existir, você receberá instruções de recuperação" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Senha deve ter pelo menos 8 caracteres" });
      }

      const authToken = await storage.getValidAuthToken(token, "password_reset");
      if (!authToken) {
        return res.status(400).json({ message: "Link expirado ou inválido" });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(authToken.userId, passwordHash);
      await storage.markTokenAsUsed(authToken.id);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      const authToken = await storage.getValidAuthToken(token, "email_verification");
      if (!authToken) {
        return res.status(400).json({ message: "Link expirado ou inválido" });
      }

      await storage.verifyUserEmail(authToken.userId);
      await storage.markTokenAsUsed(authToken.id);

      res.json({ message: "Email verificado com sucesso" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Erro ao verificar email" });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      emailVerified: user.emailVerified,
    });
  });

  app.get("/api/auth/user/roles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    try {
      const user = req.user as any;
      const roles = await storage.getUserRoles(user.id);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Erro ao buscar roles" });
    }
  });
}

export const isEmailAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  // Populate user context for downstream middleware
  const user = req.user as any;
  (req as any).currentUser = user;
  (req as any).userRole = user.role || "corretor";
  (req as any).tenantId = user.tenantId || undefined;
  
  next();
};

export const isClientPortalUser: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  const user = req.user as any;
  const roles = await storage.getUserRoles(user.id);
  
  const hasClientRole = roles.some(r => r.role === "cliente");
  if (!hasClientRole) {
    return res.status(403).json({ message: "Acesso negado ao portal do cliente" });
  }
  
  next();
};
