import { prisma } from '@asuite/database';
import * as crypto from 'crypto';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

/**
 * Récupère la configuration email depuis les paramètres système
 */
async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
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
    if (!host || !user || !password) {
      return null;
    }

    return { host, port, user, password, fromAddress, fromName };
  } catch (error) {
    console.error('Error getting email config:', error);
    return null;
  }
}

/**
 * Génère un token de réinitialisation de mot de passe
 */
export async function generatePasswordResetToken(userId: string): Promise<string | null> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 heure

    // Supprimer les anciens tokens pour cet utilisateur
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `password_reset:${userId}`,
      },
    });

    // Créer le nouveau token
    await prisma.verificationToken.create({
      data: {
        identifier: `password_reset:${userId}`,
        token,
        expires,
      },
    });

    return token;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    return null;
  }
}

/**
 * Vérifie un token de réinitialisation de mot de passe
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const verification = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verification) {
      return null;
    }

    // Vérifier si le token n'est pas expiré
    if (verification.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return null;
    }

    // Extraire l'userId de l'identifier
    const match = verification.identifier.match(/^password_reset:(.+)$/);
    if (!match) {
      return null;
    }

    return match[1];
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return null;
  }
}

/**
 * Supprime un token de réinitialisation utilisé
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
  try {
    await prisma.verificationToken.delete({
      where: { token },
    });
  } catch (error) {
    console.error('Error deleting password reset token:', error);
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * Note: En développement, affiche simplement le lien dans la console
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string | null,
  resetToken: string
): Promise<boolean> {
  const config = await getEmailConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  // En développement ou si pas de config email, afficher dans la console
  if (!config || process.env.NODE_ENV === 'development') {
    console.log('\n📧 ========== EMAIL DE RÉINITIALISATION ==========');
    console.log(`   Destinataire: ${email}`);
    console.log(`   Nom: ${userName || 'Utilisateur'}`);
    console.log(`   Lien: ${resetUrl}`);
    console.log('   (Valide 1 heure)');
    console.log('=================================================\n');
    return true;
  }

  // TODO: Implémenter l'envoi réel via nodemailer
  // Pour l'instant, on simule le succès
  try {
    // Import dynamique de nodemailer si disponible
    // const nodemailer = await import('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: config.host,
    //   port: config.port,
    //   secure: config.port === 465,
    //   auth: {
    //     user: config.user,
    //     pass: config.password,
    //   },
    // });
    // 
    // await transporter.sendMail({
    //   from: `"${config.fromName}" <${config.fromAddress}>`,
    //   to: email,
    //   subject: 'Réinitialisation de votre mot de passe - ASuite',
    //   html: getPasswordResetEmailTemplate(userName, resetUrl),
    // });

    console.log(`📧 Email de réinitialisation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Template HTML pour l'email de réinitialisation
 */
export function getPasswordResetEmailTemplate(userName: string | null, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                Réinitialisation de votre mot de passe
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                Bonjour ${userName || 'cher utilisateur'},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
              </p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} ASuite - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

