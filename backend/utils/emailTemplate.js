/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - BRANDED EMAIL TEMPLATE SYSTEM
 * ==============================================================================
 * 
 * Module Description:
 * Generates ultra-modern, high-conversion, responsive transactional email templates
 * adhering strictly to the Agrily "Earth & Innovation" Design System.
 * 
 * Compatible across all major email clients:
 *  - Gmail (Web, iOS, Android)
 *  - Apple Mail (macOS, iOS)
 *  - Microsoft Outlook (Web, Desktop, 365)
 *  - Yahoo Mail & Mobile Webviews
 * 
 * Design Standards:
 *  - Primary Palette: Forest Emerald (#1b4332, #2d6a4f, #52b788)
 *  - Earth Accents: Warm Harvest Ochre (#bc6c25, #dda15e, #fefae0)
 *  - Surfaces: Slate White (#ffffff), Warm Cream (#f8faf9, #fffdf5)
 *  - Typography: Inter / Clean Sans-Serif (#0f172a, #475569)
 * 
 * @module utils/emailTemplate
 */

/**
 * Returns clean inline SVG leaf & sprout icon emblem for Agrily branding.
 * @returns {string} SVG string
 */
function getAgrilySproutSvg() {
  return `
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
      <rect width="48" height="48" rx="14" fill="#2d6a4f" />
      <circle cx="24" cy="24" r="20" stroke="#52b788" stroke-width="2" stroke-opacity="0.3" />
      <path d="M24 35V23C24 18.0294 28.0294 14 33 14H34V15C34 19.9706 29.9706 24 25 24H24" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 29C24 25.6863 20.866 23 17 23H15V24C15 27.3137 18.134 30 22 30H24" stroke="#dda15e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="35" r="2" fill="#52b788" />
    </svg>
  `;
}

/**
 * Wraps content in the bulletproof Agrily Responsive Email Container.
 * 
 * @param {Object} options
 * @param {string} options.preheader - Hidden preview text for inbox list
 * @param {string} options.badge - Header badge pill text (e.g. '🌾 Verified Produce Platform')
 * @param {string} [options.badgeColor='#1b4332']
 * @param {string} options.headline - Main hero title
 * @param {string} options.subheadline - Hero supporting description
 * @param {string} [options.graphicHtml] - Visual graphic card or illustration element
 * @param {string} options.contentHtml - Main body HTML content
 * @param {string} [options.ctaText] - Primary CTA button label
 * @param {string} [options.ctaUrl] - Primary CTA destination URL
 * @param {string} [options.fallbackUrl] - Direct text URL for copy-paste
 * @param {string} [options.noticeHtml] - Security or alert banner
 * @param {boolean} [options.showTrustPillars=true] - Display 3-pillar trust guarantee
 * @returns {string} Complete HTML email document
 */
function renderEmailShell({
  preheader = 'Agrily - Verified Agricultural Commerce & Produce Provenance',
  badge = '🌾 Verified Agricultural Marketplace',
  badgeColor = '#1b4332',
  headline = 'Important Update Regarding Your Agrily Account',
  subheadline = 'Connecting verified producers with commercial buyers across Nigeria.',
  graphicHtml = '',
  contentHtml = '',
  ctaText = '',
  ctaUrl = '',
  fallbackUrl = '',
  noticeHtml = '',
  showTrustPillars = true
}) {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${headline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Base resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f1f5f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-center { text-align: center !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f3; -webkit-font-smoothing: antialiased;">

  <!-- HIDDEN PREHEADER TEXT (Prevents raw code snippet in inbox previews) -->
  <div style="display: none; font-size: 1px; color: #f1f5f3; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- MAIN EMAIL WRAPPER TABLE -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f3;">
    <tr>
      <td align="center" style="padding: 12px;">

        <!-- 600px EMAIL CONTAINER -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">

          <!-- BRAND HEADER BANNER -->
          <tr>
            <td style="background: linear-gradient(135deg, #081c15 0%, #1b4332 55%, #2d6a4f 100%); padding: 32px 36px 28px 36px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 14px;">
                          ${getAgrilySproutSvg()}
                        </td>
                        <td valign="middle">
                          <span style="display: block; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.2;">
                            AGRILY
                          </span>
                          <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #dda15e; margin-top: 3px;">
                            Agricultural Commerce & Provenance
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background-color: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #d8f3dc; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px; display: inline-block;">
                      Verified
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td style="padding: 36px 36px 24px 36px; background-color: #ffffff;" class="mobile-padding">

              <!-- BADGE PILL -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 24px; padding: 6px 14px;">
                    <span style="color: ${badgeColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                      ${badge}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- HEADLINE -->
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">
                ${headline}
              </h1>

              <!-- SUBHEADLINE -->
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                ${subheadline}
              </p>

              <!-- GRAPHIC ILLUSTRATION CARD (IF PROVIDED) -->
              ${graphicHtml ? `
              <div style="margin-bottom: 28px;">
                ${graphicHtml}
              </div>
              ` : ''}

              <!-- CORE CONTENT BODY -->
              <div style="color: #334155; font-size: 15px; line-height: 1.65;">
                ${contentHtml}
              </div>

              <!-- CALL TO ACTION BUTTON (IF PROVIDED) -->
              ${ctaText && ctaUrl ? `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 24px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="24%" stroke="f" fillcolor="#2d6a4f">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">
                        ${ctaText}
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="${ctaUrl}" target="_blank" class="mobile-btn" style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(45, 106, 79, 0.35); letter-spacing: 0.3px; border: 1px solid #1b4332;">
                      ${ctaText} &nbsp;&rarr;
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- FALLBACK LINK BOX (IF PROVIDED) -->
              ${fallbackUrl ? `
              <div style="margin-top: 24px; background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                  Direct Activation Link:
                </p>
                <p style="margin: 0; font-size: 13px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; word-break: break-all; color: #2d6a4f; line-height: 1.4;">
                  <a href="${fallbackUrl}" target="_blank" style="color: #2d6a4f; text-decoration: underline;">${fallbackUrl}</a>
                </p>
              </div>
              ` : ''}

              <!-- SECURITY NOTICE BANNER (IF PROVIDED) -->
              ${noticeHtml ? `
              <div style="margin-top: 24px;">
                ${noticeHtml}
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- TRUST PILLARS (3-COLUMN AGRICULTURAL VALUES) -->
          ${showTrustPillars ? `
          <tr>
            <td style="padding: 24px 36px; background-color: #f8faf9; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding: 8px 10px 8px 0;">
                    <div style="text-align: left;">
                      <div style="font-size: 20px; line-height: 1; margin-bottom: 6px;">🛡️</div>
                      <div style="font-size: 13px; font-weight: 700; color: #1b4332; margin-bottom: 3px;">Agrily Escrow</div>
                      <div style="font-size: 11px; color: #64748b; line-height: 1.4;">Funds protected until goods arrive inspected.</div>
                    </div>
                  </td>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding: 8px 10px;">
                    <div style="text-align: left;">
                      <div style="font-size: 20px; line-height: 1; margin-bottom: 6px;">🌾</div>
                      <div style="font-size: 13px; font-weight: 700; color: #1b4332; margin-bottom: 3px;">Farm Provenance</div>
                      <div style="font-size: 11px; color: #64748b; line-height: 1.4;">100% verified Nigerian harvest origin.</div>
                    </div>
                  </td>
                  <td width="33.33%" valign="top" class="mobile-stack" style="padding: 8px 0 8px 10px;">
                    <div style="text-align: left;">
                      <div style="font-size: 20px; line-height: 1; margin-bottom: 6px;">⚡</div>
                      <div style="font-size: 13px; font-weight: 700; color: #1b4332; margin-bottom: 3px;">Swift Logistics</div>
                      <div style="font-size: 11px; color: #64748b; line-height: 1.4;">Waybill tracking & cold-chain oversight.</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- BRAND FOOTER -->
          <tr>
            <td style="padding: 32px 36px; background-color: #ffffff; text-align: center;" class="mobile-padding">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #1b4332; letter-spacing: 0.5px;">
                AGRILY AGRICULTURAL TECHNOLOGIES
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Nigeria's premier decentralized marketplace connecting farm-gate producers,<br/>
                grain aggregators, and commercial food processors.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                🔒 Agrily security team will never solicit your password or private banking PIN via email.<br/>
                For support, reach our agricultural logistics desk at <a href="mailto:yusuf.hilside@gmail.com" style="color: #2d6a4f; text-decoration: underline;">yusuf.hilside@gmail.com</a>
              </p>
              <div style="padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #cbd5e1;">
                &copy; ${currentYear} Agrily Inc. All rights reserved. &bull; Lagos &bull; Kano &bull; Abuja
              </div>
            </td>
          </tr>

        </table>
        <!-- END 600px EMAIL CONTAINER -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Creates visual graphics card for Account Verification emails.
 * @returns {string} HTML snippet
 */
function getVerificationGraphicCard() {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 22px; text-align: center;">
      <tr>
        <td align="center">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); border-radius: 50%; margin: 0 auto 14px auto; text-align: center; line-height: 64px; box-shadow: 0 6px 18px rgba(45, 106, 79, 0.25);">
            <span style="font-size: 32px; line-height: 64px; display: inline-block;">🌱</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #1b4332; margin-bottom: 4px;">
            One Step Away From Marketplace Access
          </div>
          <div style="font-size: 13px; color: #475569; max-width: 440px; margin: 0 auto; line-height: 1.5;">
            Confirm your email address to unlock wholesale produce contracts, publish harvest listings, and bid on verified produce consignments.
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Creates visual graphics card for Password Reset emails.
 * @returns {string} HTML snippet
 */
function getPasswordResetGraphicCard() {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fffdf5 0%, #fefae0 100%); border: 1px solid #fde68a; border-radius: 14px; padding: 22px; text-align: center;">
      <tr>
        <td align="center">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #7f3b08 0%, #bc6c25 100%); border-radius: 50%; margin: 0 auto 14px auto; text-align: center; line-height: 64px; box-shadow: 0 6px 18px rgba(188, 108, 37, 0.25);">
            <span style="font-size: 30px; line-height: 64px; display: inline-block;">🔐</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #7f3b08; margin-bottom: 4px;">
            Authorized Account Recovery
          </div>
          <div style="font-size: 13px; color: #57534e; max-width: 440px; margin: 0 auto; line-height: 1.5;">
            We received a verified request to update your Agrily password. Click the secure button below to choose your new credentials.
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generates the complete HTML for Email Address Verification.
 * 
 * @param {Object} params
 * @param {string} params.verifyUrl - Direct URL to verify token
 * @param {string} [params.email=''] - Recipient email address
 * @returns {string} Full HTML email
 */
function buildVerificationEmail({ verifyUrl, email = '' }) {
  const graphicHtml = getVerificationGraphicCard();
  const noticeHtml = `
    <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #854d0e; line-height: 1.5;">
        ⏱️ <strong>Security Notice:</strong> This activation link is time-sensitive and expires in 48 hours. If you did not create an Agrily account with ${email ? `<strong>${email}</strong>` : 'this email'}, please disregard this notice.
      </p>
    </div>
  `;

  return renderEmailShell({
    preheader: 'Welcome to Agrily! Activate your verified agricultural commerce account now.',
    badge: '🌾 Account Activation Required',
    badgeColor: '#1b4332',
    headline: 'Welcome to Agrily! Activate Your Account',
    subheadline: 'Thank you for registering on Nigeria\'s verified agricultural commerce and food provenance platform.',
    graphicHtml,
    contentHtml: `
      <p>Hello,</p>
      <p>Your registration is almost complete. To safeguard our agricultural trading network against unauthorized activity and enable escrow-backed transactions, please verify your email address.</p>
    `,
    ctaText: 'Activate Produce Account',
    ctaUrl: verifyUrl,
    fallbackUrl: verifyUrl,
    noticeHtml,
    showTrustPillars: true
  });
}

/**
 * Generates the complete HTML for Password Reset.
 * 
 * @param {Object} params
 * @param {string} params.resetUrl - Direct URL with reset code
 * @param {string} [params.email=''] - Recipient email
 * @returns {string} Full HTML email
 */
function buildPasswordResetEmail({ resetUrl, email = '' }) {
  const graphicHtml = getPasswordResetGraphicCard();
  const noticeHtml = `
    <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
        🛡️ <strong>Did not request this?</strong> If you did not request a password reset, you can safely ignore this message. Your password will remain unchanged and your account is secure.
      </p>
    </div>
  `;

  return renderEmailShell({
    preheader: 'Agrily Account Security - Reset your password',
    badge: '🔐 Security & Authentication',
    badgeColor: '#bc6c25',
    headline: 'Reset Your Agrily Password',
    subheadline: 'We received an authorized request to reset the login credentials for your Agrily produce account.',
    graphicHtml,
    contentHtml: `
      <p>Hello,</p>
      <p>You recently submitted a password reset request${email ? ` for <strong>${email}</strong>` : ''}. For your protection, this single-use link will expire shortly.</p>
    `,
    ctaText: 'Reset My Password',
    ctaUrl: resetUrl,
    fallbackUrl: resetUrl,
    noticeHtml,
    showTrustPillars: true
  });
}

module.exports = {
  renderEmailShell,
  buildVerificationEmail,
  buildPasswordResetEmail,
  getVerificationGraphicCard,
  getPasswordResetGraphicCard
};
