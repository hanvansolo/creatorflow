import { SITE_URL } from './transport';

const LOGO_URL = `${SITE_URL}/images/logo.png`;

/** Ensure image URLs are absolute for email clients */
function absoluteImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function baseLayout(content: string, preheader: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Footy Feed</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#09090b; color:#d4d4d8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased;">
  <div style="display:none !important; max-height:0; overflow:hidden; mso-hide:all;">${preheader}</div>

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;">
    <tr><td align="center" style="padding:16px;">

      <!-- Container -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:16px; overflow:hidden; border:1px solid #27272a;">

        <!-- Header with logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 50%,#18181b 100%); padding:32px; text-align:center;">
            <a href="${SITE_URL}" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Footy Feed" width="180" height="40" style="width:180px; height:auto; display:inline-block; border:0;" />
            </a>
            <p style="color:rgba(255,255,255,0.7); font-size:12px; margin:12px 0 0; letter-spacing:1px; text-transform:uppercase;">Football News Without the Waffle</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="background-color:#18181b; padding:0;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#09090b; padding:24px 32px; text-align:center; border-top:1px solid #27272a;">
            <a href="${SITE_URL}" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Footy Feed" width="100" height="22" style="width:100px; height:auto; display:inline-block; border:0; opacity:0.5;" />
            </a>
            <p style="color:#52525b; font-size:11px; margin:12px 0 4px;">You're receiving this because you subscribed at footy-feed.com</p>
            <p style="margin:0;"><a href="${SITE_URL}/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#71717a; font-size:11px; text-decoration:underline;">Unsubscribe</a></p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function sectionTitle(text: string): string {
  return `
    <td style="padding:24px 32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-bottom:2px solid #dc2626; padding-bottom:10px;">
            <span style="color:#ffffff; font-size:18px; font-weight:800; letter-spacing:-0.3px;">${text}</span>
          </td>
        </tr>
      </table>
    </td>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="background-color:#dc2626; border-radius:8px; padding:14px 32px;">
          <a href="${url}" style="color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; display:inline-block;">${text} &rarr;</a>
        </td>
      </tr>
    </table>`;
}

export interface ArticleSummary {
  title: string;
  slug: string;
  summary: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface RaceInfo {
  name: string;
  circuitName: string;
  country: string;
  raceDate: string;
  round: number;
  slug: string;
  sessions?: { name: string; dateTime: string }[];
}

export interface RaceResult {
  position: number;
  driver: string;
  team: string;
  time?: string;
}

function articleCard(a: ArticleSummary, isHero: boolean = false): string {
  const imgUrl = absoluteImageUrl(a.imageUrl);

  if (isHero && imgUrl) {
    return `
      <tr>
        <td style="padding:0;">
          <a href="${SITE_URL}/news/${a.slug}" style="text-decoration:none;">
            <img src="${imgUrl}" alt="${a.title}" width="600" style="width:100%; height:auto; display:block; border:0;" />
          </a>
          <div style="padding:20px 32px 24px; border-bottom:1px solid #27272a;">
            <a href="${SITE_URL}/news/${a.slug}" style="text-decoration:none;">
              <p style="color:#ffffff; font-size:20px; font-weight:800; margin:0 0 8px; line-height:1.3;">${a.title}</p>
            </a>
            <p style="color:#a1a1aa; font-size:14px; line-height:1.5; margin:0 0 8px;">${a.summary}</p>
            <p style="color:#52525b; font-size:12px; margin:0;">${a.source} &bull; ${a.publishedAt}</p>
          </div>
        </td>
      </tr>`;
  }

  if (imgUrl) {
    return `
      <tr>
        <td style="padding:16px 32px; border-bottom:1px solid #27272a;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="100" style="vertical-align:top; padding-right:16px;">
                <a href="${SITE_URL}/news/${a.slug}" style="text-decoration:none;">
                  <img src="${imgUrl}" alt="" width="100" height="68" style="width:100px; height:68px; object-fit:cover; border-radius:8px; display:block; border:0;" />
                </a>
              </td>
              <td style="vertical-align:top;">
                <a href="${SITE_URL}/news/${a.slug}" style="text-decoration:none;">
                  <p style="color:#ffffff; font-size:15px; font-weight:700; margin:0 0 6px; line-height:1.3;">${a.title}</p>
                </a>
                <p style="color:#a1a1aa; font-size:13px; line-height:1.4; margin:0 0 4px;">${a.summary}</p>
                <p style="color:#52525b; font-size:11px; margin:0;">${a.source} &bull; ${a.publishedAt}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  return `
    <tr>
      <td style="padding:16px 32px; border-bottom:1px solid #27272a;">
        <a href="${SITE_URL}/news/${a.slug}" style="text-decoration:none;">
          <p style="color:#ffffff; font-size:15px; font-weight:700; margin:0 0 6px; line-height:1.3;">${a.title}</p>
        </a>
        <p style="color:#a1a1aa; font-size:13px; line-height:1.4; margin:0 0 4px;">${a.summary}</p>
        <p style="color:#52525b; font-size:11px; margin:0;">${a.source} &bull; ${a.publishedAt}</p>
      </td>
    </tr>`;
}

export function dailyRoundupEmail(articles: ArticleSummary[], date: string): { subject: string; html: string } {
  const hero = articles[0];
  const rest = articles.slice(1);

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Date badge -->
      <tr>
        <td style="padding:24px 32px 0; text-align:center;">
          <span style="display:inline-block; background-color:#27272a; color:#a1a1aa; font-size:12px; font-weight:600; padding:6px 16px; border-radius:20px; letter-spacing:0.5px;">${date}</span>
        </td>
      </tr>

      <!-- Section title -->
      <tr>${sectionTitle("Today's Top Stories")}</tr>

      <!-- Hero article with image -->
      ${hero ? articleCard(hero, true) : ''}

      <!-- Remaining articles -->
      ${rest.map(a => articleCard(a)).join('')}

      <!-- CTA -->
      <tr><td style="text-align:center; padding:8px 32px 32px;">
        ${ctaButton('Read All News', `${SITE_URL}/news`)}
      </td></tr>
    </table>`;

  return {
    subject: `Football Daily Roundup - ${date}`,
    html: baseLayout(content, `Today's biggest football stories: ${articles.slice(0, 2).map(a => a.title).join(', ')}`),
  };
}

export function weeklyRoundupEmail(articles: ArticleSummary[], weekLabel: string): { subject: string; html: string } {
  const hero = articles[0];
  const rest = articles.slice(1);

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 32px 0; text-align:center;">
          <span style="display:inline-block; background-color:#27272a; color:#a1a1aa; font-size:12px; font-weight:600; padding:6px 16px; border-radius:20px;">${weekLabel}</span>
        </td>
      </tr>

      <tr>${sectionTitle('This Week in Football')}</tr>

      <tr><td style="padding:0 32px 16px;">
        <p style="color:#a1a1aa; font-size:14px; margin:0;">The biggest stories you might have missed this week.</p>
      </td></tr>

      ${hero ? articleCard(hero, true) : ''}
      ${rest.map(a => articleCard(a)).join('')}

      <tr><td style="text-align:center; padding:8px 32px 32px;">
        ${ctaButton('Visit Footy Feed', SITE_URL)}
      </td></tr>
    </table>`;

  return {
    subject: `Football Weekly Roundup - ${weekLabel}`,
    html: baseLayout(content, `This week in football: ${articles.slice(0, 2).map(a => a.title).join(', ')}`),
  };
}

export function raceReminderEmail(race: RaceInfo): { subject: string; html: string } {
  const sessionsHtml = race.sessions?.map(s => `
    <tr>
      <td style="color:#d4d4d8; font-size:14px; padding:10px 0; border-bottom:1px solid #27272a;">${s.name}</td>
      <td style="color:#ef4444; font-size:14px; font-weight:600; padding:10px 0; border-bottom:1px solid #27272a; text-align:right;">${s.dateTime}</td>
    </tr>
  `).join('') || '';

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Race card -->
      <tr>
        <td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#27272a 0%,#3f3f46 100%); border-radius:16px; border:1px solid #3f3f46;">
            <tr><td style="padding:32px; text-align:center;">
              <p style="color:#ef4444; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin:0 0 8px;">&#x1F3C1; Round ${race.round}</p>
              <p style="color:#ffffff; font-size:26px; font-weight:900; margin:0 0 4px; letter-spacing:-0.5px;">${race.name}</p>
              <p style="color:#a1a1aa; font-size:14px; margin:0 0 16px;">${race.circuitName}, ${race.country}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td style="background-color:#dc2626; border-radius:8px; padding:8px 20px;">
                  <span style="color:#ffffff; font-size:16px; font-weight:800;">${race.raceDate}</span>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>

      ${sessionsHtml ? `
        <tr>${sectionTitle('Session Schedule')}</tr>
        <tr><td style="padding:0 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${sessionsHtml}
          </table>
          <p style="color:#52525b; font-size:11px; margin:12px 0 0;">Times shown in UTC. Visit footy-feed.com for your local times.</p>
        </td></tr>
      ` : ''}

      <tr><td style="text-align:center; padding:8px 32px 32px;">
        ${ctaButton('Full Race Preview', `${SITE_URL}/calendar/${race.slug}`)}
      </td></tr>
    </table>`;

  return {
    subject: `&#x1F3C1; Race Weekend: ${race.name}`,
    html: baseLayout(content, `${race.name} this weekend at ${race.circuitName}. Session times and race preview.`),
  };
}

export function raceRoundupEmail(race: RaceInfo, results: RaceResult[], keyStories: ArticleSummary[]): { subject: string; html: string } {
  const medals = ['&#x1F947;', '&#x1F948;', '&#x1F949;'];
  const podiumHtml = results.slice(0, 3).map((r, i) => {
    const bgColors = ['#27272a', '#1e1e21', '#1a1a1d'];
    return `
      <tr>
        <td style="padding:14px 16px; background-color:${bgColors[i]}; border-bottom:1px solid #3f3f46; border-radius:${i === 0 ? '8px 8px 0 0' : i === 2 ? '0 0 8px 8px' : '0'};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="36" style="font-size:22px; vertical-align:middle;">${medals[i]}</td>
              <td style="vertical-align:middle;">
                <span style="color:#ffffff; font-weight:800; font-size:15px;">${r.driver}</span>
                <br><span style="color:#71717a; font-size:12px;">${r.team}</span>
              </td>
              ${r.time ? `<td style="text-align:right; vertical-align:middle;"><span style="color:#a1a1aa; font-size:13px;">${r.time}</span></td>` : ''}
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const winner = results[0]?.driver || 'TBC';

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Race result header -->
      <tr>
        <td style="padding:32px; text-align:center;">
          <p style="color:#52525b; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:0 0 8px;">Race Result</p>
          <p style="color:#ffffff; font-size:26px; font-weight:900; margin:0 0 4px; letter-spacing:-0.5px;">${race.name}</p>
          <p style="color:#a1a1aa; font-size:14px; margin:0;">${race.circuitName}</p>
        </td>
      </tr>

      <!-- Winner highlight -->
      <tr>
        <td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#dc2626,#991b1b); border-radius:12px;">
            <tr><td style="padding:20px; text-align:center;">
              <p style="color:rgba(255,255,255,0.7); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin:0 0 4px;">&#x1F3C6; Winner</p>
              <p style="color:#ffffff; font-size:24px; font-weight:900; margin:0;">${winner}</p>
            </td></tr>
          </table>
        </td>
      </tr>

      <tr>${sectionTitle('Podium')}</tr>
      <tr><td style="padding:0 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #3f3f46; border-radius:8px; overflow:hidden;">
          ${podiumHtml}
        </table>
      </td></tr>

      ${keyStories.length > 0 ? `
        <tr>${sectionTitle('Key Stories')}</tr>
        ${keyStories.map(a => articleCard(a)).join('')}
      ` : ''}

      <tr><td style="text-align:center; padding:8px 32px 32px;">
        ${ctaButton('Full Race Debrief', `${SITE_URL}/calendar/${race.slug}`)}
      </td></tr>
    </table>`;

  return {
    subject: `&#x1F3C6; ${race.name}: ${winner} Wins!`,
    html: baseLayout(content, `${winner} wins the ${race.name}! Full results and analysis.`),
  };
}
