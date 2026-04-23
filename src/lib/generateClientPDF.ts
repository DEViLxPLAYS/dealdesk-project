import jsPDF from 'jspdf';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

// ─── Pipeline stage ordering ──────────────────────────────────────────────────
const STAGE_ORDER: Record<string, number> = {
  'new-lead': 1,
  'qualified': 2,
  'proposal-sent': 3,
  'negotiation': 4,
  'closed-won': 5,
  'closed-lost': 6,
};

const STAGE_LABELS: Record<string, string> = {
  'new-lead': 'New Lead',
  'qualified': 'Qualified',
  'proposal-sent': 'Proposal Sent',
  'negotiation': 'Negotiation',
  'closed-won': 'Closed Won ✓',
  'closed-lost': 'Closed Lost ✗',
};

// ─── Colours ──────────────────────────────────────────────────────────────────
const BRAND = { r: 234, g: 88, b: 12 };   // #ea580c  (accent orange)
const DARK  = { r: 15,  g: 23, b: 42  };  // #0f172a  (slate-900)
const MUTED = { r: 100, g: 116, b: 139 }; // #64748b  (slate-500)
const LIGHT = { r: 248, g: 250, b: 252 }; // #f8fafc  (slate-50)
const SUCCESS = { r: 22, g: 163, b: 74 }; // #16a34a

// ─── Helper: draw a horizontal rule ──────────────────────────────────────────
function hr(doc: jsPDF, y: number, lm: number, rm: number) {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);
}

// ─── Helper: section header ───────────────────────────────────────────────────
function sectionHeader(doc: jsPDF, label: string, y: number, lm: number) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(lm, y, 4, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text(label, lm + 9, y + 9.5);
  return y + 20;
}

