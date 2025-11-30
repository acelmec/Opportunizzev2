import { sql, relations } from "drizzle-orm";
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const estadoCivilEnum = pgEnum("estado_civil", [
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
]);

export const porteEmpresaEnum = pgEnum("porte_empresa", [
  "micro",
  "pequeno",
  "medio",
  "grande",
]);

export const tipoEnderecoEnum = pgEnum("tipo_endereco", [
  "residencial",
  "comercial",
  "veraneio",
]);

export const tipoPatrimonioEnum = pgEnum("tipo_patrimonio", [
  "veiculo",
  "imovel",
  "equipamento",
  "colecao",
  "embarcacao",
]);

export const tipoImovelEnum = pgEnum("tipo_imovel", [
  "residencial",
  "comercial",
  "temporada",
]);

export const usoVeiculoEnum = pgEnum("uso_veiculo", [
  "pessoal",
  "trabalho",
  "app_transporte",
]);

export const statusOportunidadeEnum = pgEnum("status_oportunidade", [
  "novo",
  "em_proposta",
  "enviado",
  "aceito",
  "recusado",
]);

export const produtoSeguroEnum = pgEnum("produto_seguro", [
  "vida",
  "auto",
  "residencial",
  "rc_profissional",
  "previdencia",
  "saude",
]);

export const tipoInteracaoEnum = pgEnum("tipo_interacao", [
  "ligacao",
  "email",
  "visita",
  "proposta",
  "renovacao",
  "whatsapp",
]);

export const tipoContatoEnum = pgEnum("tipo_contato", [
  "telefone",
  "celular",
  "email",
  "whatsapp",
]);

export const preferenciaContatoEnum = pgEnum("preferencia_contato", [
  "whatsapp",
  "email",
  "telefone",
]);

export const statusConviteEnum = pgEnum("status_convite", [
  "pendente",
  "enviado",
  "aceito",
  "expirado",
  "cancelado",
]);

export const canalEnvioEnum = pgEnum("canal_envio", [
  "email",
  "whatsapp",
]);

export const userRoleEnum = pgEnum("user_role", [
  "saas_admin",
  "tenant_admin",
  "corretor",
  "cliente",
]);

// SaaS Multi-Tenant Enums
export const statusTenantEnum = pgEnum("status_tenant", [
  "trial",
  "ativo",
  "suspenso",
  "cancelado",
]);

export const statusPlanoEnum = pgEnum("status_plano", [
  "ativo",
  "inativo",
]);

export const categoriaSeguroEnum = pgEnum("categoria_seguro", [
  "automovel",
  "motocicleta",
  "caminhao",
  "nautico",
  "aeronautico",
  "vida",
  "vida_coletivo",
  "saude",
  "saude_coletivo",
  "odontologico",
  "residencial",
  "empresarial",
  "condominio",
  "rc_profissional",
  "rc_geral",
  "garantia",
  "fianca_locaticia",
  "viagem",
  "pet",
  "equipamentos",
  "cyber",
  "rural",
  "previdencia",
  "consorcio",
  "capitalizacao",
  "transporte",
  "frota",
  "acidentes_pessoais",
  "rc_obras",
  "rc_produtos",
  "rc_ambiental",
  "rc_empregador",
  "rc_operacoes",
  "eventos",
  "engenharia",
  "gestao",
  "lucros_cessantes",
]);

export const profissaoEnum = pgEnum("profissao", [
  "analista_sistemas",
  "advogado",
  "medico",
  "engenheiro",
  "contador",
  "dentista",
  "psicolog",
  "fisioterapeuta",
  "farmaceutico",
  "nutricionist",
  "professor",
  "vendedor",
  "gerente",
  "diretor",
  "consultor",
  "auditor",
  "sociologo",
  "tecnico",
  "operador",
  "motorista",
  "pedreiro",
  "encanador",
  "eletricista",
  "pintor",
  "carpinteiro",
  "mecanico",
  "ferreiro",
  "agricultor",
  "pecuarista",
  "pescador",
  "comerciante",
  "empresario",
  "autonomo",
  "freelancer",
  "desempregado",
  "aposentado",
  "estudante",
  "do_lar",
  "outro",
]);

