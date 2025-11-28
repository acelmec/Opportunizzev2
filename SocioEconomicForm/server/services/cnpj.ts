export interface CNPJData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  cep: string;
  naturezaJuridica: string;
  cnaeFiscal: number;
  cnaeFiscalDescricao: string;
  dataInicioAtividade: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  capitalSocial: string;
  porte: string;
  telefone1: string | null;
  telefone2: string | null;
  email: string | null;
  qsa: Array<{
    nome: string;
    qualificacao: string;
    cpfCnpj: string;
    dataEntrada: string;
  }>;
}

export interface CNPJQueryResult {
  success: boolean;
  data?: CNPJData;
  error?: string;
}

function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, "");
}

function mapPorte(porte: string | null): "micro" | "pequeno" | "medio" | "grande" | null {
  if (!porte) return null;
  const porteUpper = porte.toUpperCase();
  if (porteUpper.includes("MICRO")) return "micro";
  if (porteUpper.includes("PEQUENO")) return "pequeno";
  if (porteUpper.includes("MEDIO") || porteUpper.includes("MÉDIO")) return "medio";
  if (porteUpper.includes("GRANDE")) return "grande";
  return null;
}

export async function consultarCNPJ(cnpj: string): Promise<CNPJQueryResult> {
  try {
    const cnpjLimpo = formatCNPJ(cnpj);
    
    if (cnpjLimpo.length !== 14) {
      return { success: false, error: "CNPJ deve ter 14 dígitos" };
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "SeguroPro/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "CNPJ não encontrado na base da Receita Federal" };
      }
      if (response.status === 400) {
        return { success: false, error: "CNPJ inválido" };
      }
      if (response.status === 403) {
        return { success: false, error: "CNPJ bloqueado ou limite de requisições atingido. Tente novamente em alguns minutos." };
      }
      return { success: false, error: `Erro na consulta: ${response.status}` };
    }

    const data = await response.json();

    const cnpjData: CNPJData = {
      cnpj: data.cnpj || cnpjLimpo,
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || null,
      uf: data.uf || "",
      municipio: data.municipio || "",
      bairro: data.bairro || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || null,
      cep: data.cep || "",
      naturezaJuridica: data.natureza_juridica || "",
      cnaeFiscal: data.cnae_fiscal || 0,
      cnaeFiscalDescricao: data.cnae_fiscal_descricao || "",
      dataInicioAtividade: data.data_inicio_atividade || "",
      situacaoCadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || "",
      dataSituacaoCadastral: data.data_situacao_cadastral || "",
      capitalSocial: data.capital_social ? String(data.capital_social) : "0",
      porte: data.porte || data.descricao_porte || "",
      telefone1: data.ddd_telefone_1 || null,
      telefone2: data.ddd_telefone_2 || null,
      email: data.email || null,
      qsa: (data.qsa || []).map((socio: any) => ({
        nome: socio.nome_socio || socio.nome || "",
        qualificacao: socio.qualificacao_socio || socio.qualificacao || "",
        cpfCnpj: socio.cnpj_cpf_do_socio || "",
        dataEntrada: socio.data_entrada_sociedade || "",
      })),
    };

    return { success: true, data: cnpjData };
  } catch (error) {
    console.error("Erro ao consultar CNPJ:", error);
    return { success: false, error: "Erro de conexão com a API da Receita Federal" };
  }
}

export function mapCNPJDataToPessoaJuridica(cnpjData: CNPJData) {
  return {
    razaoSocial: cnpjData.razaoSocial,
    nomeFantasia: cnpjData.nomeFantasia || undefined,
    cnpj: cnpjData.cnpj,
    segmentoAtividade: cnpjData.cnaeFiscalDescricao || undefined,
    cnae: String(cnpjData.cnaeFiscal) || undefined,
    porteEmpresa: mapPorte(cnpjData.porte),
    telefone: cnpjData.telefone1 || undefined,
    email: cnpjData.email || undefined,
  };
}

export function mapCNPJDataToEndereco(cnpjData: CNPJData) {
  return {
    cep: cnpjData.cep,
    logradouro: cnpjData.logradouro,
    numero: cnpjData.numero,
    complemento: cnpjData.complemento || undefined,
    bairro: cnpjData.bairro,
    cidade: cnpjData.municipio,
    estado: cnpjData.uf,
  };
}

export function mapCNPJDataToSocios(cnpjData: CNPJData) {
  return cnpjData.qsa.map(socio => ({
    nome: socio.nome,
    cpf: socio.cpfCnpj,
    cargo: socio.qualificacao,
  }));
}
