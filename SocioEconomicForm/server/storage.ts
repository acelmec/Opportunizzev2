import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  enderecos,
  pessoasFisicas,
  pessoasJuridicas,
  dependentes,
  socios,
  funcionarios,
  patrimonios,
  oportunidades,
  interacoes,
  convites,
  smtpConfigs,
  whatsappConfigs,
  subscriptionPlans,
  tenants,
  seguradorasMaster,
  tiposSeguroMaster,
  businessRuleTemplates,
  seguradoraProdutos,
  tenantSeguradoraContatos,
  authCredentials,
  userRolesTable,
  authTokens,
  clientPortalAccess,
  saasSmtpConfig,
  saasChatgptConfig,
  saasEvolutionConfig,
  tenantSmtpConfig,
  tenantPolicies,
  tenantAiTokenUsage,
  tenantChannelConnections,
  type User,
  type UpsertUser,
  type InsertEndereco,
  type Endereco,
  type InsertPessoaFisica,
  type PessoaFisica,
  type InsertPessoaJuridica,
  type PessoaJuridica,
  type InsertDependente,
  type Dependente,
  type InsertSocio,
  type Socio,
  type InsertFuncionario,
  type Funcionario,
  type InsertPatrimonio,
  type Patrimonio,
  type InsertOportunidade,
  type Oportunidade,
  type InsertInteracao,
  type Interacao,
  type InsertConvite,
  type Convite,
  type InsertSmtpConfig,
  type SmtpConfig,
  type InsertWhatsappConfig,
  type WhatsappConfig,
  type InsertSubscriptionPlan,
  type SubscriptionPlan,
  type InsertTenant,
  type Tenant,
  type InsertSeguradoraMaster,
  type SeguradoraMaster,
  type InsertTipoSeguroMaster,
  type TipoSeguroMaster,
  type InsertBusinessRuleTemplate,
  type BusinessRuleTemplate,
  type InsertSeguradoraProduto,
  type SeguradoraProduto,
  type InsertTenantSeguradoraContato,
  type TenantSeguradoraContato,
  type AuthCredentials,
  type InsertAuthCredentials,
  type UserRole,
  type InsertUserRole,
  type AuthToken,
  type InsertAuthToken,
  type ClientPortalAccess,
  type InsertClientPortalAccess,
  type SaasSmtpConfig,
  type InsertSaasSmtpConfig,
  type SaasChatgptConfig,
  type InsertSaasChatgptConfig,
  type SaasEvolutionConfig,
  type InsertSaasEvolutionConfig,
  type TenantPolicy,
  type InsertTenantPolicy,
  type TenantAiTokenUsage,
  type InsertTenantAiTokenUsage,
  type TenantChannelConnection,
  type InsertTenantChannelConnection,
  type TenantSmtpConfig,
  type InsertTenantSmtpConfig,
} from "@shared/schema";
import crypto from "crypto";

