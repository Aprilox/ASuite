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
 * Génère un token de vérification d'email
 * Le token est hashé avant d'être stocké en base (défense en profondeur)
 */
export async function generateVerificationToken(userId: string): Promise<string | null> {
  const { prisma } = await import('@asuite/database');

  try {
    // Générer un token aléatoire cryptographiquement sûr
    const token = crypto.randomBytes(32).toString('hex');

    // Hasher le token avant stockage (SHA-256)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Expiration réduite à 6 heures (contexte ultra-sécurisé)
    const expires = new Date(Date.now() + 3600000 * 6); // 6 heures

    // Supprimer les anciens tokens pour cet utilisateur
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `verify_email:${userId}`,
      },
    });

    // Créer le nouveau token (stocké hashé)
    await prisma.verificationToken.create({
      data: {
        identifier: `verify_email:${userId}`,
        token: hashedToken, // Token hashé en base
        expires,
      },
    });

    // Retourner le token en clair (à envoyer par email)
    return token;
  } catch (error) {
    console.error('Error generating verification token:', error);
    return null;
  }
}

/**
 * Vérifie un token de vérification d'email
 * Hash le token reçu avant de le chercher en base
 */
export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  try {
    // Hasher le token reçu pour le comparer avec la version hashée en base
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const verification = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verification) {
      return null;
    }

    // Vérifier si le token n'est pas expiré
    if (verification.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });
      return null;
    }

    // Extraire l'userId de l'identifier
    const match = verification.identifier.match(/^verify_email:(.+)$/);
    if (!match) {
      return null;
    }

    const userId = match[1];

    // Supprimer le token (usage unique)
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });

    return userId;
  } catch (error) {
    console.error('Error verifying email token:', error);
    return null;
  }
}

/**
 * Supprime un token de vérification utilisé
 */
export async function deleteVerificationToken(token: string): Promise<void> {
  try {
    await prisma.verificationToken.delete({
      where: { token },
    });
  } catch (error) {
    console.error('Error deleting verification token:', error);
  }
}

/**
 * Traductions pour les emails
 */
const emailTranslations = {
  fr: {
    passwordReset: {
      subject: 'Réinitialisation de votre mot de passe - ASuite',
      greeting: (name: string | null) => `Bonjour ${name || 'cher utilisateur'},`,
      title: 'Réinitialisation de votre mot de passe',
      body: 'Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.',
      button: 'Réinitialiser mon mot de passe',
      expiry: 'Ce lien expire dans 1 heure. Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.',
      footer: 'Tous droits réservés',
      plainText: (name: string | null, resetUrl: string) =>
        `Bonjour ${name || 'cher utilisateur'},\n\nVous avez demandé une réinitialisation de mot de passe.\n\nCliquez sur ce lien pour créer un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nASuite`,
    },
    emailVerification: {
      subject: 'Vérifiez votre adresse email - ASuite',
      greeting: (name: string | null) => `Bonjour ${name || 'cher utilisateur'},`,
      title: 'Vérifiez votre email',
      body: 'Merci de votre inscription. Veuillez vérifier votre adresse email pour accéder à votre compte.',
      button: 'Vérifier mon email',
      expiry: 'Ce lien expire dans 6 heures.',
      footer: 'Tous droits réservés',
      plainText: (name: string | null, verifyUrl: string) =>
        `Bonjour ${name || 'cher utilisateur'},\n\nVeuillez vérifier votre adresse email pour accéder à votre compte.\n\nCliquez sur ce lien pour vérifier :\n${verifyUrl}\n\nCe lien expire dans 6 heures.\n\nASuite`,
    },
  },
  en: {
    passwordReset: {
      subject: 'Reset your password - ASuite',
      greeting: (name: string | null) => `Hello ${name || 'dear user'},`,
      title: 'Reset your password',
      body: 'We received a request to reset the password for your account. Click the button below to create a new password.',
      button: 'Reset my password',
      expiry: 'This link expires in 1 hour. If you did not request this reset, you can ignore this email.',
      footer: 'All rights reserved',
      plainText: (name: string | null, resetUrl: string) =>
        `Hello ${name || 'dear user'},\n\nYou have requested a password reset.\n\nClick this link to create a new password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this reset, ignore this email.\n\nASuite`,
    },
    emailVerification: {
      subject: 'Verify your email address - ASuite',
      greeting: (name: string | null) => `Hello ${name || 'dear user'},`,
      title: 'Verify your email',
      body: 'Thank you for registering. Please verify your email address to access your account.',
      button: 'Verify my email',
      expiry: 'This link expires in 6 hours.',
      footer: 'All rights reserved',
      plainText: (name: string | null, verifyUrl: string) =>
        `Hello ${name || 'dear user'},\n\nPlease verify your email address to access your account.\n\nClick this link to verify:\n${verifyUrl}\n\nThis link expires in 6 hours.\n\nASuite`,
    },
  },
};

