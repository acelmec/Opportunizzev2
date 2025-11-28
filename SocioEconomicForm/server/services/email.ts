import nodemailer from "nodemailer";
import type { SmtpConfig, Convite, SaasSmtpConfig } from "@shared/schema";

interface SendResult {
  success: boolean;
  error?: string;
}

interface SmtpConfigLike {
  host: string;
  port: number | null;
  secure: boolean | null;
  usuario: string;
  senha: string;
  remetenteNome: string | null;
  remetenteEmail: string | null;
}

export async function sendTestEmail(
  config: SmtpConfigLike,
  destinationEmail: string
): Promise<SendResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      auth: {
        user: config.usuario,
        pass: config.senha,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Teste de Configuração SMTP</h1>
          </div>
          <div class="content">
            <div class="success">
              ✓ Configuração SMTP funcionando corretamente!
            </div>
            <p>Este é um e-mail de teste para verificar se as configurações de SMTP estão corretas.</p>
            <p><strong>Detalhes da configuração:</strong></p>
            <ul>
              <li>Servidor: ${config.host}</li>
              <li>Porta: ${config.port || 587}</li>
              <li>Conexão segura: ${config.secure ? "Sim" : "Não"}</li>
              <li>Remetente: ${config.remetenteNome || "Não configurado"} &lt;${config.remetenteEmail || config.usuario}&gt;</li>
            </ul>
            <p>Se você recebeu este e-mail, sua configuração está funcionando!</p>
          </div>
          <div class="footer">
            <p>Enviado por ${config.remetenteNome || "SeguroPro"}</p>
            <p style="font-size: 10px; color: #9ca3af;">Data: ${new Date().toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${config.remetenteNome || "SeguroPro"}" <${config.remetenteEmail || config.usuario}>`,
      to: destinationEmail,
      subject: "Teste de Configuração SMTP - SeguroPro",
      html: htmlContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendInviteEmail(
  config: SmtpConfigLike,
  convite: Convite,
  baseUrl: string
): Promise<SendResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      auth: {
        user: config.usuario,
        pass: config.senha,
      },
    });

    const inviteLink = `${baseUrl}/convite/${convite.token}`;

    const customMessage = convite.mensagemPersonalizada 
      ? `<p style="white-space: pre-wrap;">${convite.mensagemPersonalizada.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
      : `<p>Você recebeu um convite para acessar o portal do cliente da nossa corretora de seguros.</p>
         <p>Através do portal, você poderá:</p>
         <ul>
           <li>Visualizar suas proteções de seguro recomendadas</li>
           <li>Manter seus dados atualizados</li>
           <li>Acompanhar suas coberturas</li>
         </ul>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Você foi convidado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${convite.nomeCliente}</strong>,</p>
            ${customMessage}
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Aceitar Convite</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${inviteLink}">${inviteLink}</a>
            </p>
          </div>
          <div class="footer">
            <p>Este convite foi enviado por ${config.remetenteNome || "Sua Corretora de Seguros"}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${config.remetenteNome || "SeguroPro"}" <${config.remetenteEmail || config.usuario}>`,
      to: convite.email!,
      subject: "Você foi convidado para o Portal do Cliente",
      html: htmlContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}