function cleanPartialUpdate<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  ) as Partial<T>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllPessoasFisicas(tenantId?: string): Promise<PessoaFisica[]>;
  getPessoaFisica(id: string, tenantId?: string): Promise<PessoaFisica | undefined>;
  createPessoaFisica(pf: InsertPessoaFisica, endereco?: InsertEndereco): Promise<PessoaFisica>;
  updatePessoaFisica(id: string, pf: Partial<InsertPessoaFisica>, tenantId?: string): Promise<PessoaFisica | undefined>;
  deletePessoaFisica(id: string, tenantId?: string): Promise<void>;
  
  getAllPessoasJuridicas(tenantId?: string): Promise<PessoaJuridica[]>;
  getPessoaJuridica(id: string, tenantId?: string): Promise<PessoaJuridica | undefined>;
  createPessoaJuridica(pj: InsertPessoaJuridica, endereco?: InsertEndereco): Promise<PessoaJuridica>;
  updatePessoaJuridica(id: string, pj: Partial<InsertPessoaJuridica>, tenantId?: string): Promise<PessoaJuridica | undefined>;
  deletePessoaJuridica(id: string, tenantId?: string): Promise<void>;
  
  createEndereco(endereco: InsertEndereco): Promise<Endereco>;
  
  getDependentesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Dependente[]>;
  createDependente(dep: InsertDependente): Promise<Dependente>;
  deleteDependente(id: string, pessoaFisicaId: string, tenantId?: string): Promise<boolean>;
  
  getSociosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Socio[]>;
  createSocio(socio: InsertSocio): Promise<Socio>;
  deleteSocio(id: string, pessoaJuridicaId: string, tenantId?: string): Promise<boolean>;
  
  getFuncionariosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Funcionario[]>;
  createFuncionario(func: InsertFuncionario): Promise<Funcionario>;
  deleteFuncionario(id: string, pessoaJuridicaId: string, tenantId?: string): Promise<boolean>;
  
  getAllPatrimonios(tenantId?: string): Promise<(Patrimonio & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]>;
  getPatrimoniosByPF(pessoaFisicaId: string, tenantId?: string): Promise<Patrimonio[]>;
  getPatrimoniosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Patrimonio[]>;
  createPatrimonio(pat: InsertPatrimonio): Promise<Patrimonio>;
  updatePatrimonio(id: string, pat: Partial<InsertPatrimonio>, tenantId?: string): Promise<Patrimonio | undefined>;
  deletePatrimonio(id: string, tenantId?: string): Promise<void>;
  
  getAllOportunidades(tenantId?: string): Promise<(Oportunidade & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]>;
  getOportunidadesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Oportunidade[]>;
  getOportunidadesByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Oportunidade[]>;
  createOportunidade(op: InsertOportunidade): Promise<Oportunidade>;
  updateOportunidade(id: string, op: Partial<InsertOportunidade>, tenantId?: string): Promise<Oportunidade | undefined>;
  deleteOportunidade(id: string, tenantId?: string): Promise<void>;
  
  getAllInteracoes(tenantId?: string): Promise<(Interacao & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]>;
  getInteracoesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Interacao[]>;
  getInteracoesByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Interacao[]>;
  createInteracao(int: InsertInteracao): Promise<Interacao>;
  deleteInteracao(id: string, tenantId?: string): Promise<void>;
  
  getDashboardStats(tenantId?: string): Promise<{
    totalPF: number;
    totalPJ: number;
    totalOportunidades: number;
    premioEstimado: number;
    oportunidadesPorStatus: { status: string; count: number }[];
    oportunidadesPorProduto: { produto: string; count: number }[];
    scoreMedioPorProduto: { produto: string; score: number }[];
  }>;
  
  // Convites
  getAllConvitesByCorretor(corretorId: string): Promise<Convite[]>;
  getAllConvitesByCorretorAndTenant(corretorId: string, tenantId: string): Promise<Convite[]>;
  getConviteByToken(token: string): Promise<Convite | undefined>;
  getConviteById(id: string): Promise<Convite | undefined>;
  createConvite(convite: InsertConvite): Promise<Convite>;
  updateConviteStatus(id: string, status: string, clienteUserId?: string): Promise<Convite | undefined>;
  deleteConvite(id: string): Promise<void>;
  
  // SMTP Config
  getSmtpConfigByUser(userId: string): Promise<SmtpConfig | undefined>;
  upsertSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig>;
  deleteSmtpConfig(userId: string): Promise<void>;
  
  // WhatsApp Config
  getWhatsappConfigByUser(userId: string): Promise<WhatsappConfig | undefined>;
  upsertWhatsappConfig(config: InsertWhatsappConfig): Promise<WhatsappConfig>;
  deleteWhatsappConfig(userId: string): Promise<void>;
  
  // User by role
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  getAllClientes(corretorId: string): Promise<User[]>;
  
  // SaaS Admin - Subscription Plans
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<void>;
  
  // SaaS Admin - Tenants
  getAllTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<void>;
  
  // SaaS Admin - Seguradoras Master
  getAllSeguradorasMaster(): Promise<SeguradoraMaster[]>;
  getSeguradoraMaster(id: string): Promise<SeguradoraMaster | undefined>;
  createSeguradoraMaster(seguradora: InsertSeguradoraMaster): Promise<SeguradoraMaster>;
  updateSeguradoraMaster(id: string, seguradora: Partial<InsertSeguradoraMaster>): Promise<SeguradoraMaster | undefined>;
  deleteSeguradoraMaster(id: string): Promise<void>;
  
  // SaaS Admin - Tipos de Seguro Master
  getAllTiposSeguroMaster(): Promise<TipoSeguroMaster[]>;
  getTipoSeguroMaster(id: string): Promise<TipoSeguroMaster | undefined>;
  createTipoSeguroMaster(tipo: InsertTipoSeguroMaster): Promise<TipoSeguroMaster>;
  updateTipoSeguroMaster(id: string, tipo: Partial<InsertTipoSeguroMaster>): Promise<TipoSeguroMaster | undefined>;
  deleteTipoSeguroMaster(id: string): Promise<void>;
  
  // SaaS Admin - Business Rule Templates
  getAllBusinessRuleTemplates(): Promise<BusinessRuleTemplate[]>;
  getBusinessRuleTemplate(id: string): Promise<BusinessRuleTemplate | undefined>;
  createBusinessRuleTemplate(template: InsertBusinessRuleTemplate): Promise<BusinessRuleTemplate>;
  updateBusinessRuleTemplate(id: string, template: Partial<InsertBusinessRuleTemplate>): Promise<BusinessRuleTemplate | undefined>;
  deleteBusinessRuleTemplate(id: string): Promise<void>;
  
  // SaaS Admin - Seguradora Produtos (relação entre seguradoras e tipos de seguro)
  getAllSeguradoraProdutos(): Promise<SeguradoraProduto[]>;
  getSeguradoraProdutosBySeguradora(seguradoraId: string): Promise<SeguradoraProduto[]>;
  createSeguradoraProduto(produto: InsertSeguradoraProduto): Promise<SeguradoraProduto>;
  deleteSeguradoraProduto(id: string): Promise<void>;
  
  // Tenant - Contatos personalizados de seguradoras
  getTenantSeguradoraContatos(tenantId: string): Promise<TenantSeguradoraContato[]>;
  getTenantSeguradoraContato(tenantId: string, seguradoraId: string): Promise<TenantSeguradoraContato | undefined>;
  upsertTenantSeguradoraContato(contato: InsertTenantSeguradoraContato): Promise<TenantSeguradoraContato>;
  deleteTenantSeguradoraContato(tenantId: string, seguradoraId: string): Promise<void>;
  
  // Auth - Email Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getTenantByCnpj(cnpj: string): Promise<Tenant | undefined>;
  createUserWithCredentials(userData: Partial<UpsertUser>, passwordHash: string): Promise<User>;
  getAuthCredentials(userId: string): Promise<AuthCredentials | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;
  verifyUserEmail(userId: string): Promise<void>;
  createAuthToken(token: Omit<InsertAuthToken, "id">): Promise<AuthToken>;
  getValidAuthToken(token: string, type: string): Promise<AuthToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  invalidateTokensByType(userId: string, type: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  addUserRole(role: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: string, role: string, tenantId?: string): Promise<void>;
  getClientPortalAccess(userId: string, tenantId: string): Promise<ClientPortalAccess | undefined>;
  createClientPortalAccess(access: InsertClientPortalAccess): Promise<ClientPortalAccess>;
  
  // SaaS Admin - Global Configurations
  getSaasSmtpConfig(): Promise<SaasSmtpConfig | undefined>;
  upsertSaasSmtpConfig(config: InsertSaasSmtpConfig): Promise<SaasSmtpConfig>;
  deleteSaasSmtpConfig(id: string): Promise<void>;
  
  getSaasChatgptConfig(): Promise<SaasChatgptConfig | undefined>;
  upsertSaasChatgptConfig(config: InsertSaasChatgptConfig): Promise<SaasChatgptConfig>;
  deleteSaasChatgptConfig(id: string): Promise<void>;
  
  getSaasEvolutionConfig(): Promise<SaasEvolutionConfig | undefined>;
  upsertSaasEvolutionConfig(config: InsertSaasEvolutionConfig): Promise<SaasEvolutionConfig>;
  deleteSaasEvolutionConfig(id: string): Promise<void>;
  
  // SaaS Admin - Tenant User Management
  getAllUsersByTenant(tenantId: string): Promise<User[]>;
  updateUser(userId: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(userId: string): Promise<void>;
  
  // SaaS Admin - Dashboard Stats
  getSaasAdminStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalClientes: number;
    tenantsByPlan: { planName: string; count: number }[];
  }>;
  
  // Resource Usage Tracking
  getTenantUsage(tenantId: string): Promise<{
    tenantId: string;
    tenantName: string;
    planName: string | null;
    limits: { 
      maxUsuarios: number; 
      maxClientes: number;
      maxApolices: number | null;
      maxTokensIa: number | null;
      maxConexoesEvolution: number | null;
    };
    usage: { 
      usuarios: number; 
      clientesPF: number; 
      clientesPJ: number; 
      totalClientes: number;
      apolices: number;
      tokensIa: number;
      conexoesEvolution: number;
    };
    percentages: { 
      usuarios: number; 
      clientes: number;
      apolices: number | null;
      tokensIa: number | null;
      conexoesEvolution: number | null;
    };
    alerts: { 
      usuarios: 'ok' | 'warning' | 'exceeded'; 
      clientes: 'ok' | 'warning' | 'exceeded';
      apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      conexoesEvolution: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    };
  }>;
  getAllTenantsUsage(): Promise<Array<{
    tenantId: string;
    tenantName: string;
    planName: string | null;
    isActive: boolean;
    limits: { 
      maxUsuarios: number; 
      maxClientes: number;
      maxApolices: number | null;
      maxTokensIa: number | null;
      maxConexoesEvolution: number | null;
    };
    usage: { 
      usuarios: number; 
      clientesPF: number; 
      clientesPJ: number; 
      totalClientes: number;
      apolices: number;
      tokensIa: number;
      conexoesEvolution: number;
    };
    percentages: { 
      usuarios: number; 
      clientes: number;
      apolices: number | null;
      tokensIa: number | null;
      conexoesEvolution: number | null;
    };
    alerts: { 
      usuarios: 'ok' | 'warning' | 'exceeded'; 
      clientes: 'ok' | 'warning' | 'exceeded';
      apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      conexoesEvolution: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    };
  }>>;
  canAddUser(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number }>;
  canAddClient(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number }>;
  canAddPolicy(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }>;
  canConsumeTokens(tenantId: string, tokensToConsume: number): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }>;
  canAddConnection(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }>;
  
  // Token usage management
  getCurrentMonthTokenUsage(tenantId: string): Promise<number>;
  addTokenUsage(tenantId: string, tokens: number): Promise<void>;
  
  // Policy management
  countTenantPolicies(tenantId: string): Promise<number>;
  createTenantPolicy(policy: InsertTenantPolicy): Promise<TenantPolicy>;
  getTenantPolicies(tenantId: string): Promise<TenantPolicy[]>;
  
  // Channel connections management
  countActiveConnections(tenantId: string): Promise<number>;
  createChannelConnection(connection: InsertTenantChannelConnection): Promise<TenantChannelConnection>;
  getTenantConnections(tenantId: string): Promise<TenantChannelConnection[]>;
  updateConnectionStatus(connectionId: string, status: string): Promise<void>;
  deleteChannelConnection(connectionId: string): Promise<void>;
  
  // Tenant SMTP Configuration
  getTenantSmtpConfig(tenantId: string): Promise<TenantSmtpConfig | null>;
  upsertTenantSmtpConfig(config: InsertTenantSmtpConfig): Promise<TenantSmtpConfig>;
  deleteTenantSmtpConfig(tenantId: string): Promise<void>;
  
  getUsageSummary(): Promise<{
    totalTenants: number;
    tenantsAtLimit: number;
    tenantsNearLimit: number;
    totalUsersUsed: number;
    totalUsersLimit: number;
    totalClientesUsed: number;
    totalClientesLimit: number;
    totalApoliciesUsed: number;
    totalApoliciesLimit: number;
    totalTokensUsed: number;
    totalTokensLimit: number;
    totalConnectionsUsed: number;
    totalConnectionsLimit: number;
    tenantAlerts: Array<{
      tenantId: string;
      tenantName: string;
      type: 'usuarios' | 'clientes' | 'apolices' | 'tokens' | 'conexoes';
      severity: 'warning' | 'exceeded';
      used: number;
      limit: number;
    }>;
  }>;
  
  // Health Check for Docker/Kubernetes
  healthCheck?(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllPessoasFisicas(tenantId?: string): Promise<PessoaFisica[]> {
    if (tenantId) {
      return db.select().from(pessoasFisicas)
        .where(eq(pessoasFisicas.tenantId, tenantId))
        .orderBy(desc(pessoasFisicas.createdAt));
    }
    return db.select().from(pessoasFisicas).orderBy(desc(pessoasFisicas.createdAt));
  }

  async getPessoaFisica(id: string, tenantId?: string): Promise<PessoaFisica | undefined> {
    if (tenantId) {
      const [pf] = await db.select().from(pessoasFisicas)
        .where(and(eq(pessoasFisicas.id, id), eq(pessoasFisicas.tenantId, tenantId)));
      return pf;
    }
    const [pf] = await db.select().from(pessoasFisicas).where(eq(pessoasFisicas.id, id));
    return pf;
  }

  async createPessoaFisica(pf: InsertPessoaFisica, enderecoData?: InsertEndereco): Promise<PessoaFisica> {
    let enderecoId: string | null = null;
    
    if (enderecoData && enderecoData.cep) {
      const endereco = await this.createEndereco(enderecoData);
      enderecoId = endereco.id;
    }
    
    const scores = this.calculatePFScores(pf);
    
    const [created] = await db
      .insert(pessoasFisicas)
      .values({
        ...pf,
        enderecoId,
        ...scores,
      })
      .returning();
    
    return created;
  }

  async updatePessoaFisica(id: string, pf: Partial<InsertPessoaFisica>, tenantId?: string): Promise<PessoaFisica | undefined> {
    const scores = this.calculatePFScores(pf);
    
    const whereCondition = tenantId 
      ? and(eq(pessoasFisicas.id, id), eq(pessoasFisicas.tenantId, tenantId))
      : eq(pessoasFisicas.id, id);
    
    const [updated] = await db
      .update(pessoasFisicas)
      .set({ ...pf, ...scores, updatedAt: new Date() })
      .where(whereCondition)
      .returning();
    
    return updated;
  }

  async deletePessoaFisica(id: string, tenantId?: string): Promise<void> {
    const whereCondition = tenantId 
      ? and(eq(pessoasFisicas.id, id), eq(pessoasFisicas.tenantId, tenantId))
      : eq(pessoasFisicas.id, id);
    await db.delete(pessoasFisicas).where(whereCondition);
  }

  async getAllPessoasJuridicas(tenantId?: string): Promise<PessoaJuridica[]> {
    if (tenantId) {
      return db.select().from(pessoasJuridicas)
        .where(eq(pessoasJuridicas.tenantId, tenantId))
        .orderBy(desc(pessoasJuridicas.createdAt));
    }
    return db.select().from(pessoasJuridicas).orderBy(desc(pessoasJuridicas.createdAt));
  }

  async getPessoaJuridica(id: string, tenantId?: string): Promise<PessoaJuridica | undefined> {
    if (tenantId) {
      const [pj] = await db.select().from(pessoasJuridicas)
        .where(and(eq(pessoasJuridicas.id, id), eq(pessoasJuridicas.tenantId, tenantId)));
      return pj;
    }
    const [pj] = await db.select().from(pessoasJuridicas).where(eq(pessoasJuridicas.id, id));
    return pj;
  }

  async createPessoaJuridica(pj: InsertPessoaJuridica, enderecoData?: InsertEndereco): Promise<PessoaJuridica> {
    let enderecoSedeId: string | null = null;
    
    if (enderecoData && enderecoData.cep) {
      const endereco = await this.createEndereco(enderecoData);
      enderecoSedeId = endereco.id;
    }
    
    const scores = this.calculatePJScores(pj);
    
    const [created] = await db
      .insert(pessoasJuridicas)
      .values({
        ...pj,
        enderecoSedeId,
        ...scores,
      })
      .returning();
    
    return created;
  }

  async updatePessoaJuridica(id: string, pj: Partial<InsertPessoaJuridica>, tenantId?: string): Promise<PessoaJuridica | undefined> {
    const scores = this.calculatePJScores(pj);
    
    const whereCondition = tenantId 
      ? and(eq(pessoasJuridicas.id, id), eq(pessoasJuridicas.tenantId, tenantId))
      : eq(pessoasJuridicas.id, id);
    
    const [updated] = await db
      .update(pessoasJuridicas)
      .set({ ...pj, ...scores, updatedAt: new Date() })
      .where(whereCondition)
      .returning();
    
    return updated;
  }

  async deletePessoaJuridica(id: string, tenantId?: string): Promise<void> {
    const whereCondition = tenantId 
      ? and(eq(pessoasJuridicas.id, id), eq(pessoasJuridicas.tenantId, tenantId))
      : eq(pessoasJuridicas.id, id);
    await db.delete(pessoasJuridicas).where(whereCondition);
  }

  async createEndereco(endereco: InsertEndereco): Promise<Endereco> {
    const [created] = await db.insert(enderecos).values(endereco).returning();
    return created;
  }

  async getEndereco(id: string): Promise<Endereco | undefined> {
    const [endereco] = await db.select().from(enderecos).where(eq(enderecos.id, id));
    return endereco;
  }

  async getDependentesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Dependente[]> {
    if (tenantId) {
      const pf = await this.getPessoaFisica(pessoaFisicaId, tenantId);
      if (!pf) return [];
    }
    return db.select().from(dependentes).where(eq(dependentes.pessoaFisicaId, pessoaFisicaId));
  }

  async createDependente(dep: InsertDependente): Promise<Dependente> {
    const [created] = await db.insert(dependentes).values(dep).returning();
    return created;
  }

  async getDependente(id: string): Promise<Dependente | undefined> {
    const [dep] = await db.select().from(dependentes).where(eq(dependentes.id, id));
    return dep;
  }

  async deleteDependenteById(id: string): Promise<void> {
    await db.delete(dependentes).where(eq(dependentes.id, id));
  }

  async deleteDependente(id: string, pessoaFisicaId: string, tenantId?: string): Promise<boolean> {
    if (tenantId) {
      const pf = await this.getPessoaFisica(pessoaFisicaId, tenantId);
      if (!pf) return false;
    }
    const [dep] = await db.select().from(dependentes)
      .where(and(eq(dependentes.id, id), eq(dependentes.pessoaFisicaId, pessoaFisicaId)));
    if (!dep) return false;
    await db.delete(dependentes).where(eq(dependentes.id, id));
    return true;
  }

  async getSociosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Socio[]> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return [];
    }
    return db.select().from(socios).where(eq(socios.pessoaJuridicaId, pessoaJuridicaId));
  }

  async createSocio(socio: InsertSocio): Promise<Socio> {
    const [created] = await db.insert(socios).values(socio).returning();
    return created;
  }

  async deleteSocio(id: string, pessoaJuridicaId: string, tenantId?: string): Promise<boolean> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return false;
    }
    const [socio] = await db.select().from(socios)
      .where(and(eq(socios.id, id), eq(socios.pessoaJuridicaId, pessoaJuridicaId)));
    if (!socio) return false;
    await db.delete(socios).where(eq(socios.id, id));
    return true;
  }

  async getFuncionariosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Funcionario[]> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return [];
    }
    return db.select().from(funcionarios).where(eq(funcionarios.pessoaJuridicaId, pessoaJuridicaId));
  }

  async createFuncionario(func: InsertFuncionario): Promise<Funcionario> {
    const [created] = await db.insert(funcionarios).values(func).returning();
    return created;
  }

  async deleteFuncionario(id: string, pessoaJuridicaId: string, tenantId?: string): Promise<boolean> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return false;
    }
    const [func] = await db.select().from(funcionarios)
      .where(and(eq(funcionarios.id, id), eq(funcionarios.pessoaJuridicaId, pessoaJuridicaId)));
    if (!func) return false;
    await db.delete(funcionarios).where(eq(funcionarios.id, id));
    return true;
  }

  async getPatrimonio(id: string): Promise<Patrimonio | undefined> {
    const [pat] = await db.select().from(patrimonios).where(eq(patrimonios.id, id));
    return pat;
  }

  async getAllPatrimonios(tenantId?: string): Promise<(Patrimonio & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]> {
    const pats = tenantId
      ? await db.select().from(patrimonios).where(eq(patrimonios.tenantId, tenantId)).orderBy(desc(patrimonios.createdAt))
      : await db.select().from(patrimonios).orderBy(desc(patrimonios.createdAt));
    
    const result = await Promise.all(
      pats.map(async (p) => {
        let pessoaFisica: PessoaFisica | null = null;
        let pessoaJuridica: PessoaJuridica | null = null;
        
        if (p.pessoaFisicaId) {
          pessoaFisica = await this.getPessoaFisica(p.pessoaFisicaId) || null;
        }
        if (p.pessoaJuridicaId) {
          pessoaJuridica = await this.getPessoaJuridica(p.pessoaJuridicaId) || null;
        }
        
        return { ...p, pessoaFisica, pessoaJuridica };
      })
    );
    
    return result;
  }

  async getPatrimoniosByPF(pessoaFisicaId: string, tenantId?: string): Promise<Patrimonio[]> {
    if (tenantId) {
      const pf = await this.getPessoaFisica(pessoaFisicaId, tenantId);
      if (!pf) return [];
    }
    return db.select().from(patrimonios).where(eq(patrimonios.pessoaFisicaId, pessoaFisicaId));
  }

  async getPatrimoniosByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Patrimonio[]> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return [];
    }
    return db.select().from(patrimonios).where(eq(patrimonios.pessoaJuridicaId, pessoaJuridicaId));
  }

  async createPatrimonio(pat: InsertPatrimonio): Promise<Patrimonio> {
    const [created] = await db.insert(patrimonios).values(pat).returning();
    return created;
  }

  async updatePatrimonio(id: string, pat: Partial<InsertPatrimonio>, tenantId?: string): Promise<Patrimonio | undefined> {
    const whereCondition = tenantId 
      ? and(eq(patrimonios.id, id), eq(patrimonios.tenantId, tenantId))
      : eq(patrimonios.id, id);
    
    const [updated] = await db
      .update(patrimonios)
      .set({ ...pat, updatedAt: new Date() })
      .where(whereCondition)
      .returning();
    return updated;
  }

  async deletePatrimonio(id: string, tenantId?: string): Promise<void> {
    const whereCondition = tenantId 
      ? and(eq(patrimonios.id, id), eq(patrimonios.tenantId, tenantId))
      : eq(patrimonios.id, id);
    await db.delete(patrimonios).where(whereCondition);
  }

  async getAllOportunidades(tenantId?: string): Promise<(Oportunidade & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]> {
    const ops = tenantId
      ? await db.select().from(oportunidades).where(eq(oportunidades.tenantId, tenantId)).orderBy(desc(oportunidades.createdAt))
      : await db.select().from(oportunidades).orderBy(desc(oportunidades.createdAt));
    
    const result = await Promise.all(
      ops.map(async (o) => {
        let pessoaFisica: PessoaFisica | null = null;
        let pessoaJuridica: PessoaJuridica | null = null;
        
        if (o.pessoaFisicaId) {
          pessoaFisica = await this.getPessoaFisica(o.pessoaFisicaId) || null;
        }
        if (o.pessoaJuridicaId) {
          pessoaJuridica = await this.getPessoaJuridica(o.pessoaJuridicaId) || null;
        }
        
        return { ...o, pessoaFisica, pessoaJuridica };
      })
    );
    
    return result;
  }

  async getOportunidadesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Oportunidade[]> {
    if (tenantId) {
      const pf = await this.getPessoaFisica(pessoaFisicaId, tenantId);
      if (!pf) return [];
    }
    return db.select().from(oportunidades).where(eq(oportunidades.pessoaFisicaId, pessoaFisicaId));
  }

  async getOportunidadesByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Oportunidade[]> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return [];
    }
    return db.select().from(oportunidades).where(eq(oportunidades.pessoaJuridicaId, pessoaJuridicaId));
  }

  async createOportunidade(op: InsertOportunidade): Promise<Oportunidade> {
    const [created] = await db.insert(oportunidades).values(op).returning();
    return created;
  }

  async updateOportunidade(id: string, op: Partial<InsertOportunidade>, tenantId?: string): Promise<Oportunidade | undefined> {
    const whereCondition = tenantId 
      ? and(eq(oportunidades.id, id), eq(oportunidades.tenantId, tenantId))
      : eq(oportunidades.id, id);
    
    const [updated] = await db
      .update(oportunidades)
      .set({ ...op, updatedAt: new Date() })
      .where(whereCondition)
      .returning();
    return updated;
  }

  async deleteOportunidade(id: string, tenantId?: string): Promise<void> {
    const whereCondition = tenantId 
      ? and(eq(oportunidades.id, id), eq(oportunidades.tenantId, tenantId))
      : eq(oportunidades.id, id);
    await db.delete(oportunidades).where(whereCondition);
  }

  async getAllInteracoes(tenantId?: string): Promise<(Interacao & { pessoaFisica?: PessoaFisica | null; pessoaJuridica?: PessoaJuridica | null })[]> {
    const ints = tenantId
      ? await db.select().from(interacoes).where(eq(interacoes.tenantId, tenantId)).orderBy(desc(interacoes.createdAt))
      : await db.select().from(interacoes).orderBy(desc(interacoes.createdAt));
    
    const result = await Promise.all(
      ints.map(async (i) => {
        let pessoaFisica: PessoaFisica | null = null;
        let pessoaJuridica: PessoaJuridica | null = null;
        
        if (i.pessoaFisicaId) {
          pessoaFisica = await this.getPessoaFisica(i.pessoaFisicaId) || null;
        }
        if (i.pessoaJuridicaId) {
          pessoaJuridica = await this.getPessoaJuridica(i.pessoaJuridicaId) || null;
        }
        
        return { ...i, pessoaFisica, pessoaJuridica };
      })
    );
    
    return result;
  }

  async getInteracoesByPF(pessoaFisicaId: string, tenantId?: string): Promise<Interacao[]> {
    if (tenantId) {
      const pf = await this.getPessoaFisica(pessoaFisicaId, tenantId);
      if (!pf) return [];
    }
    return db.select().from(interacoes).where(eq(interacoes.pessoaFisicaId, pessoaFisicaId));
  }

  async getInteracoesByPJ(pessoaJuridicaId: string, tenantId?: string): Promise<Interacao[]> {
    if (tenantId) {
      const pj = await this.getPessoaJuridica(pessoaJuridicaId, tenantId);
      if (!pj) return [];
    }
    return db.select().from(interacoes).where(eq(interacoes.pessoaJuridicaId, pessoaJuridicaId));
  }

  async createInteracao(int: InsertInteracao): Promise<Interacao> {
    const [created] = await db.insert(interacoes).values(int).returning();
    return created;
  }

  async deleteInteracao(id: string, tenantId?: string): Promise<void> {
    const whereCondition = tenantId 
      ? and(eq(interacoes.id, id), eq(interacoes.tenantId, tenantId))
      : eq(interacoes.id, id);
    await db.delete(interacoes).where(whereCondition);
  }

  async getDashboardStats(tenantId?: string) {
    const pfQuery = tenantId 
      ? db.select({ count: sql<number>`count(*)` }).from(pessoasFisicas).where(eq(pessoasFisicas.tenantId, tenantId))
      : db.select({ count: sql<number>`count(*)` }).from(pessoasFisicas);
    const [pfCount] = await pfQuery;
    
    const pjQuery = tenantId
      ? db.select({ count: sql<number>`count(*)` }).from(pessoasJuridicas).where(eq(pessoasJuridicas.tenantId, tenantId))
      : db.select({ count: sql<number>`count(*)` }).from(pessoasJuridicas);
    const [pjCount] = await pjQuery;
    
    const opQuery = tenantId
      ? db.select({ count: sql<number>`count(*)` }).from(oportunidades).where(eq(oportunidades.tenantId, tenantId))
      : db.select({ count: sql<number>`count(*)` }).from(oportunidades);
    const [opCount] = await opQuery;
    
    const premioQuery = tenantId
      ? db.select({ total: sql<number>`COALESCE(SUM(premio_estimado), 0)` }).from(oportunidades).where(eq(oportunidades.tenantId, tenantId))
      : db.select({ total: sql<number>`COALESCE(SUM(premio_estimado), 0)` }).from(oportunidades);
    const [premioSum] = await premioQuery;

    const statusQuery = tenantId
      ? db.select({ status: oportunidades.status, count: sql<number>`count(*)` }).from(oportunidades).where(eq(oportunidades.tenantId, tenantId)).groupBy(oportunidades.status)
      : db.select({ status: oportunidades.status, count: sql<number>`count(*)` }).from(oportunidades).groupBy(oportunidades.status);
    const statusCounts = await statusQuery;

    const produtoQuery = tenantId
      ? db.select({ produto: oportunidades.produto, count: sql<number>`count(*)` }).from(oportunidades).where(eq(oportunidades.tenantId, tenantId)).groupBy(oportunidades.produto)
      : db.select({ produto: oportunidades.produto, count: sql<number>`count(*)` }).from(oportunidades).groupBy(oportunidades.produto);
    const produtoCounts = await produtoQuery;

    const pfListQuery = tenantId
      ? db.select().from(pessoasFisicas).where(eq(pessoasFisicas.tenantId, tenantId))
      : db.select().from(pessoasFisicas);
    const pfList = await pfListQuery;
    const scoreAverages: Record<string, { total: number; count: number }> = {
      vida: { total: 0, count: 0 },
      auto: { total: 0, count: 0 },
      residencial: { total: 0, count: 0 },
      rc_profissional: { total: 0, count: 0 },
      previdencia: { total: 0, count: 0 },
      saude: { total: 0, count: 0 },
    };

    pfList.forEach((pf) => {
      if (pf.scoreVida) {
        scoreAverages.vida.total += pf.scoreVida;
        scoreAverages.vida.count++;
      }
      if (pf.scoreAuto) {
        scoreAverages.auto.total += pf.scoreAuto;
        scoreAverages.auto.count++;
      }
      if (pf.scoreResidencial) {
        scoreAverages.residencial.total += pf.scoreResidencial;
        scoreAverages.residencial.count++;
      }
      if (pf.scoreRcProfissional) {
        scoreAverages.rc_profissional.total += pf.scoreRcProfissional;
        scoreAverages.rc_profissional.count++;
      }
      if (pf.scorePrevidencia) {
        scoreAverages.previdencia.total += pf.scorePrevidencia;
        scoreAverages.previdencia.count++;
      }
      if (pf.scoreSaude) {
        scoreAverages.saude.total += pf.scoreSaude;
        scoreAverages.saude.count++;
      }
    });

    const scoreMedioPorProduto = Object.entries(scoreAverages).map(([produto, data]) => ({
      produto,
      score: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));

    return {
      totalPF: Number(pfCount?.count || 0),
      totalPJ: Number(pjCount?.count || 0),
      totalOportunidades: Number(opCount?.count || 0),
      premioEstimado: Number(premioSum?.total || 0),
      oportunidadesPorStatus: statusCounts.map((s) => ({
        status: s.status || "novo",
        count: Number(s.count),
      })),
      oportunidadesPorProduto: produtoCounts.map((p) => ({
        produto: p.produto,
        count: Number(p.count),
      })),
      scoreMedioPorProduto,
    };
  }

  private calculatePFScores(pf: Partial<InsertPessoaFisica>): {
    scoreVida: number;
    scoreAuto: number;
    scoreResidencial: number;
    scoreRcProfissional: number;
    scorePrevidencia: number;
    scoreSaude: number;
  } {
    let scoreVida = 30;
    let scoreAuto = 30;
    let scoreResidencial = 30;
    let scoreRcProfissional = 20;
    let scorePrevidencia = 30;
    let scoreSaude = 30;

    const renda = Number(pf.rendaMensalBruta) || 0;

    if (renda > 10000) {
      scoreVida += 30;
      scoreAuto += 25;
      scoreResidencial += 25;
      scorePrevidencia += 30;
      scoreSaude += 20;
    } else if (renda > 5000) {
      scoreVida += 20;
      scoreAuto += 20;
      scoreResidencial += 20;
      scorePrevidencia += 20;
      scoreSaude += 15;
    } else if (renda > 2000) {
      scoreVida += 10;
      scoreAuto += 10;
      scoreResidencial += 10;
      scorePrevidencia += 10;
      scoreSaude += 10;
    }

    const deps = Number(pf.numeroDependentes) || 0;
    if (deps > 0) {
      scoreVida += Math.min(deps * 10, 30);
      scoreSaude += Math.min(deps * 8, 25);
    }

    if (pf.estadoCivil === "casado" || pf.estadoCivil === "uniao_estavel") {
      scoreVida += 15;
      scoreResidencial += 10;
    }

    const profissoes_risco = ["medico", "motorista", "seguranca", "construcao", "operacao_industrial"];
    if (pf.ocupacaoRisco && profissoes_risco.includes(pf.ocupacaoRisco)) {
      scoreRcProfissional += 40;
      scoreVida += 10;
    }

    return {
      scoreVida: Math.min(scoreVida, 100),
      scoreAuto: Math.min(scoreAuto, 100),
      scoreResidencial: Math.min(scoreResidencial, 100),
      scoreRcProfissional: Math.min(scoreRcProfissional, 100),
      scorePrevidencia: Math.min(scorePrevidencia, 100),
      scoreSaude: Math.min(scoreSaude, 100),
    };
  }

  private calculatePJScores(pj: Partial<InsertPessoaJuridica>): {
    scoreVidaColetiva: number;
    scoreSaudeColetiva: number;
    scorePatrimonial: number;
    scoreRc: number;
  } {
    let scoreVidaColetiva = 30;
    let scoreSaudeColetiva = 30;
    let scorePatrimonial = 30;
    let scoreRc = 30;

    const funcionarios = Number(pj.numeroFuncionarios) || 0;
    if (funcionarios > 50) {
      scoreVidaColetiva += 40;
      scoreSaudeColetiva += 40;
    } else if (funcionarios > 20) {
      scoreVidaColetiva += 30;
      scoreSaudeColetiva += 30;
    } else if (funcionarios > 5) {
      scoreVidaColetiva += 20;
      scoreSaudeColetiva += 20;
    }

    const faturamento = Number(pj.faturamentoMensal) || 0;
    if (faturamento > 500000) {
      scorePatrimonial += 40;
      scoreRc += 35;
    } else if (faturamento > 100000) {
      scorePatrimonial += 30;
      scoreRc += 25;
    } else if (faturamento > 30000) {
      scorePatrimonial += 20;
      scoreRc += 15;
    }

    if (pj.planoSaudeColetivo) {
      scoreSaudeColetiva += 20;
    }

    return {
      scoreVidaColetiva: Math.min(scoreVidaColetiva, 100),
      scoreSaudeColetiva: Math.min(scoreSaudeColetiva, 100),
      scorePatrimonial: Math.min(scorePatrimonial, 100),
      scoreRc: Math.min(scoreRc, 100),
    };
  }

  // Convites
  async getAllConvitesByCorretor(corretorId: string): Promise<Convite[]> {
    return db.select().from(convites).where(eq(convites.corretorId, corretorId)).orderBy(desc(convites.createdAt));
  }

  async getAllConvitesByCorretorAndTenant(corretorId: string, tenantId: string): Promise<Convite[]> {
    return db.select().from(convites).where(and(eq(convites.corretorId, corretorId), eq(convites.tenantId, tenantId))).orderBy(desc(convites.createdAt));
  }

  async getConviteByToken(token: string): Promise<Convite | undefined> {
    const [convite] = await db.select().from(convites).where(eq(convites.token, token));
    return convite;
  }

  async getConviteById(id: string): Promise<Convite | undefined> {
    const [convite] = await db.select().from(convites).where(eq(convites.id, id));
    return convite;
  }

  async createConvite(convite: InsertConvite): Promise<Convite> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7); // Expira em 7 dias
    
    const [created] = await db.insert(convites).values({
      ...convite,
      token,
      expiraEm,
    }).returning();
    return created;
  }

  async updateConviteStatus(id: string, status: string, clienteUserId?: string): Promise<Convite | undefined> {
    const updateData: any = { status };
    if (status === "enviado") {
      updateData.enviadoEm = new Date();
    } else if (status === "aceito") {
      updateData.aceitoEm = new Date();
      if (clienteUserId) {
        updateData.clienteUserId = clienteUserId;
      }
    }
    
    const [updated] = await db.update(convites).set(updateData).where(eq(convites.id, id)).returning();
    return updated;
  }

  async deleteConvite(id: string): Promise<void> {
    await db.delete(convites).where(eq(convites.id, id));
  }

  // SMTP Config
  async getSmtpConfigByUser(userId: string): Promise<SmtpConfig | undefined> {
    const [config] = await db.select().from(smtpConfigs).where(eq(smtpConfigs.userId, userId));
    return config;
  }

  async upsertSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig> {
    const [upserted] = await db
      .insert(smtpConfigs)
      .values(config)
      .onConflictDoUpdate({
        target: smtpConfigs.userId,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async deleteSmtpConfig(userId: string): Promise<void> {
    await db.delete(smtpConfigs).where(eq(smtpConfigs.userId, userId));
  }

  // WhatsApp Config
  async getWhatsappConfigByUser(userId: string): Promise<WhatsappConfig | undefined> {
    const [config] = await db.select().from(whatsappConfigs).where(eq(whatsappConfigs.userId, userId));
    return config;
  }

  async upsertWhatsappConfig(config: InsertWhatsappConfig): Promise<WhatsappConfig> {
    const [upserted] = await db
      .insert(whatsappConfigs)
      .values(config)
      .onConflictDoUpdate({
        target: whatsappConfigs.userId,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async deleteWhatsappConfig(userId: string): Promise<void> {
    await db.delete(whatsappConfigs).where(eq(whatsappConfigs.userId, userId));
  }

  // User by role
  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getAllClientes(corretorId: string): Promise<User[]> {
    const clienteConvites = await db.select().from(convites)
      .where(and(
        eq(convites.corretorId, corretorId),
        eq(convites.status, "aceito")
      ));
    
    const clienteIds = clienteConvites.map(c => c.clienteUserId).filter(Boolean) as string[];
    
    if (clienteIds.length === 0) return [];
    
    return db.select().from(users).where(
      or(...clienteIds.map(id => eq(users.id, id)))
    );
  }

  // SaaS Admin - Subscription Plans
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).orderBy(desc(subscriptionPlans.createdAt));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans).values(plan).returning();
    return created;
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const cleanedData = cleanPartialUpdate(plan);
    const [updated] = await db.update(subscriptionPlans)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // SaaS Admin - Tenants
  async getAllTenants(): Promise<Tenant[]> {
    return db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [created] = await db.insert(tenants).values(tenant).returning();
    return created;
  }

  async updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const cleanedData = cleanPartialUpdate(tenant);
    const [updated] = await db.update(tenants)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  async deleteTenant(id: string): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // SaaS Admin - Seguradoras Master
  async getAllSeguradorasMaster(): Promise<SeguradoraMaster[]> {
    return db.select().from(seguradorasMaster).orderBy(seguradorasMaster.nome);
  }

  async getSeguradoraMaster(id: string): Promise<SeguradoraMaster | undefined> {
    const [seguradora] = await db.select().from(seguradorasMaster).where(eq(seguradorasMaster.id, id));
    return seguradora;
  }

  async createSeguradoraMaster(seguradora: InsertSeguradoraMaster): Promise<SeguradoraMaster> {
    const [created] = await db.insert(seguradorasMaster).values(seguradora).returning();
    return created;
  }

  async updateSeguradoraMaster(id: string, seguradora: Partial<InsertSeguradoraMaster>): Promise<SeguradoraMaster | undefined> {
    const cleanedData = cleanPartialUpdate(seguradora);
    const [updated] = await db.update(seguradorasMaster)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(seguradorasMaster.id, id))
      .returning();
    return updated;
  }

  async deleteSeguradoraMaster(id: string): Promise<void> {
    await db.delete(seguradorasMaster).where(eq(seguradorasMaster.id, id));
  }

  // SaaS Admin - Tipos de Seguro Master
  async getAllTiposSeguroMaster(): Promise<TipoSeguroMaster[]> {
    return db.select().from(tiposSeguroMaster).orderBy(tiposSeguroMaster.nome);
  }

  async getTipoSeguroMaster(id: string): Promise<TipoSeguroMaster | undefined> {
    const [tipo] = await db.select().from(tiposSeguroMaster).where(eq(tiposSeguroMaster.id, id));
    return tipo;
  }

  async createTipoSeguroMaster(tipo: InsertTipoSeguroMaster): Promise<TipoSeguroMaster> {
    const [created] = await db.insert(tiposSeguroMaster).values(tipo).returning();
    return created;
  }

  async updateTipoSeguroMaster(id: string, tipo: Partial<InsertTipoSeguroMaster>): Promise<TipoSeguroMaster | undefined> {
    const cleanedData = cleanPartialUpdate(tipo);
    const [updated] = await db.update(tiposSeguroMaster)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(tiposSeguroMaster.id, id))
      .returning();
    return updated;
  }

  async deleteTipoSeguroMaster(id: string): Promise<void> {
    await db.delete(tiposSeguroMaster).where(eq(tiposSeguroMaster.id, id));
  }

  // SaaS Admin - Business Rule Templates
  async getAllBusinessRuleTemplates(): Promise<BusinessRuleTemplate[]> {
    return db.select().from(businessRuleTemplates).orderBy(businessRuleTemplates.nome);
  }

  async getBusinessRuleTemplate(id: string): Promise<BusinessRuleTemplate | undefined> {
    const [template] = await db.select().from(businessRuleTemplates).where(eq(businessRuleTemplates.id, id));
    return template;
  }

  async createBusinessRuleTemplate(template: InsertBusinessRuleTemplate): Promise<BusinessRuleTemplate> {
    const [created] = await db.insert(businessRuleTemplates).values(template).returning();
    return created;
  }

  async updateBusinessRuleTemplate(id: string, template: Partial<InsertBusinessRuleTemplate>): Promise<BusinessRuleTemplate | undefined> {
    const cleanedData = cleanPartialUpdate(template);
    const [updated] = await db.update(businessRuleTemplates)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(businessRuleTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteBusinessRuleTemplate(id: string): Promise<void> {
    await db.delete(businessRuleTemplates).where(eq(businessRuleTemplates.id, id));
  }

  // SaaS Admin - Seguradora Produtos
  async getAllSeguradoraProdutos(): Promise<SeguradoraProduto[]> {
    return db.select().from(seguradoraProdutos);
  }

  async getSeguradoraProdutosBySeguradora(seguradoraId: string): Promise<SeguradoraProduto[]> {
    return db.select().from(seguradoraProdutos).where(eq(seguradoraProdutos.seguradoraId, seguradoraId));
  }

  async createSeguradoraProduto(produto: InsertSeguradoraProduto): Promise<SeguradoraProduto> {
    const [created] = await db.insert(seguradoraProdutos).values(produto).returning();
    return created;
  }

  async deleteSeguradoraProduto(id: string): Promise<void> {
    await db.delete(seguradoraProdutos).where(eq(seguradoraProdutos.id, id));
  }

  // Tenant - Contatos personalizados de seguradoras
  async getTenantSeguradoraContatos(tenantId: string): Promise<TenantSeguradoraContato[]> {
    return db.select().from(tenantSeguradoraContatos).where(eq(tenantSeguradoraContatos.tenantId, tenantId));
  }

  async getTenantSeguradoraContato(tenantId: string, seguradoraId: string): Promise<TenantSeguradoraContato | undefined> {
    const [contato] = await db.select().from(tenantSeguradoraContatos)
      .where(and(
        eq(tenantSeguradoraContatos.tenantId, tenantId),
        eq(tenantSeguradoraContatos.seguradoraId, seguradoraId)
      ));
    return contato;
  }

  async upsertTenantSeguradoraContato(contato: InsertTenantSeguradoraContato): Promise<TenantSeguradoraContato> {
    const existing = await this.getTenantSeguradoraContato(contato.tenantId, contato.seguradoraId);
    
    if (existing) {
      const cleanedData = cleanPartialUpdate(contato);
      const [updated] = await db.update(tenantSeguradoraContatos)
        .set({ ...cleanedData, updatedAt: new Date() })
        .where(eq(tenantSeguradoraContatos.id, existing.id))
        .returning();
      return updated;
    }
    
    const cleanedInsertData = cleanPartialUpdate(contato);
    const [created] = await db.insert(tenantSeguradoraContatos).values({
      ...cleanedInsertData,
      tenantId: contato.tenantId,
      seguradoraId: contato.seguradoraId,
    }).returning();
    return created;
  }

  async deleteTenantSeguradoraContato(tenantId: string, seguradoraId: string): Promise<void> {
    await db.delete(tenantSeguradoraContatos)
      .where(and(
        eq(tenantSeguradoraContatos.tenantId, tenantId),
        eq(tenantSeguradoraContatos.seguradoraId, seguradoraId)
      ));
  }

  // Auth - Email Authentication Methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async getTenantByCnpj(cnpj: string): Promise<Tenant | undefined> {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const [tenant] = await db.select().from(tenants).where(eq(tenants.cnpj, cleanCnpj));
    return tenant;
  }

  async createUserWithCredentials(userData: Partial<UpsertUser>, passwordHash: string): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      email: userData.email?.toLowerCase(),
    } as any).returning();
    
    await db.insert(authCredentials).values({
      userId: user.id,
      provider: "email",
      passwordHash,
    });
    
    return user;
  }

  async getAuthCredentials(userId: string): Promise<AuthCredentials | undefined> {
    const [cred] = await db.select().from(authCredentials).where(eq(authCredentials.userId, userId));
    return cred;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(authCredentials)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(authCredentials.userId, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createAuthToken(tokenData: Omit<InsertAuthToken, "id">): Promise<AuthToken> {
    const [token] = await db.insert(authTokens).values(tokenData as any).returning();
    return token;
  }

  async getValidAuthToken(token: string, type: string): Promise<AuthToken | undefined> {
    const [authToken] = await db.select().from(authTokens)
      .where(and(
        eq(authTokens.token, token),
        eq(authTokens.type, type as any),
        sql`${authTokens.expiresAt} > NOW()`,
        sql`${authTokens.usedAt} IS NULL`
      ));
    return authToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db.update(authTokens)
      .set({ usedAt: new Date() })
      .where(eq(authTokens.id, tokenId));
  }

  async invalidateTokensByType(userId: string, type: string): Promise<void> {
    await db.update(authTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(authTokens.userId, userId),
        eq(authTokens.type, type as any),
        sql`${authTokens.usedAt} IS NULL`
      ));
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId));
  }

  async addUserRole(role: InsertUserRole): Promise<UserRole> {
    const [created] = await db.insert(userRolesTable).values(role as any).returning();
    return created;
  }

  async removeUserRole(userId: string, role: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await db.delete(userRolesTable)
        .where(and(
          eq(userRolesTable.userId, userId),
          eq(userRolesTable.role, role as any),
          eq(userRolesTable.tenantId, tenantId)
        ));
    } else {
      await db.delete(userRolesTable)
        .where(and(
          eq(userRolesTable.userId, userId),
          eq(userRolesTable.role, role as any)
        ));
    }
  }

  async getClientPortalAccess(userId: string, tenantId: string): Promise<ClientPortalAccess | undefined> {
    const [access] = await db.select().from(clientPortalAccess)
      .where(and(
        eq(clientPortalAccess.userId, userId),
        eq(clientPortalAccess.tenantId, tenantId)
      ));
    return access;
  }

  async createClientPortalAccess(access: InsertClientPortalAccess): Promise<ClientPortalAccess> {
    const [created] = await db.insert(clientPortalAccess).values(access as any).returning();
    return created;
  }

  async getClientPessoaFisica(userId: string, tenantId: string): Promise<PessoaFisica | undefined> {
    const access = await this.getClientPortalAccess(userId, tenantId);
    if (!access || !access.pessoaFisicaId) {
      return undefined;
    }
    return this.getPessoaFisica(access.pessoaFisicaId, tenantId);
  }

  async getClientPatrimonios(userId: string, tenantId: string): Promise<Patrimonio[]> {
    const access = await this.getClientPortalAccess(userId, tenantId);
    if (!access || !access.pessoaFisicaId) {
      return [];
    }
    return db.select().from(patrimonios)
      .where(and(
        eq(patrimonios.tenantId, tenantId),
        eq(patrimonios.pessoaFisicaId, access.pessoaFisicaId)
      ))
      .orderBy(desc(patrimonios.createdAt));
  }

  async getClientApolices(userId: string, tenantId: string): Promise<TenantPolicy[]> {
    const access = await this.getClientPortalAccess(userId, tenantId);
    if (!access || !access.pessoaFisicaId) {
      return [];
    }
    return db.select().from(tenantPolicies)
      .where(and(
        eq(tenantPolicies.tenantId, tenantId),
        eq(tenantPolicies.pessoaFisicaId, access.pessoaFisicaId)
      ))
      .orderBy(desc(tenantPolicies.createdAt));
  }

  async updateClientPessoaFisica(userId: string, tenantId: string, data: Partial<PessoaFisica>): Promise<PessoaFisica | undefined> {
    const access = await this.getClientPortalAccess(userId, tenantId);
    if (!access || !access.pessoaFisicaId) {
      return undefined;
    }
    const [updated] = await db.update(pessoasFisicas)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(pessoasFisicas.id, access.pessoaFisicaId),
        eq(pessoasFisicas.tenantId, tenantId)
      ))
      .returning();
    return updated;
  }

  async createClientApolice(userId: string, tenantId: string, data: Omit<InsertTenantPolicy, 'tenantId' | 'pessoaFisicaId'>): Promise<TenantPolicy | null> {
    const access = await this.getClientPortalAccess(userId, tenantId);
    if (!access || !access.pessoaFisicaId) {
      return null;
    }
    const [created] = await db.insert(tenantPolicies).values({
      ...data,
      tenantId,
      pessoaFisicaId: access.pessoaFisicaId,
    } as any).returning();
    return created;
  }

  // SaaS Admin - Global SMTP Config
  async getSaasSmtpConfig(): Promise<SaasSmtpConfig | undefined> {
    const [config] = await db.select().from(saasSmtpConfig).where(eq(saasSmtpConfig.ativo, true)).limit(1);
    return config;
  }

  async upsertSaasSmtpConfig(config: InsertSaasSmtpConfig): Promise<SaasSmtpConfig> {
    // Get existing active config
    const existing = await this.getSaasSmtpConfig();
    if (existing) {
      const [updated] = await db.update(saasSmtpConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(saasSmtpConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(saasSmtpConfig).values(config as any).returning();
    return created;
  }

  async deleteSaasSmtpConfig(id: string): Promise<void> {
    await db.delete(saasSmtpConfig).where(eq(saasSmtpConfig.id, id));
  }

  // SaaS Admin - ChatGPT Config
  async getSaasChatgptConfig(): Promise<SaasChatgptConfig | undefined> {
    const [config] = await db.select().from(saasChatgptConfig).where(eq(saasChatgptConfig.ativo, true)).limit(1);
    return config;
  }

  async upsertSaasChatgptConfig(config: InsertSaasChatgptConfig): Promise<SaasChatgptConfig> {
    const existing = await this.getSaasChatgptConfig();
    if (existing) {
      const [updated] = await db.update(saasChatgptConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(saasChatgptConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(saasChatgptConfig).values(config as any).returning();
    return created;
  }

  async deleteSaasChatgptConfig(id: string): Promise<void> {
    await db.delete(saasChatgptConfig).where(eq(saasChatgptConfig.id, id));
  }

  // SaaS Admin - Evolution API Config
  async getSaasEvolutionConfig(): Promise<SaasEvolutionConfig | undefined> {
    const [config] = await db.select().from(saasEvolutionConfig).where(eq(saasEvolutionConfig.ativo, true)).limit(1);
    return config;
  }

  async upsertSaasEvolutionConfig(config: InsertSaasEvolutionConfig): Promise<SaasEvolutionConfig> {
    const existing = await this.getSaasEvolutionConfig();
    if (existing) {
      const [updated] = await db.update(saasEvolutionConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(saasEvolutionConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(saasEvolutionConfig).values(config as any).returning();
    return created;
  }

  async deleteSaasEvolutionConfig(id: string): Promise<void> {
    await db.delete(saasEvolutionConfig).where(eq(saasEvolutionConfig.id, id));
  }

  // SaaS Admin - Tenant User Management
  async getAllUsersByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));
  }

  async updateUser(userId: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete auth credentials first (cascade should handle this, but being explicit)
    await db.delete(authCredentials).where(eq(authCredentials.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  // SaaS Admin - Dashboard Stats
  async getSaasAdminStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalClientes: number;
    tenantsByPlan: { planName: string; count: number }[];
  }> {
    const allTenants = await db.select().from(tenants);
    const activeTenants = allTenants.filter(t => t.isActive !== false && t.status !== 'cancelado' && t.status !== 'suspenso');
    
    const allUsers = await db.select().from(users).where(
      or(eq(users.role, 'corretor'), eq(users.role, 'tenant_admin'))
    );
    
    const allClientes = await db.select().from(users).where(eq(users.role, 'cliente'));
    
    // Group tenants by plan
    const plans = await db.select().from(subscriptionPlans);
    const tenantsByPlan = plans.map(plan => ({
      planName: plan.nome,
      count: allTenants.filter(t => t.planId === plan.id).length
    })).filter(p => p.count > 0);
    
    // Add tenants without plan
    const tenantsWithoutPlan = allTenants.filter(t => !t.planId).length;
    if (tenantsWithoutPlan > 0) {
      tenantsByPlan.push({ planName: 'Sem plano', count: tenantsWithoutPlan });
    }
    
    return {
      totalTenants: allTenants.length,
      activeTenants: activeTenants.length,
      totalUsers: allUsers.length,
      totalClientes: allClientes.length,
      tenantsByPlan
    };
  }

  // Helper to get current month in YYYY-MM format
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Resource Usage Tracking
  async getTenantUsage(tenantId: string): Promise<{
    tenantId: string;
    tenantName: string;
    planName: string | null;
    limits: { 
      maxUsuarios: number; 
      maxClientes: number;
      maxApolices: number | null;
      maxTokensIa: number | null;
      maxConexoesEvolution: number | null;
    };
    usage: { 
      usuarios: number; 
      clientesPF: number; 
      clientesPJ: number; 
      totalClientes: number;
      apolices: number;
      tokensIa: number;
      conexoesEvolution: number;
    };
    percentages: { 
      usuarios: number; 
      clientes: number;
      apolices: number | null;
      tokensIa: number | null;
      conexoesEvolution: number | null;
    };
    alerts: { 
      usuarios: 'ok' | 'warning' | 'exceeded'; 
      clientes: 'ok' | 'warning' | 'exceeded';
      apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      conexoesEvolution: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    };
  }> {
    const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant.length) {
      throw new Error('Tenant não encontrado');
    }
    
    const tenantData = tenant[0];
    let planLimits = { 
      maxUsuarios: 1, 
      maxClientes: 100,
      maxApolices: null as number | null,
      maxTokensIa: null as number | null,
      maxConexoesEvolution: 1
    };
    let planName: string | null = null;
    
    if (tenantData.planId) {
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, tenantData.planId)).limit(1);
      if (plan.length) {
        planLimits = { 
          maxUsuarios: plan[0].maxUsuarios || 1, 
          maxClientes: plan[0].maxClientes || 100,
          maxApolices: plan[0].maxApolices,
          maxTokensIa: plan[0].maxTokensIa,
          maxConexoesEvolution: plan[0].maxConexoesEvolution || 1
        };
        planName = plan[0].nome;
      }
    }
    
    // Count active users (corretor + tenant_admin) for this tenant
    const userCount = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true),
        or(eq(users.role, 'corretor'), eq(users.role, 'tenant_admin'))
      ));
    
    // Count PF clients for this tenant
    const pfCount = await db.select({ count: sql<number>`count(*)` })
      .from(pessoasFisicas)
      .where(eq(pessoasFisicas.tenantId, tenantId));
    
    // Count PJ clients for this tenant
    const pjCount = await db.select({ count: sql<number>`count(*)` })
      .from(pessoasJuridicas)
      .where(eq(pessoasJuridicas.tenantId, tenantId));
    
    // Count policies for this tenant
    const policiesCount = await db.select({ count: sql<number>`count(*)` })
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, tenantId));
    
    // Get current month token usage
    const currentMonth = this.getCurrentMonth();
    const tokenUsage = await db.select()
      .from(tenantAiTokenUsage)
      .where(and(
        eq(tenantAiTokenUsage.tenantId, tenantId),
        eq(tenantAiTokenUsage.usageMonth, currentMonth)
      ))
      .limit(1);
    
    // Count active connections for this tenant
    const connectionsCount = await db.select({ count: sql<number>`count(*)` })
      .from(tenantChannelConnections)
      .where(and(
        eq(tenantChannelConnections.tenantId, tenantId),
        eq(tenantChannelConnections.status, 'ativo')
      ));
    
    const usuarios = Number(userCount[0]?.count || 0);
    const clientesPF = Number(pfCount[0]?.count || 0);
    const clientesPJ = Number(pjCount[0]?.count || 0);
    const totalClientes = clientesPF + clientesPJ;
    const apolices = Number(policiesCount[0]?.count || 0);
    const tokensIa = tokenUsage[0]?.tokensUsed || 0;
    const conexoesEvolution = Number(connectionsCount[0]?.count || 0);
    
    const percentUsuarios = planLimits.maxUsuarios > 0 ? Math.round((usuarios / planLimits.maxUsuarios) * 100) : 0;
    const percentClientes = planLimits.maxClientes > 0 ? Math.round((totalClientes / planLimits.maxClientes) * 100) : 0;
    const percentApolices = planLimits.maxApolices !== null && planLimits.maxApolices > 0 
      ? Math.round((apolices / planLimits.maxApolices) * 100) 
      : null;
    const percentTokensIa = planLimits.maxTokensIa !== null && planLimits.maxTokensIa > 0 
      ? Math.round((tokensIa / planLimits.maxTokensIa) * 100) 
      : null;
    const percentConexoes = planLimits.maxConexoesEvolution !== null && planLimits.maxConexoesEvolution > 0 
      ? Math.round((conexoesEvolution / planLimits.maxConexoesEvolution) * 100) 
      : null;
    
    const getAlertLevel = (percent: number): 'ok' | 'warning' | 'exceeded' => {
      if (percent >= 100) return 'exceeded';
      if (percent >= 80) return 'warning';
      return 'ok';
    };
    
    const getAlertLevelNullable = (percent: number | null): 'ok' | 'warning' | 'exceeded' | 'unlimited' => {
      if (percent === null) return 'unlimited';
      return getAlertLevel(percent);
    };
    
    return {
      tenantId,
      tenantName: tenantData.nome,
      planName,
      limits: planLimits,
      usage: { usuarios, clientesPF, clientesPJ, totalClientes, apolices, tokensIa, conexoesEvolution },
      percentages: { 
        usuarios: percentUsuarios, 
        clientes: percentClientes,
        apolices: percentApolices,
        tokensIa: percentTokensIa,
        conexoesEvolution: percentConexoes
      },
      alerts: { 
        usuarios: getAlertLevel(percentUsuarios), 
        clientes: getAlertLevel(percentClientes),
        apolices: getAlertLevelNullable(percentApolices),
        tokensIa: getAlertLevelNullable(percentTokensIa),
        conexoesEvolution: getAlertLevelNullable(percentConexoes)
      }
    };
  }

  async getAllTenantsUsage(): Promise<Array<{
    tenantId: string;
    tenantName: string;
    planName: string | null;
    isActive: boolean;
    limits: { 
      maxUsuarios: number; 
      maxClientes: number;
      maxApolices: number | null;
      maxTokensIa: number | null;
      maxConexoesEvolution: number | null;
    };
    usage: { 
      usuarios: number; 
      clientesPF: number; 
      clientesPJ: number; 
      totalClientes: number;
      apolices: number;
      tokensIa: number;
      conexoesEvolution: number;
    };
    percentages: { 
      usuarios: number; 
      clientes: number;
      apolices: number | null;
      tokensIa: number | null;
      conexoesEvolution: number | null;
    };
    alerts: { 
      usuarios: 'ok' | 'warning' | 'exceeded'; 
      clientes: 'ok' | 'warning' | 'exceeded';
      apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
      conexoesEvolution: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    };
  }>> {
    const allTenants = await db.select().from(tenants);
    const results = [];
    
    for (const tenant of allTenants) {
      try {
        const usage = await this.getTenantUsage(tenant.id);
        results.push({ ...usage, isActive: tenant.isActive !== false });
      } catch (error) {
        console.error(`Error getting usage for tenant ${tenant.id}:`, error);
      }
    }
    
    return results;
  }

  async canAddUser(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
    const usage = await this.getTenantUsage(tenantId);
    const allowed = usage.usage.usuarios < usage.limits.maxUsuarios;
    return {
      allowed,
      message: allowed ? undefined : `Limite de usuários atingido (${usage.usage.usuarios}/${usage.limits.maxUsuarios}). Faça upgrade do plano para adicionar mais usuários.`,
      current: usage.usage.usuarios,
      limit: usage.limits.maxUsuarios
    };
  }

  async canAddClient(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
    const usage = await this.getTenantUsage(tenantId);
    const allowed = usage.usage.totalClientes < usage.limits.maxClientes;
    return {
      allowed,
      message: allowed ? undefined : `Limite de clientes atingido (${usage.usage.totalClientes}/${usage.limits.maxClientes}). Faça upgrade do plano para adicionar mais clientes.`,
      current: usage.usage.totalClientes,
      limit: usage.limits.maxClientes
    };
  }

  async canAddPolicy(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }> {
    const usage = await this.getTenantUsage(tenantId);
    const limit = usage.limits.maxApolices;
    
    // null limit means unlimited
    if (limit === null) {
      return { allowed: true, current: usage.usage.apolices, limit: null };
    }
    
    const allowed = usage.usage.apolices < limit;
    return {
      allowed,
      message: allowed ? undefined : `Limite de apólices atingido (${usage.usage.apolices}/${limit}). Faça upgrade do plano para adicionar mais apólices.`,
      current: usage.usage.apolices,
      limit
    };
  }

  async canConsumeTokens(tenantId: string, tokensToConsume: number): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }> {
    const usage = await this.getTenantUsage(tenantId);
    const limit = usage.limits.maxTokensIa;
    
    // null limit means unlimited
    if (limit === null) {
      return { allowed: true, current: usage.usage.tokensIa, limit: null };
    }
    
    const remaining = limit - usage.usage.tokensIa;
    const allowed = tokensToConsume <= remaining;
    return {
      allowed,
      message: allowed ? undefined : `Limite de tokens de IA atingido (${usage.usage.tokensIa}/${limit}). Faça upgrade do plano para usar mais tokens.`,
      current: usage.usage.tokensIa,
      limit
    };
  }

  async canAddConnection(tenantId: string): Promise<{ allowed: boolean; message?: string; current: number; limit: number | null }> {
    const usage = await this.getTenantUsage(tenantId);
    const limit = usage.limits.maxConexoesEvolution;
    
    // null limit means unlimited
    if (limit === null) {
      return { allowed: true, current: usage.usage.conexoesEvolution, limit: null };
    }
    
    const allowed = usage.usage.conexoesEvolution < limit;
    return {
      allowed,
      message: allowed ? undefined : `Limite de conexões atingido (${usage.usage.conexoesEvolution}/${limit}). Faça upgrade do plano para adicionar mais conexões.`,
      current: usage.usage.conexoesEvolution,
      limit
    };
  }

  // Token usage management
  async getCurrentMonthTokenUsage(tenantId: string): Promise<number> {
    const currentMonth = this.getCurrentMonth();
    const result = await db.select()
      .from(tenantAiTokenUsage)
      .where(and(
        eq(tenantAiTokenUsage.tenantId, tenantId),
        eq(tenantAiTokenUsage.usageMonth, currentMonth)
      ))
      .limit(1);
    
    return result[0]?.tokensUsed || 0;
  }

  async addTokenUsage(tenantId: string, tokens: number): Promise<void> {
    const currentMonth = this.getCurrentMonth();
    
    // Try to update existing record
    const existing = await db.select()
      .from(tenantAiTokenUsage)
      .where(and(
        eq(tenantAiTokenUsage.tenantId, tenantId),
        eq(tenantAiTokenUsage.usageMonth, currentMonth)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(tenantAiTokenUsage)
        .set({ 
          tokensUsed: (existing[0].tokensUsed || 0) + tokens,
          updatedAt: new Date()
        })
        .where(eq(tenantAiTokenUsage.id, existing[0].id));
    } else {
      await db.insert(tenantAiTokenUsage).values({
        tenantId,
        usageMonth: currentMonth,
        tokensUsed: tokens
      });
    }
  }

  // Policy management
  async countTenantPolicies(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, tenantId));
    
    return Number(result[0]?.count || 0);
  }

  async createTenantPolicy(policy: InsertTenantPolicy): Promise<TenantPolicy> {
    const [created] = await db.insert(tenantPolicies).values(policy).returning();
    return created;
  }

  async getTenantPolicies(tenantId: string): Promise<TenantPolicy[]> {
    return db.select()
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, tenantId))
      .orderBy(desc(tenantPolicies.createdAt));
  }

  // Channel connections management
  async countActiveConnections(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tenantChannelConnections)
      .where(and(
        eq(tenantChannelConnections.tenantId, tenantId),
        eq(tenantChannelConnections.status, 'ativo')
      ));
    
    return Number(result[0]?.count || 0);
  }

  async createChannelConnection(connection: InsertTenantChannelConnection): Promise<TenantChannelConnection> {
    const [created] = await db.insert(tenantChannelConnections).values(connection).returning();
    return created;
  }

  async getTenantConnections(tenantId: string): Promise<TenantChannelConnection[]> {
    return db.select()
      .from(tenantChannelConnections)
      .where(eq(tenantChannelConnections.tenantId, tenantId))
      .orderBy(desc(tenantChannelConnections.createdAt));
  }

  async updateConnectionStatus(connectionId: string, status: string): Promise<void> {
    await db.update(tenantChannelConnections)
      .set({ 
        status: status as any,
        updatedAt: new Date(),
        lastConnectedAt: status === 'ativo' ? new Date() : undefined
      })
      .where(eq(tenantChannelConnections.id, connectionId));
  }

  async deleteChannelConnection(connectionId: string): Promise<void> {
    await db.delete(tenantChannelConnections)
      .where(eq(tenantChannelConnections.id, connectionId));
  }

  async getTenantSmtpConfig(tenantId: string): Promise<TenantSmtpConfig | null> {
    const [config] = await db.select()
      .from(tenantSmtpConfig)
      .where(eq(tenantSmtpConfig.tenantId, tenantId))
      .limit(1);
    return config || null;
  }

  async upsertTenantSmtpConfig(config: InsertTenantSmtpConfig): Promise<TenantSmtpConfig> {
    const existing = await this.getTenantSmtpConfig(config.tenantId);
    
    if (existing) {
      const [updated] = await db.update(tenantSmtpConfig)
        .set({
          ...config,
          updatedAt: new Date()
        })
        .where(eq(tenantSmtpConfig.tenantId, config.tenantId))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(tenantSmtpConfig)
      .values(config)
      .returning();
    return created;
  }

  async deleteTenantSmtpConfig(tenantId: string): Promise<void> {
    await db.delete(tenantSmtpConfig)
      .where(eq(tenantSmtpConfig.tenantId, tenantId));
  }

  async getUsageSummary(): Promise<{
    totalTenants: number;
    tenantsAtLimit: number;
    tenantsNearLimit: number;
    totalUsersUsed: number;
    totalUsersLimit: number;
    totalClientesUsed: number;
    totalClientesLimit: number;
    totalApoliciesUsed: number;
    totalApoliciesLimit: number;
    totalTokensUsed: number;
    totalTokensLimit: number;
    totalConnectionsUsed: number;
    totalConnectionsLimit: number;
    tenantAlerts: Array<{
      tenantId: string;
      tenantName: string;
      type: 'usuarios' | 'clientes' | 'apolices' | 'tokens' | 'conexoes';
      severity: 'warning' | 'exceeded';
      used: number;
      limit: number;
    }>;
  }> {
    const allUsage = await this.getAllTenantsUsage();
    
    let totalUsersUsed = 0;
    let totalUsersLimit = 0;
    let totalClientesUsed = 0;
    let totalClientesLimit = 0;
    let totalApoliciesUsed = 0;
    let totalApoliciesLimit = 0;
    let totalTokensUsed = 0;
    let totalTokensLimit = 0;
    let totalConnectionsUsed = 0;
    let totalConnectionsLimit = 0;
    
    const tenantsAtLimitSet = new Set<string>();
    const tenantsNearLimitSet = new Set<string>();
    
    const tenantAlerts: Array<{
      tenantId: string;
      tenantName: string;
      type: 'usuarios' | 'clientes' | 'apolices' | 'tokens' | 'conexoes';
      severity: 'warning' | 'exceeded';
      used: number;
      limit: number;
    }> = [];
    
    for (const usage of allUsage) {
      totalUsersUsed += usage.usage.usuarios;
      totalUsersLimit += usage.limits.maxUsuarios;
      totalClientesUsed += usage.usage.totalClientes;
      totalClientesLimit += usage.limits.maxClientes;
      totalApoliciesUsed += usage.usage.apolices;
      totalApoliciesLimit += usage.limits.maxApolices || 0;
      totalTokensUsed += usage.usage.tokensIa;
      totalTokensLimit += usage.limits.maxTokensIa || 0;
      totalConnectionsUsed += usage.usage.conexoesEvolution;
      totalConnectionsLimit += usage.limits.maxConexoesEvolution || 0;
      
      // Track unique tenants at limit or near limit (mutually exclusive)
      const hasExceeded = usage.alerts.usuarios === 'exceeded' || 
                         usage.alerts.clientes === 'exceeded' ||
                         usage.alerts.apolices === 'exceeded' ||
                         usage.alerts.tokensIa === 'exceeded' ||
                         usage.alerts.conexoesEvolution === 'exceeded';
      const hasWarning = usage.alerts.usuarios === 'warning' || 
                        usage.alerts.clientes === 'warning' ||
                        usage.alerts.apolices === 'warning' ||
                        usage.alerts.tokensIa === 'warning' ||
                        usage.alerts.conexoesEvolution === 'warning';
      
      if (hasExceeded) {
        tenantsAtLimitSet.add(usage.tenantId);
      } else if (hasWarning) {
        tenantsNearLimitSet.add(usage.tenantId);
      }
      
      // Add alerts for non-ok statuses
      if (usage.alerts.usuarios !== 'ok' && usage.limits.maxUsuarios > 0) {
        tenantAlerts.push({
          tenantId: usage.tenantId,
          tenantName: usage.tenantName,
          type: 'usuarios',
          severity: usage.alerts.usuarios as 'warning' | 'exceeded',
          used: usage.usage.usuarios,
          limit: usage.limits.maxUsuarios
        });
      }
      if (usage.alerts.clientes !== 'ok' && usage.limits.maxClientes > 0) {
        tenantAlerts.push({
          tenantId: usage.tenantId,
          tenantName: usage.tenantName,
          type: 'clientes',
          severity: usage.alerts.clientes as 'warning' | 'exceeded',
          used: usage.usage.totalClientes,
          limit: usage.limits.maxClientes
        });
      }
      if (usage.alerts.apolices !== 'ok' && usage.alerts.apolices !== 'unlimited' && usage.limits.maxApolices) {
        tenantAlerts.push({
          tenantId: usage.tenantId,
          tenantName: usage.tenantName,
          type: 'apolices',
          severity: usage.alerts.apolices as 'warning' | 'exceeded',
          used: usage.usage.apolices,
          limit: usage.limits.maxApolices
        });
      }
      if (usage.alerts.tokensIa !== 'ok' && usage.alerts.tokensIa !== 'unlimited' && usage.limits.maxTokensIa) {
        tenantAlerts.push({
          tenantId: usage.tenantId,
          tenantName: usage.tenantName,
          type: 'tokens',
          severity: usage.alerts.tokensIa as 'warning' | 'exceeded',
          used: usage.usage.tokensIa,
          limit: usage.limits.maxTokensIa
        });
      }
      if (usage.alerts.conexoesEvolution !== 'ok' && usage.alerts.conexoesEvolution !== 'unlimited' && usage.limits.maxConexoesEvolution) {
        tenantAlerts.push({
          tenantId: usage.tenantId,
          tenantName: usage.tenantName,
          type: 'conexoes',
          severity: usage.alerts.conexoesEvolution as 'warning' | 'exceeded',
          used: usage.usage.conexoesEvolution,
          limit: usage.limits.maxConexoesEvolution
        });
      }
    }
    
    return {
      totalTenants: allUsage.length,
      tenantsAtLimit: tenantsAtLimitSet.size,
      tenantsNearLimit: tenantsNearLimitSet.size,
      totalUsersUsed,
      totalUsersLimit: Math.max(totalUsersLimit, 1),
      totalClientesUsed,
      totalClientesLimit: Math.max(totalClientesLimit, 1),
      totalApoliciesUsed,
      totalApoliciesLimit: Math.max(totalApoliciesLimit, 1),
      totalTokensUsed,
      totalTokensLimit: Math.max(totalTokensLimit, 1),
      totalConnectionsUsed,
      totalConnectionsLimit: Math.max(totalConnectionsLimit, 1),
      tenantAlerts
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