export const segmentoAtividadeEnum = pgEnum("segmento_atividade", [
  "agricultura",
  "alimentos_bebidas",
  "automovel",
  "bancos_financeiras",
  "biotecnologia",
  "comercio_varejista",
  "comercio_atacadista",
  "comunicacao_midia",
  "construcao_imobiliario",
  "cosmetica_beleza",
  "educacao",
  "eletronico_informatica",
  "energia",
  "engenharia",
  "entretenimento_lazer",
  "esporte",
  "escritorios_advocacia",
  "farmaceutico",
  "fashion_vestuario",
  "financeiro",
  "fitness_saude",
  "florestal",
  "hospedagem_turismo",
  "imobiliario",
  "importacao_exportacao",
  "industria_geral",
  "industria_mecanica",
  "industria_plastica",
  "industria_quimica",
  "industria_siderurgia",
  "industria_textil",
  "industria_vidro",
  "informatica_ti",
  "infraestrutura",
  "investigacao_seguranca",
  "jornalismo",
  "juridico",
  "legislacao",
  "limpeza_higiene",
  "logistica_transporte",
  "luxo",
  "manuencao_reparo",
  "manufatura",
  "marketing_publicidade",
  "material_construcao",
  "metal_mecanica",
  "mecanica",
  "mineracao",
  "moveis_decoracao",
  "mobilidade_urbana",
  "moda",
  "musica",
  "odontologia",
  "oftalmologia",
  "otica",
  "pecuaria",
  "pesquisa_desenvolvimento",
  "pesca",
  "petroleo_gas",
  "publicidade",
  "quimica",
  "reclclagem",
  "saude_hospitalaria",
  "seguros",
  "siderurgia",
  "solucoes_computacionais",
  "telecomunicacoes",
  "textil",
  "transporte_cargas",
  "transporte_passageiros",
  "turismo",
  "uti_publica",
  "utilidade_publica",
  "varejo",
  "vestuario",
  "vidracaria",
  "veterinaria",
  "vitivinicola",
  "outro",
]);

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// ============================================
// SaaS Multi-Tenant Tables
// ============================================

