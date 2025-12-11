import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import nodemailer from 'nodemailer';
import {
  requireAdminPermission,
  getRequestInfo,
  createAuditLog
} from '@/lib/admin-auth';

// POST /api/admin/settings/test-smtp - Tester la configuration SMTP
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('settings.edit');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'Email de test requis' }, { status: 400 });
    }

    // Récupérer la configuration SMTP depuis la base de données
    const settings = await prisma.systemSetting.findMany({
      where: {
        category: 'email',
      },
    });

    const config: Record<string, string> = {};
    for (const setting of settings) {
      config[setting.key] = setting.value;
    }

    const host = config['email.smtp_host'];
    const port = parseInt(config['email.smtp_port'] || '587', 10);
    const user = config['email.smtp_user'];
    const password = config['email.smtp_password'];
    const fromAddress = config['email.from_address'] || 'noreply@asuite.local';
    const fromName = config['email.from_name'] || 'ASuite';

    // Vérifier si la configuration est complète
    if (!host) {
      return NextResponse.json({
        success: false,
        error: 'Serveur SMTP non configuré'
      }, { status: 400 });
    }

    if (!user || !password) {
      return NextResponse.json({
        success: false,
        error: 'Identifiants SMTP manquants (utilisateur ou mot de passe)'
      }, { status: 400 });
    }

    // Déterminer la langue de l'admin
    const locale = admin.locale || 'fr';
    const isEnglish = locale === 'en';

    // Traductions pour l'email de test
    const t = {
      subject: isEnglish
        ? '✅ SMTP Test ASuite - Configuration successful'
        : '✅ Test SMTP ASuite - Configuration réussie',
      title: isEnglish
        ? 'SMTP configuration successful!'
        : 'Configuration SMTP réussie !',
      body: isEnglish
        ? 'Your SMTP server is correctly configured and can send emails.'
        : 'Votre serveur SMTP est correctement configuré et peut envoyer des emails.',
      details: isEnglish ? 'Configuration details:' : 'Détails de la configuration :',
      server: isEnglish ? 'Server' : 'Serveur',
      sender: isEnglish ? 'Sender' : 'Expéditeur',
      footer: isEnglish ? 'All rights reserved' : 'Tous droits réservés',
      plainText: isEnglish
        ? `SMTP Test ASuite - Configuration successful!\n\nYour SMTP server is correctly configured.\nServer: ${host}:${port}\nSender: ${fromName} <${fromAddress}>`
        : `Test SMTP ASuite - Configuration réussie !\n\nVotre serveur SMTP est correctement configuré.\nServeur : ${host}:${port}\nExpéditeur : ${fromName} <${fromAddress}>`,
    };

    // Créer le transporteur SMTP
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true pour 465, false pour les autres ports
      auth: {
        user,
        pass: password,
      },
      // Timeout de 10 secondes
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // Vérifier la connexion
    await transporter.verify();

    // Envoyer l'email de test
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: testEmail,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t.title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
              <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="text-align: center; padding-bottom: 24px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">ASuite</h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; font-size: 48px;">✅</span>
                      </div>
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                        ${t.title}
                      </h2>
                      <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.5; text-align: center;">
                        ${t.body}
                      </p>
                      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 14px; color: #71717a; text-align: center;">
                        <strong>${t.details}</strong><br>
                        ${t.server} : ${host}:${port}<br>
                        ${t.sender} : ${fromName} &lt;${fromAddress}&gt;
                      </p>
                      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                        © ${new Date().getFullYear()} ASuite - ${t.footer}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `.trim(),
      text: t.plainText,
    });

    // Log d'audit
    await createAuditLog(
      admin.id,
      'admin.settings.smtp_test',
      'settings',
      undefined,
      { testEmail, host, port, success: true },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${testEmail}`
    });

  } catch (error) {
    console.error('SMTP test error:', error);

    let errorMessage = 'Erreur lors du test SMTP';

    if (error instanceof Error) {
      // Analyser les erreurs courantes
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connexion refusée - Vérifiez l\'hôte et le port SMTP';
      } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        errorMessage = 'Timeout - Le serveur SMTP ne répond pas';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Serveur SMTP introuvable - Vérifiez le nom d\'hôte';
      } else if (error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
        errorMessage = 'Authentification échouée - Vérifiez l\'utilisateur et le mot de passe';
      } else if (error.message.includes('self signed certificate')) {
        errorMessage = 'Certificat SSL non valide';
      } else if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
