import type { WhatsappConfig, Convite } from "@shared/schema";

interface SendResult {
  success: boolean;
  error?: string;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    return cleaned;
  }
  
  return cleaned;
}

export async function sendInviteWhatsApp(
  config: WhatsappConfig,
  convite: Convite,
  baseUrl: string
): Promise<SendResult> {
  try {
    if (!convite.telefone) {
      return { success: false, error: "Telefone não informado" };
    }

    const phoneNumber = formatPhoneNumber(convite.telefone);
    const inviteLink = `${baseUrl}/convite/${convite.token}`;

    let message: string;
    if (convite.mensagemPersonalizada) {
      message = `Olá ${convite.nomeCliente}!

${convite.mensagemPersonalizada}

Clique no link abaixo para aceitar o convite:
${inviteLink}`;
    } else {
      message = `Olá ${convite.nomeCliente}!

Você recebeu um convite para acessar o Portal do Cliente da nossa corretora de seguros.

Através do portal, você poderá:
- Visualizar suas proteções de seguro recomendadas
- Manter seus dados atualizados
- Acompanhar suas coberturas

Clique no link abaixo para aceitar o convite:
${inviteLink}

Atenciosamente,
Sua Corretora de Seguros`;
    }

    const endpoint = config.endpoint.replace(/\/$/, "");
    const url = `${endpoint}/message/sendText/${config.instanceName}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.apiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return { success: false, error: error.message };
  }
}