// ─── Helper: key-value row ────────────────────────────────────────────────────
function kvRow(doc: jsPDF, key: string, value: string, y: number, lm: number, rm: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(key, lm, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  const lines = doc.splitTextToSize(value || '—', rm - lm - 40);
  doc.text(lines, lm + 42, y);
  return y + Math.max(lines.length * 5, 5) + 2;
}

// ─── Helper: pill badge (returns width) ──────────────────────────────────────
function pill(doc: jsPDF, text: string, x: number, y: number, fillRGB: [number,number,number]) {
  const w = doc.getTextWidth(text) + 8;
  doc.setFillColor(...fillRGB);
  doc.roundedRect(x, y - 5, w, 8, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + 4, y);
  return w;
}

// ──────────────────────────────────────────────────────────────────────────────
export async function generateClientPDF(client: Client) {
  // 1) Fetch all linked data in parallel
  const [dealsRes, invoicesRes, proposalsRes, contractsRes, projectsRes] = await Promise.all([
    supabase.from('deals').select('*').eq('client_id', client.id),
    supabase.from('invoices').select('*').eq('client_id', client.id),
    supabase.from('proposals').select('*').eq('client_id', client.id),
    supabase.from('contracts').select('*').eq('client_id', client.id),
    supabase.from('projects').select('*').eq('client_id', client.id),
  ]);

  const deals     = dealsRes.data     || [];
  const invoices  = invoicesRes.data  || [];
  const proposals = proposalsRes.data || [];
  const contracts = contractsRes.data || [];
  const projects  = projectsRes.data  || [];

  // 2) Build doc
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  const ph  = doc.internal.pageSize.getHeight();
  const lm  = 18;
  const rm  = pw - 18;

  let y = 0;

  // ── Header banner ──────────────────────────────────────────────────────────
  doc.setFillColor(DARK.r, DARK.g, DARK.b);
  doc.rect(0, 0, pw, 42, 'F');

  // Brand stripe
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 38, pw, 4, 'F');

  // Avatar circle
  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.circle(lm + 14, 21, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(initials, lm + 14, 24, { align: 'center' });

  // Client name + company
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, lm + 32, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 225);
  doc.text(client.company || 'Independent', lm + 32, 25);

  // Report label top-right
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 210);
  doc.text('CLIENT PROFILE REPORT', rm, 12, { align: 'right' });
  doc.setTextColor(150, 160, 180);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, rm, 19, { align: 'right' });
  doc.text(`Deal Desk CRM`, rm, 26, { align: 'right' });

  y = 52;

  // ── Contact & Profile ─────────────────────────────────────────────────────
  y = sectionHeader(doc, 'CLIENT PROFILE', y, lm);
  doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
  doc.roundedRect(lm, y, rm - lm, 52, 3, 3, 'F');
  y += 6;

  const mid = lm + (rm - lm) / 2 + 4;
  // Left column
  let ly = y;
  ly = kvRow(doc, 'Email:', client.email || '—', ly, lm + 4, mid - 4);
  ly = kvRow(doc, 'Phone:', client.phone || '—', ly, lm + 4, mid - 4);
  ly = kvRow(doc, 'WhatsApp:', client.whatsapp || '—', ly, lm + 4, mid - 4);
  ly = kvRow(doc, 'Country:', client.country || '—', ly, lm + 4, mid - 4);

  // Right column
  let ry = y;
  ry = kvRow(doc, 'Company:', client.company || '—', ry, mid, rm - 4);
  ry = kvRow(doc, 'Lead Source:', client.leadSource || '—', ry, mid, rm - 4);
  ry = kvRow(doc, 'Member Since:', client.createdAt.toLocaleDateString(), ry, mid, rm - 4);

  y = Math.max(ly, ry) + 8;

  if (client.message || client.notes) {
    doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
    doc.roundedRect(lm, y, rm - lm, 24, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('NOTES', lm + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    const noteLines = doc.splitTextToSize((client.message || client.notes || '').slice(0, 300), rm - lm - 10);
    doc.text(noteLines, lm + 4, y + 14);
    y += 30;
  }

  y += 4;
  hr(doc, y, lm, rm);
  y += 8;

  // ── Pipeline Status ────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'PIPELINE STATUS', y, lm);

  if (deals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('No pipeline deals found for this client.', lm + 4, y);
    y += 12;
  } else {
    for (const deal of deals) {
      const stage = deal.stage || 'new-lead';
      const stageIdx = STAGE_ORDER[stage] || 1;
      const totalStages = 5; // excluding closed-lost
      const progress = Math.min(Math.round((stageIdx / totalStages) * 100), 100);
      const isClosed = stage === 'closed-won';
      const isLost   = stage === 'closed-lost';

      doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
      doc.roundedRect(lm, y, rm - lm, 34, 3, 3, 'F');

      // Deal title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      doc.text(deal.title || deal.service || 'Deal', lm + 4, y + 9);

      // Value pill
      if (deal.value) {
        const valStr = `$${Number(deal.value).toLocaleString()}`;
        pill(doc, valStr, rm - doc.getTextWidth(valStr) - 18, y + 9, [BRAND.r, BRAND.g, BRAND.b]);
      }

      // Stage badge
      const stageLabel = STAGE_LABELS[stage] || stage;
      const stageColor: [number,number,number] = isClosed ? [SUCCESS.r, SUCCESS.g, SUCCESS.b]
                                                 : isLost  ? [180, 40, 40]
                                                 : [BRAND.r, BRAND.g, BRAND.b];
      pill(doc, stageLabel, lm + 4, y + 18, stageColor);

      // Progress bar
      if (!isLost) {
        const barX = lm + 4;
        const barW = rm - lm - 8;
        const barY = y + 22;
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(barX, barY, barW, 3.5, 1.5, 1.5, 'F');
        const fillColor: [number,number,number] = isClosed ? [SUCCESS.r, SUCCESS.g, SUCCESS.b] : [BRAND.r, BRAND.g, BRAND.b];
        doc.setFillColor(...fillColor);
        doc.roundedRect(barX, barY, barW * (progress / 100), 3.5, 1.5, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
        doc.text(`${progress}% to close`, rm - 4, barY + 3, { align: 'right' });
      }

      y += 40;
    }
  }

  hr(doc, y, lm, rm);
  y += 8;

  // ── Financials summary bar ─────────────────────────────────────────────────
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);

  doc.setFillColor(DARK.r, DARK.g, DARK.b);
  doc.roundedRect(lm, y, rm - lm, 24, 3, 3, 'F');
  const cols = 4;
  const cw   = (rm - lm) / cols;
  const statsData = [
    { label: 'Invoices Sent', value: String(invoices.length) },
    { label: 'Total Invoiced', value: `$${totalInvoiced.toLocaleString()}` },
    { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}` },
    { label: 'Proposals', value: String(proposals.length) },
  ];
  statsData.forEach((s, i) => {
    const cx = lm + cw * i + cw / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(s.value, cx, y + 11, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 190, 210);
    doc.text(s.label, cx, y + 18, { align: 'center' });
  });
  y += 32;

  // ── Invoices ──────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'INVOICES', y, lm);
  if (invoices.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('No invoices found for this client.', lm + 4, y);
    y += 12;
  } else {
    // Table header
    doc.setFillColor(DARK.r, DARK.g, DARK.b);
    doc.rect(lm, y, rm - lm, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 210, 225);
    const invCols = [lm + 3, lm + 42, lm + 90, lm + 120, rm - 3];
    doc.text('Invoice #', invCols[0], y + 5.5);
    doc.text('Title',      invCols[1], y + 5.5);
    doc.text('Date',       invCols[2], y + 5.5);
    doc.text('Status',     invCols[3], y + 5.5);
    doc.text('Amount',     invCols[4], y + 5.5, { align: 'right' });
    y += 10;

    invoices.forEach((inv: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
        doc.rect(lm, y - 1.5, rm - lm, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      doc.text(inv.invoice_number || '—', invCols[0], y + 4.5);
      doc.text((inv.title || inv.service || '—').slice(0, 24), invCols[1], y + 4.5);
      doc.text(inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—', invCols[2], y + 4.5);

      const statusColors: Record<string, [number,number,number]> = {
        paid: [SUCCESS.r, SUCCESS.g, SUCCESS.b],
        draft: [MUTED.r, MUTED.g, MUTED.b],
        sent: [37, 99, 235],
        overdue: [220, 38, 38],
      };
      const sc = statusColors[(inv.status || 'draft').toLowerCase()] || [MUTED.r, MUTED.g, MUTED.b];
      pill(doc, (inv.status || 'draft').toUpperCase(), invCols[3], y + 5.5, sc);

      doc.setFont('helvetica', 'bold');
      doc.text(`$${Number(inv.total_amount || 0).toLocaleString()}`, invCols[4], y + 4.5, { align: 'right' });
      y += 8;
    });
    y += 4;
  }

  hr(doc, y, lm, rm);
  y += 8;

  // ── Proposals ──────────────────────────────────────────────────────────────
  // Page break if needed
  if (y > ph - 80) {
    doc.addPage();
    y = 20;
  }

  y = sectionHeader(doc, 'PROPOSALS', y, lm);
  if (proposals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('No proposals have been sent to this client.', lm + 4, y);
    y += 12;
  } else {
    proposals.forEach((p: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
        doc.roundedRect(lm, y - 1.5, rm - lm, 10, 2, 2, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      doc.text((p.title || p.service || 'Proposal').slice(0, 40), lm + 4, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${Number(p.value || 0).toLocaleString()}`, rm - 30, y + 5);
      const psc: Record<string, [number,number,number]> = {
        draft: [MUTED.r, MUTED.g, MUTED.b],
        sent: [37, 99, 235],
        accepted: [SUCCESS.r, SUCCESS.g, SUCCESS.b],
        declined: [220, 38, 38],
      };
      pill(doc, (p.status || 'draft').toUpperCase(), rm - 4, y + 5.5, psc[p.status] || [MUTED.r, MUTED.g, MUTED.b]);
      y += 10;
    });
    y += 4;
  }

  hr(doc, y, lm, rm);
  y += 8;

  // ── Contracts ─────────────────────────────────────────────────────────────
  if (y > ph - 80) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, 'CONTRACTS', y, lm);
  if (contracts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('No contracts found for this client.', lm + 4, y);
    y += 12;
  } else {
    contracts.forEach((c: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
        doc.roundedRect(lm, y - 1.5, rm - lm, 10, 2, 2, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      doc.text((c.title || c.template || 'Contract').slice(0, 44), lm + 4, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(c.start_date ? new Date(c.start_date).toLocaleDateString() : '—', rm - 50, y + 5);
      const csc: Record<string, [number,number,number]> = {
        draft: [MUTED.r, MUTED.g, MUTED.b],
        active: [SUCCESS.r, SUCCESS.g, SUCCESS.b],
        signed: [37, 99, 235],
        expired: [220, 38, 38],
      };
      pill(doc, (c.status || 'draft').toUpperCase(), rm - 4, y + 5.5, csc[c.status] || [MUTED.r, MUTED.g, MUTED.b]);
      y += 10;
    });
    y += 4;
  }

  hr(doc, y, lm, rm);
  y += 8;

  // ── Active Projects ────────────────────────────────────────────────────────
  if (y > ph - 80) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, 'PROJECTS', y, lm);
  if (projects.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text('No projects found for this client.', lm + 4, y);
    y += 12;
  } else {
    for (const proj of projects) {
      if (y > ph - 50) { doc.addPage(); y = 20; }
      const progress = Number(proj.progress) || 0;

      doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
      doc.roundedRect(lm, y, rm - lm, 28, 3, 3, 'F');

      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      doc.text((proj.name || 'Project').slice(0, 50), lm + 4, y + 9);

      // Status
      const pjc: Record<string, [number,number,number]> = {
        active: [SUCCESS.r, SUCCESS.g, SUCCESS.b],
        'on-hold': [234, 179, 8],
        completed: [37, 99, 235],
      };
      const pjStatus = proj.status || 'active';
      pill(doc, pjStatus.toUpperCase(), lm + 4, y + 18, pjc[pjStatus] || [MUTED.r, MUTED.g, MUTED.b]);

      // Due date
      if (proj.due_date) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
        doc.text(`Due: ${new Date(proj.due_date).toLocaleDateString()}`, rm - 50, y + 9);
      }

      // Progress bar
      const barX = lm + 4;
      const barW = rm - lm - 8;
      const barY = y + 20;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barW, 3.5, 1.5, 1.5, 'F');
      const pjFill: [number,number,number] = pjStatus === 'completed' ? [37,99,235] : pjStatus === 'on-hold' ? [234,179,8] : [SUCCESS.r,SUCCESS.g,SUCCESS.b];
      doc.setFillColor(...pjFill);
      doc.roundedRect(barX, barY, barW * (progress / 100), 3.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text(`${progress}% complete`, rm - 4, barY + 3, { align: 'right' });

      y += 34;
    }
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = (doc.internal as any).pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(DARK.r, DARK.g, DARK.b);
    doc.rect(0, ph - 12, pw, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 160, 180);
    doc.text('Deal Desk CRM  •  Confidential Client Report', lm, ph - 4.5);
    doc.text(`Page ${p} of ${totalPages}`, rm, ph - 4.5, { align: 'right' });
  }

  // 3) Save
  const safeFilename = client.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`client_report_${safeFilename}_${Date.now()}.pdf`);
}