// Subscription Plans (managed by SaaS Admin)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  precoMensal: decimal("preco_mensal", { precision: 10, scale: 2 }).notNull(),
  precoAnual: decimal("preco_anual", { precision: 10, scale: 2 }),
  maxUsuarios: integer("max_usuarios").default(5),
  maxClientes: integer("max_clientes").default(100),
  maxOportunidades: integer("max_oportunidades").default(500),
  maxApolices: integer("max_apolices").default(50),
  maxTokensIa: integer("max_tokens_ia").default(100000), // Monthly AI token limit
  maxConexoesEvolution: integer("max_conexoes_evolution").default(1), // WhatsApp connections
  acessoWhatsapp: boolean("acesso_whatsapp").default(false),
  acessoEmail: boolean("acesso_email").default(true),
  acessoRelatorios: boolean("acesso_relatorios").default(false),
  acessoApi: boolean("acesso_api").default(false),
  status: statusPlanoEnum("status").default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants (Corretoras/Brokerages)
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  cnpj: varchar("cnpj", { length: 18 }).unique(),
  email: varchar("email", { length: 200 }),
  telefone: varchar("telefone", { length: 20 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  enderecoId: varchar("endereco_id"),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  status: statusTenantEnum("status").default("trial"),
  isActive: boolean("is_active").default(true), // For immediate blocking by SaaS Admin
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master Insurance Companies (managed by SaaS Admin)
export const seguradorasMaster = pgTable("seguradoras_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).unique(),
  codigoSusep: varchar("codigo_susep", { length: 20 }),
  website: varchar("website", { length: 300 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  telefoneMatriz: varchar("telefone_matriz", { length: 20 }),
  emailMatriz: varchar("email_matriz", { length: 200 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master Insurance Types (managed by SaaS Admin)
export const tiposSeguroMaster = pgTable("tipos_seguro_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull(),
  categoria: categoriaSeguroEnum("categoria").notNull(),
  descricao: text("descricao"),
  icone: varchar("icone", { length: 50 }),
  ativo: boolean("ativo").default(true),
  ordem: integer("ordem").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products offered by each insurance company (managed by SaaS Admin)
export const seguradoraProdutos = pgTable("seguradora_produtos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seguradoraId: varchar("seguradora_id").references(() => seguradorasMaster.id, { onDelete: "cascade" }).notNull(),
  tipoSeguroId: varchar("tipo_seguro_id").references(() => tiposSeguroMaster.id, { onDelete: "cascade" }).notNull(),
  nomeProduto: varchar("nome_produto", { length: 200 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enum para tipo de pessoa nas regras de negócio
export const tipoPessoaRegraEnum = pgEnum("tipo_pessoa_regra", [
  "pf",
  "pj",
  "ambos",
]);

// Business Rule Templates (managed by SaaS Admin)
// Regras definem condições para vincular perfis socioeconômicos a tipos de seguros
export const businessRuleTemplates = pgTable("business_rule_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  tipoPessoa: tipoPessoaRegraEnum("tipo_pessoa").default("ambos").notNull(),
  tipoSeguroId: varchar("tipo_seguro_id").references(() => tiposSeguroMaster.id),
  prioridade: integer("prioridade").default(0),
  // Condições JSON: { campo, operador, valor }[]
  // Ex: [{"campo": "idade", "operador": ">=", "valor": 30}, {"campo": "estadoCivil", "operador": "=", "valor": "casado"}]
  condicoes: jsonb("condicoes").notNull().default("[]"),
  // Score adicional quando a regra é satisfeita
  scoreBonus: integer("score_bonus").default(10),
  regras: jsonb("regras").notNull(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant Customized Contacts for Insurance Companies (Contatos Local)
export const tenantSeguradoraContatos = pgTable("tenant_seguradora_contatos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  seguradoraId: varchar("seguradora_id").references(() => seguradorasMaster.id, { onDelete: "cascade" }).notNull(),
  nomeContato: varchar("nome_contato", { length: 200 }),
  cargo: varchar("cargo", { length: 100 }),
  departamento: varchar("departamento", { length: 100 }),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  email: varchar("email", { length: 200 }),
  regional: varchar("regional", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cidade: varchar("cidade", { length: 100 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant Seguradora System Passwords
export const tenantSeguradoraSenhas = pgTable("tenant_seguradora_senhas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  seguradoraId: varchar("seguradora_id").references(() => seguradorasMaster.id, { onDelete: "cascade" }).notNull(),
  nomeSistema: varchar("nome_sistema", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  usuario: varchar("usuario", { length: 200 }).notNull(),
  senha: text("senha").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant Seguradora Phones by Type
export const tipoTelefoneEnum = pgEnum("tipo_telefone", [
  "suporte_comercial",
  "assistencia",
  "sinistros",
]);

export const canalContatoEnum = pgEnum("canal_contato", [
  "email",
  "whatsapp",
  "telefone",
]);

export const tenantSeguradoraTelefones = pgTable("tenant_seguradora_telefones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  seguradoraId: varchar("seguradora_id").references(() => seguradorasMaster.id, { onDelete: "cascade" }).notNull(),
  tipoTelefone: tipoTelefoneEnum("tipo_telefone").notNull(),
  canalContato: canalContatoEnum("canal_contato").notNull(),
  valor: varchar("valor", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Status da apólice
export const statusApoliceEnum = pgEnum("status_apolice", [
  "ativa",
  "vencida",
  "cancelada",
  "renovada",
  "em_analise",
]);

// Tenant Policies (Insurance Policies per Tenant)
export const tenantPolicies = pgTable("tenant_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  numeroApolice: varchar("numero_apolice", { length: 100 }).notNull(),
  seguradoraId: varchar("seguradora_id").references(() => seguradorasMaster.id),
  tipoSeguroId: varchar("tipo_seguro_id").references(() => tiposSeguroMaster.id),
  pessoaFisicaId: varchar("pessoa_fisica_id"),
  pessoaJuridicaId: varchar("pessoa_juridica_id"),
  dataInicio: date("data_inicio"),
  dataVencimento: date("data_vencimento"),
  premioTotal: decimal("premio_total", { precision: 12, scale: 2 }),
  status: statusApoliceEnum("status").default("ativa"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tenant_policies_tenant_idx").on(table.tenantId),
]);

// Tenant AI Token Usage (Monthly tracking)
export const tenantAiTokenUsage = pgTable("tenant_ai_token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  usageMonth: varchar("usage_month", { length: 7 }).notNull(), // Format: YYYY-MM
  tokensUsed: integer("tokens_used").default(0).notNull(),
  tokensResetAt: timestamp("tokens_reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("tenant_ai_usage_month_idx").on(table.tenantId, table.usageMonth),
]);

// Channel type enum for connections
export const channelTypeEnum = pgEnum("channel_type", [
  "whatsapp",
  "evolution",
  "telegram",
]);

// Channel connection status
export const channelStatusEnum = pgEnum("channel_status", [
  "ativo",
  "inativo",
  "desconectado",
  "erro",
]);

// Tenant Channel Connections (WhatsApp/Evolution instances)
export const tenantChannelConnections = pgTable("tenant_channel_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  channelType: channelTypeEnum("channel_type").notNull(),
  instanceName: varchar("instance_name", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  status: channelStatusEnum("status").default("inativo"),
  lastConnectedAt: timestamp("last_connected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tenant_channel_conn_idx").on(table.tenantId),
]);

// ============================================
// End SaaS Multi-Tenant Tables
// ============================================

// ============================================
// Email Authentication System Tables
// ============================================

// Auth providers enum (for future OAuth integration)
export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "replit",
]);

// Token type enum
export const tokenTypeEnum = pgEnum("token_type", [
  "email_verification",
  "password_reset",
  "magic_link",
]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("corretor"),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auth credentials (passwords, linked to users)
export const authCredentials = pgTable("auth_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  provider: authProviderEnum("provider").default("email").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  providerAccountId: varchar("provider_account_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User roles (allows multiple roles per user)
export const userRolesTable = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: userRoleEnum("role").notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  pessoaFisicaId: varchar("pessoa_fisica_id"),
  pessoaJuridicaId: varchar("pessoa_juridica_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_role_tenant_idx").on(table.userId, table.role, table.tenantId),
]);

// Auth tokens (verification, password reset, magic links)
export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  type: tokenTypeEnum("type").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client portal access (links PF/PJ to user accounts)
export const clientPortalAccess = pgTable("client_portal_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  pessoaFisicaId: varchar("pessoa_fisica_id").references(() => pessoasFisicas.id, { onDelete: "cascade" }),
  pessoaJuridicaId: varchar("pessoa_juridica_id").references(() => pessoasJuridicas.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("client_portal_user_tenant_idx").on(table.userId, table.tenantId),
]);

// Endereco (Address)
export const enderecos = pgTable("enderecos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  tipo: tipoEnderecoEnum("tipo").default("residencial"),
  cep: varchar("cep", { length: 9 }),
  logradouro: varchar("logradouro", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  pais: varchar("pais", { length: 50 }).default("Brasil"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pessoa Fisica (Individual)
export const pessoasFisicas = pgTable("pessoas_fisicas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  nomeCompleto: varchar("nome_completo", { length: 240 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  dataNascimento: date("data_nascimento"),
  sexo: varchar("sexo", { length: 1 }),
  estadoCivil: estadoCivilEnum("estado_civil"),
  profissao: varchar("profissao", { length: 120 }),
  empresaEmprego: varchar("empresa_emprego", { length: 200 }),
  ocupacaoRisco: varchar("ocupacao_risco", { length: 100 }),
  rendaMensalBruta: decimal("renda_mensal_bruta", { precision: 12, scale: 2 }),
  rendaMensalLiquida: decimal("renda_mensal_liquida", { precision: 12, scale: 2 }),
  gastosMensais: decimal("gastos_mensais", { precision: 12, scale: 2 }),
  economias: decimal("economias", { precision: 12, scale: 2 }),
  numeroDependentes: integer("numero_dependentes").default(0),
  enderecoId: varchar("endereco_id").references(() => enderecos.id),
  preferenciaContato: preferenciaContatoEnum("preferencia_contato"),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  email: varchar("email", { length: 100 }),
  consentimentoLgpd: boolean("consentimento_lgpd").default(false),
  consentimentoTimestamp: timestamp("consentimento_timestamp"),
  consentimentoEscopo: text("consentimento_escopo"),
  observacoes: text("observacoes"),
  scoreVida: integer("score_vida").default(0),
  scoreAuto: integer("score_auto").default(0),
  scoreResidencial: integer("score_residencial").default(0),
  scoreRcProfissional: integer("score_rc_profissional").default(0),
  scorePrevidencia: integer("score_previdencia").default(0),
  scoreSaude: integer("score_saude").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("pf_tenant_cpf_idx").on(table.tenantId, table.cpf),
]);

// Dependentes (for PF)
export const dependentes = pgTable("dependentes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pessoaFisicaId: varchar("pessoa_fisica_id")
    .references(() => pessoasFisicas.id, { onDelete: "cascade" })
    .notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  dataNascimento: date("data_nascimento"),
  grauParentesco: varchar("grau_parentesco", { length: 50 }),
  dependenteImposto: boolean("dependente_imposto").default(false),
  cpf: varchar("cpf", { length: 14 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pessoa Juridica (Company)
export const pessoasJuridicas = pgTable("pessoas_juridicas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  razaoSocial: varchar("razao_social", { length: 300 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 200 }),
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  segmentoAtividade: varchar("segmento_atividade", { length: 200 }),
  cnae: varchar("cnae", { length: 20 }),
  porteEmpresa: porteEmpresaEnum("porte_empresa"),
  faturamentoMensal: decimal("faturamento_mensal", { precision: 14, scale: 2 }),
  enderecoSedeId: varchar("endereco_sede_id").references(() => enderecos.id),
  numeroFuncionarios: integer("numero_funcionarios").default(0),
  planoSaudeColetivo: boolean("plano_saude_coletivo").default(false),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  website: varchar("website", { length: 200 }),
  consentimentoLgpd: boolean("consentimento_lgpd").default(false),
  consentimentoTimestamp: timestamp("consentimento_timestamp"),
  observacoes: text("observacoes"),
  scoreVidaColetiva: integer("score_vida_coletiva").default(0),
  scoreSaudeColetiva: integer("score_saude_coletiva").default(0),
  scorePatrimonial: integer("score_patrimonial").default(0),
  scoreRc: integer("score_rc").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("pj_tenant_cnpj_idx").on(table.tenantId, table.cnpj),
]);

// Socios (Partners for PJ)
export const socios = pgTable("socios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pessoaJuridicaId: varchar("pessoa_juridica_id")
    .references(() => pessoasJuridicas.id, { onDelete: "cascade" })
    .notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  participacao: decimal("participacao", { precision: 5, scale: 2 }),
  cargo: varchar("cargo", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Funcionarios (Employees for PJ)
export const funcionarios = pgTable("funcionarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pessoaJuridicaId: varchar("pessoa_juridica_id")
    .references(() => pessoasJuridicas.id, { onDelete: "cascade" })
    .notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cargo: varchar("cargo", { length: 100 }),
  dataAdmissao: date("data_admissao"),
  salarioBruto: decimal("salario_bruto", { precision: 12, scale: 2 }),
  numeroDependentes: integer("numero_dependentes").default(0),
  elegivelVidaColetiva: boolean("elegivel_vida_coletiva").default(true),
  elegivelSaude: boolean("elegivel_saude").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patrimonio (Assets)
export const patrimonios = pgTable("patrimonios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  pessoaFisicaId: varchar("pessoa_fisica_id").references(() => pessoasFisicas.id, {
    onDelete: "cascade",
  }),
  pessoaJuridicaId: varchar("pessoa_juridica_id").references(
    () => pessoasJuridicas.id,
    { onDelete: "cascade" }
  ),
  tipo: tipoPatrimonioEnum("tipo").notNull(),
  descricao: varchar("descricao", { length: 300 }),
  valorAproximado: decimal("valor_aproximado", { precision: 14, scale: 2 }),
  dataAquisicao: date("data_aquisicao"),
  seguradoAtual: boolean("segurado_atual").default(false),
  marcaVeiculo: varchar("marca_veiculo", { length: 80 }),
  modeloVeiculo: varchar("modelo_veiculo", { length: 80 }),
  anoFabricacao: integer("ano_fabricacao"),
  anoModelo: integer("ano_modelo"),
  placa: varchar("placa", { length: 10 }),
  renavam: varchar("renavam", { length: 20 }),
  usoVeiculo: usoVeiculoEnum("uso_veiculo"),
  kmAtual: integer("km_atual"),
  tipoImovel: tipoImovelEnum("tipo_imovel"),
  areaM2: decimal("area_m2", { precision: 10, scale: 2 }),
  quartos: integer("quartos"),
  valorVenal: decimal("valor_venal", { precision: 14, scale: 2 }),
  residencialPrincipal: boolean("residencial_principal").default(false),
  enderecoId: varchar("endereco_id").references(() => enderecos.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Oportunidades (Opportunities/Proposals)
export const oportunidades = pgTable("oportunidades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  pessoaFisicaId: varchar("pessoa_fisica_id").references(() => pessoasFisicas.id, {
    onDelete: "cascade",
  }),
  pessoaJuridicaId: varchar("pessoa_juridica_id").references(
    () => pessoasJuridicas.id,
    { onDelete: "cascade" }
  ),
  produto: produtoSeguroEnum("produto").notNull(),
  scoreRisco: integer("score_risco").default(0),
  scorePotencial: integer("score_potencial").default(0),
  status: statusOportunidadeEnum("status").default("novo"),
  premioEstimado: decimal("premio_estimado", { precision: 12, scale: 2 }),
  observacoes: text("observacoes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interacoes (Interaction History)
export const interacoes = pgTable("interacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  pessoaFisicaId: varchar("pessoa_fisica_id").references(() => pessoasFisicas.id, {
    onDelete: "cascade",
  }),
  pessoaJuridicaId: varchar("pessoa_juridica_id").references(
    () => pessoasJuridicas.id,
    { onDelete: "cascade" }
  ),
  tipo: tipoInteracaoEnum("tipo").notNull(),
  descricao: text("descricao"),
  resultado: varchar("resultado", { length: 200 }),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Convites (Client Invitations)
export const convites = pgTable("convites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  email: varchar("email", { length: 200 }),
  telefone: varchar("telefone", { length: 20 }),
  nomeCliente: varchar("nome_cliente", { length: 200 }),
  mensagemPersonalizada: text("mensagem_personalizada"),
  pessoaFisicaId: varchar("pessoa_fisica_id").references(() => pessoasFisicas.id, {
    onDelete: "set null",
  }),
  pessoaJuridicaId: varchar("pessoa_juridica_id").references(
    () => pessoasJuridicas.id,
    { onDelete: "set null" }
  ),
  status: statusConviteEnum("status").default("pendente"),
  canalEnvio: canalEnvioEnum("canal_envio"),
  enviadoEm: timestamp("enviado_em"),
  aceitoEm: timestamp("aceito_em"),
  expiraEm: timestamp("expira_em"),
  clienteUserId: varchar("cliente_user_id").references(() => users.id),
  corretorId: varchar("corretor_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMTP Config (per tenant)
export const smtpConfigs = pgTable("smtp_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  host: varchar("host", { length: 200 }).notNull(),
  port: integer("port").default(587),
  secure: boolean("secure").default(false),
  usuario: varchar("usuario", { length: 200 }).notNull(),
  senha: varchar("senha", { length: 500 }).notNull(),
  remetenteNome: varchar("remetente_nome", { length: 200 }),
  remetenteEmail: varchar("remetente_email", { length: 200 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Config (Evolution API per tenant)
export const whatsappConfigs = pgTable("whatsapp_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  instanceName: varchar("instance_name", { length: 200 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  ativo: boolean("ativo").default(true),
  testatoEm: timestamp("testado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Tenant Configuration Tables
// ============================================

// Tenant SMTP Config (one per tenant for client communication)
export const tenantSmtpConfig = pgTable("tenant_smtp_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  host: varchar("host", { length: 200 }).notNull(),
  port: integer("port").default(587),
  secure: boolean("secure").default(false),
  usuario: varchar("usuario", { length: 200 }).notNull(),
  senha: varchar("senha", { length: 500 }).notNull(),
  remetenteNome: varchar("remetente_nome", { length: 200 }),
  remetenteEmail: varchar("remetente_email", { length: 200 }),
  ativo: boolean("ativo").default(true),
  testatoEm: timestamp("testado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// SaaS Admin Global Configuration Tables
// ============================================

// Global SMTP Config (managed by SaaS Admin - single active config)
export const saasSmtpConfig = pgTable("saas_smtp_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull(),
  host: varchar("host", { length: 200 }).notNull(),
  port: integer("port").default(587),
  secure: boolean("secure").default(false),
  usuario: varchar("usuario", { length: 200 }).notNull(),
  senha: varchar("senha", { length: 500 }).notNull(),
  remetenteNome: varchar("remetente_nome", { length: 200 }),
  remetenteEmail: varchar("remetente_email", { length: 200 }),
  ativo: boolean("ativo").default(true),
  testatoEm: timestamp("testado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ChatGPT API Config (managed by SaaS Admin)
export const saasChatgptConfig = pgTable("saas_chatgpt_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  modelo: varchar("modelo", { length: 100 }).default("gpt-4"),
  maxTokens: integer("max_tokens").default(2000),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Evolution API Config for system messaging (managed by SaaS Admin)
export const saasEvolutionConfig = pgTable("saas_evolution_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull(),
  instanceName: varchar("instance_name", { length: 200 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const pessoasFisicasRelations = relations(pessoasFisicas, ({ one, many }) => ({
  endereco: one(enderecos, {
    fields: [pessoasFisicas.enderecoId],
    references: [enderecos.id],
  }),
  dependentes: many(dependentes),
  patrimonios: many(patrimonios),
  oportunidades: many(oportunidades),
  interacoes: many(interacoes),
  createdByUser: one(users, {
    fields: [pessoasFisicas.createdBy],
    references: [users.id],
  }),
}));

export const pessoasJuridicasRelations = relations(pessoasJuridicas, ({ one, many }) => ({
  enderecoSede: one(enderecos, {
    fields: [pessoasJuridicas.enderecoSedeId],
    references: [enderecos.id],
  }),
  socios: many(socios),
  funcionarios: many(funcionarios),
  patrimonios: many(patrimonios),
  oportunidades: many(oportunidades),
  interacoes: many(interacoes),
  createdByUser: one(users, {
    fields: [pessoasJuridicas.createdBy],
    references: [users.id],
  }),
}));

export const dependentesRelations = relations(dependentes, ({ one }) => ({
  pessoaFisica: one(pessoasFisicas, {
    fields: [dependentes.pessoaFisicaId],
    references: [pessoasFisicas.id],
  }),
}));

export const sociosRelations = relations(socios, ({ one }) => ({
  pessoaJuridica: one(pessoasJuridicas, {
    fields: [socios.pessoaJuridicaId],
    references: [pessoasJuridicas.id],
  }),
}));

export const funcionariosRelations = relations(funcionarios, ({ one }) => ({
  pessoaJuridica: one(pessoasJuridicas, {
    fields: [funcionarios.pessoaJuridicaId],
    references: [pessoasJuridicas.id],
  }),
}));

export const patrimoniosRelations = relations(patrimonios, ({ one }) => ({
  pessoaFisica: one(pessoasFisicas, {
    fields: [patrimonios.pessoaFisicaId],
    references: [pessoasFisicas.id],
  }),
  pessoaJuridica: one(pessoasJuridicas, {
    fields: [patrimonios.pessoaJuridicaId],
    references: [pessoasJuridicas.id],
  }),
  endereco: one(enderecos, {
    fields: [patrimonios.enderecoId],
    references: [enderecos.id],
  }),
}));

export const oportunidadesRelations = relations(oportunidades, ({ one }) => ({
  pessoaFisica: one(pessoasFisicas, {
    fields: [oportunidades.pessoaFisicaId],
    references: [pessoasFisicas.id],
  }),
  pessoaJuridica: one(pessoasJuridicas, {
    fields: [oportunidades.pessoaJuridicaId],
    references: [pessoasJuridicas.id],
  }),
  createdByUser: one(users, {
    fields: [oportunidades.createdBy],
    references: [users.id],
  }),
}));

export const interacoesRelations = relations(interacoes, ({ one }) => ({
  pessoaFisica: one(pessoasFisicas, {
    fields: [interacoes.pessoaFisicaId],
    references: [pessoasFisicas.id],
  }),
  pessoaJuridica: one(pessoasJuridicas, {
    fields: [interacoes.pessoaJuridicaId],
    references: [pessoasJuridicas.id],
  }),
  createdByUser: one(users, {
    fields: [interacoes.createdBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnderecoSchema = createInsertSchema(enderecos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPessoaFisicaSchema = createInsertSchema(pessoasFisicas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scoreVida: true,
  scoreAuto: true,
  scoreResidencial: true,
  scoreRcProfissional: true,
  scorePrevidencia: true,
  scoreSaude: true,
  consentimentoTimestamp: true,
});

export const insertDependenteSchema = createInsertSchema(dependentes).omit({
  id: true,
  createdAt: true,
});

export const insertPessoaJuridicaSchema = createInsertSchema(pessoasJuridicas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scoreVidaColetiva: true,
  scoreSaudeColetiva: true,
  scorePatrimonial: true,
  scoreRc: true,
  consentimentoTimestamp: true,
});

export const insertSocioSchema = createInsertSchema(socios).omit({
  id: true,
  createdAt: true,
});

export const insertFuncionarioSchema = createInsertSchema(funcionarios).omit({
  id: true,
  createdAt: true,
});

export const insertPatrimonioSchema = createInsertSchema(patrimonios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOportunidadeSchema = createInsertSchema(oportunidades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInteracaoSchema = createInsertSchema(interacoes).omit({
  id: true,
  createdAt: true,
});

export const insertConviteSchema = createInsertSchema(convites).omit({
  id: true,
  createdAt: true,
  token: true,
  enviadoEm: true,
  aceitoEm: true,
  expiraEm: true,
  clienteUserId: true,
});

export const insertSmtpConfigSchema = createInsertSchema(smtpConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappConfigSchema = createInsertSchema(whatsappConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SaaS Admin Config Insert Schemas
export const insertTenantSmtpConfigSchema = createInsertSchema(tenantSmtpConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasSmtpConfigSchema = createInsertSchema(saasSmtpConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasChatgptConfigSchema = createInsertSchema(saasChatgptConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasEvolutionConfigSchema = createInsertSchema(saasEvolutionConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SaaS Insert Schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeguradoraMasterSchema = createInsertSchema(seguradorasMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTipoSeguroMasterSchema = createInsertSchema(tiposSeguroMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeguradoraProdutoSchema = createInsertSchema(seguradoraProdutos).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessRuleTemplateSchema = createInsertSchema(businessRuleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSeguradoraContatoSchema = createInsertSchema(tenantSeguradoraContatos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantPolicySchema = createInsertSchema(tenantPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantAiTokenUsageSchema = createInsertSchema(tenantAiTokenUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantChannelConnectionSchema = createInsertSchema(tenantChannelConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth Insert Schemas
export const insertAuthCredentialsSchema = createInsertSchema(authCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRolesTable).omit({
  id: true,
  createdAt: true,
});

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertClientPortalAccessSchema = createInsertSchema(clientPortalAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEndereco = z.infer<typeof insertEnderecoSchema>;
export type Endereco = typeof enderecos.$inferSelect;
export type InsertPessoaFisica = z.infer<typeof insertPessoaFisicaSchema>;
export type PessoaFisica = typeof pessoasFisicas.$inferSelect;
export type InsertDependente = z.infer<typeof insertDependenteSchema>;
export type Dependente = typeof dependentes.$inferSelect;
export type InsertPessoaJuridica = z.infer<typeof insertPessoaJuridicaSchema>;
export type PessoaJuridica = typeof pessoasJuridicas.$inferSelect;
export type InsertSocio = z.infer<typeof insertSocioSchema>;
export type Socio = typeof socios.$inferSelect;
export type InsertFuncionario = z.infer<typeof insertFuncionarioSchema>;
export type Funcionario = typeof funcionarios.$inferSelect;
export type InsertPatrimonio = z.infer<typeof insertPatrimonioSchema>;
export type Patrimonio = typeof patrimonios.$inferSelect;
export type InsertOportunidade = z.infer<typeof insertOportunidadeSchema>;
export type Oportunidade = typeof oportunidades.$inferSelect;
export type InsertInteracao = z.infer<typeof insertInteracaoSchema>;
export type Interacao = typeof interacoes.$inferSelect;
export type InsertConvite = z.infer<typeof insertConviteSchema>;
export type Convite = typeof convites.$inferSelect;
export type InsertSmtpConfig = z.infer<typeof insertSmtpConfigSchema>;
export type SmtpConfig = typeof smtpConfigs.$inferSelect;
export type InsertWhatsappConfig = z.infer<typeof insertWhatsappConfigSchema>;
export type WhatsappConfig = typeof whatsappConfigs.$inferSelect;

// SaaS Types
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertSeguradoraMaster = z.infer<typeof insertSeguradoraMasterSchema>;
export type SeguradoraMaster = typeof seguradorasMaster.$inferSelect;
export type InsertTipoSeguroMaster = z.infer<typeof insertTipoSeguroMasterSchema>;
export type TipoSeguroMaster = typeof tiposSeguroMaster.$inferSelect;
export type InsertSeguradoraProduto = z.infer<typeof insertSeguradoraProdutoSchema>;
export type SeguradoraProduto = typeof seguradoraProdutos.$inferSelect;
export type InsertBusinessRuleTemplate = z.infer<typeof insertBusinessRuleTemplateSchema>;
export type BusinessRuleTemplate = typeof businessRuleTemplates.$inferSelect;
export type InsertTenantSeguradoraContato = z.infer<typeof insertTenantSeguradoraContatoSchema>;
export type TenantSeguradoraContato = typeof tenantSeguradoraContatos.$inferSelect;
export type InsertTenantPolicy = z.infer<typeof insertTenantPolicySchema>;
export type TenantPolicy = typeof tenantPolicies.$inferSelect;
export type InsertTenantAiTokenUsage = z.infer<typeof insertTenantAiTokenUsageSchema>;
export type TenantAiTokenUsage = typeof tenantAiTokenUsage.$inferSelect;
export type InsertTenantChannelConnection = z.infer<typeof insertTenantChannelConnectionSchema>;
export type TenantChannelConnection = typeof tenantChannelConnections.$inferSelect;

// Auth Types
export type InsertAuthCredentials = z.infer<typeof insertAuthCredentialsSchema>;
export type AuthCredentials = typeof authCredentials.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRolesTable.$inferSelect;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type AuthToken = typeof authTokens.$inferSelect;
export type InsertClientPortalAccess = z.infer<typeof insertClientPortalAccessSchema>;
export type ClientPortalAccess = typeof clientPortalAccess.$inferSelect;

// SaaS Admin Config Types
export type InsertTenantSmtpConfig = z.infer<typeof insertTenantSmtpConfigSchema>;
export type TenantSmtpConfig = typeof tenantSmtpConfig.$inferSelect;
export type InsertSaasSmtpConfig = z.infer<typeof insertSaasSmtpConfigSchema>;
export type SaasSmtpConfig = typeof saasSmtpConfig.$inferSelect;
export type InsertSaasChatgptConfig = z.infer<typeof insertSaasChatgptConfigSchema>;
export type SaasChatgptConfig = typeof saasChatgptConfig.$inferSelect;
export type InsertSaasEvolutionConfig = z.infer<typeof insertSaasEvolutionConfigSchema>;
export type SaasEvolutionConfig = typeof saasEvolutionConfig.$inferSelect;