type SupportedLocale = keyof typeof emailTranslations;

function getEmailTranslations(locale: string) {
  const supportedLocale = (locale === 'en' ? 'en' : 'fr') as SupportedLocale;
  return emailTranslations[supportedLocale];
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * Utilise nodemailer pour l'envoi réel via SMTP
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string | null,
  resetToken: string,
  locale: string = 'fr'
): Promise<boolean> {
  const config = await getEmailConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  const t = getEmailTranslations(locale).passwordReset;

  // Si pas de config email, afficher dans la console (mode debug)
  if (!config) {
    console.log(`\n📧 ========== EMAIL DE RÉINITIALISATION (${locale.toUpperCase()}) ==========`);
    console.log(`   Destinataire: ${email}`);
    console.log(`   Nom: ${userName || 'Utilisateur'}`);
    console.log(`   Lien: ${resetUrl}`);
    console.log(`   Langue: ${locale}`);
    console.log('   (Valide 1 heure)');
    console.log('   ⚠️ SMTP non configuré - email non envoyé');
    console.log('=================================================\n');
    return true; // Retourner true pour ne pas révéler si l'email existe
  }

  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: email,
      subject: t.subject,
      html: getPasswordResetEmailTemplate(userName, resetUrl, locale),
      text: t.plainText(userName, resetUrl),
    });

    console.log(`📧 Email de réinitialisation envoyé à ${email} (${locale})`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Template HTML pour l'email de réinitialisation
 */
export function getPasswordResetEmailTemplate(userName: string | null, resetUrl: string, locale: string = 'fr'): string {
  const t = getEmailTranslations(locale).passwordReset;
  const lang = locale === 'en' ? 'en' : 'fr';

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${t.title}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                ${t.greeting(userName)}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                ${t.body}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                ${t.expiry}
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
  `.trim();
}

/**
 * Envoie un email de vérification d'email
 */
export async function sendVerificationEmail(
  email: string,
  userName: string | null,
  token: string,
  locale: string = 'fr'
): Promise<boolean> {
  const config = await getEmailConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // Point directly to the API endpoint which handles verification and redirects
  const verifyUrl = `${appUrl}/api/auth/verify-email/confirm?token=${token}`;
  const t = getEmailTranslations(locale).emailVerification;

  // Si pas de config email, afficher dans la console (mode debug)
  if (!config) {
    console.log(`\n📧 ========== EMAIL DE VÉRIFICATION (${locale.toUpperCase()}) ==========`);
    console.log(`   Destinataire: ${email}`);
    console.log(`   Nom: ${userName || 'Utilisateur'}`);
    console.log(`   Lien: ${verifyUrl}`);
    console.log(`   Langue: ${locale}`);
    console.log('   (Valide 24 heures)');
    console.log('   ⚠️ SMTP non configuré - email non envoyé');
    console.log('=================================================\n');
    return true; // Retourner true pour simuler l'envoi
  }

  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: email,
      subject: t.subject,
      html: getVerificationEmailTemplate(userName, verifyUrl, locale),
      text: t.plainText(userName, verifyUrl),
    });

    console.log(`📧 Email de vérification envoyé à ${email} (${locale})`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Template HTML pour l'email de vérification
 */
export function getVerificationEmailTemplate(userName: string | null, verifyUrl: string, locale: string = 'fr'): string {
  const t = getEmailTranslations(locale).emailVerification;
  const lang = locale === 'en' ? 'en' : 'fr';

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${t.title}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                ${t.greeting(userName)}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.5;">
                ${t.body}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                ${t.expiry}
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
  `.trim();
}




