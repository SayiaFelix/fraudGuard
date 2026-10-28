import { Component, OnDestroy, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditEvent, COUNTRY_MIX, CreditApplication, DECISION_TREND, PRODUCT_MIX, PortfolioSummary } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';
import { Subscription } from 'rxjs';

interface BriefStat {
  label: string;
  value: string;
  note: string;
}

interface BriefReason {
  label: string;
  count: number;
  share: string;
  split: string;
}

interface PortfolioBrief {
  lead: string;
  period: string;
  rates: BriefStat[];
  rateNote: string;
  reasons: BriefReason[];
  reasonNote: string;
  risk: BriefStat[];
  riskNote: string;
  movement: string[];
  movementNote: string;
  operations: string[];
  investigate: string[];
}

@Component({
  selector: 'app-credit-dashboard',
  templateUrl: './credit-dashboard.component.html',
  styleUrls: ['./credit-dashboard.component.scss']
})
export class CreditDashboardComponent implements OnInit, OnDestroy {
  summary?: PortfolioSummary;
  recent: CreditApplication[] = [];
  trend: any = {};
  donut: any = {};

  now: Date = new Date();
  lastRefreshed: Date | null = null;
  briefState: 'idle' | 'reading' | 'ready' = 'idle';
  brief: PortfolioBrief | null = null;
  briefAt: Date | null = null;

  private bookApps: CreditApplication[] = [];
  private audits: AuditEvent[] = [];
  private briefTimer: ReturnType<typeof setTimeout> | null = null;
  private sub = new Subscription();

  constructor(public credit: CreditDataService) {}

  ngOnInit(): void {
    this.now = new Date();
    
    this.buildTrendChart();

    this.sub.add(
      this.credit.summary$.subscribe(summary => {
        this.summary = summary;
        this.donut = this.buildDonut(summary);
        this.lastRefreshed = new Date();
      })
    );

    this.sub.add(
      this.credit.applications$.subscribe(apps => {
        this.bookApps = apps;
        this.recent = [...apps]
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
          .slice(0, 5);
      })
    );

    this.sub.add(this.credit.audit$.subscribe(events => {
      this.audits = events;
    }));
  }

  ngOnDestroy(): void {
    if (this.briefTimer) {
      clearTimeout(this.briefTimer);
    }
    this.sub.unsubscribe();
  }

  generateBrief(): void {
    if (!this.summary || this.briefState === 'reading') {
      return;
    }
    const summary = this.summary;
    const apps = this.bookApps.slice();
    const audits = this.audits.slice();
    this.briefState = 'reading';
    this.brief = null;
    if (this.briefTimer) {
      clearTimeout(this.briefTimer);
    }
    this.briefTimer = setTimeout(() => {
      this.brief = this.composeBrief(summary, apps, audits);
      this.briefAt = new Date();
      this.briefState = 'ready';
      this.briefTimer = null;
      this.downloadBriefPdf(this.brief);
    }, 700);
  }

  private downloadBriefPdf(brief: PortfolioBrief): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const ensure = (needed: number) => {
      if (y + needed > pageHeight - 16) {
        doc.addPage();
        y = 18;
      }
    };

    const write = (text: string, size: number, color: [number, number, number], weight: 'normal' | 'bold' = 'normal', gap = 3) => {
      doc.setFont('helvetica', weight);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, contentWidth) as string[];
      const lineMm = (doc.getFontSize() * doc.getLineHeightFactor() * 25.4) / 72;
      const block = lines.length * lineMm;
      ensure(block + gap);
      doc.text(lines, margin, y);
      y += block + gap;
    };

    const section = (title: string) => {
      ensure(14);
      y += 2;
      write(title, 12, [18, 32, 51], 'bold', 3);
    };

    const bullets = (lines: string[]) => {
      lines.forEach(line => write(`-  ${line}`, 10, [18, 32, 51], 'normal', 1.5));
    };

    [[31, 111, 235], [18, 183, 106], [245, 180, 0], [225, 6, 0]].forEach((color, index) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(index * (pageWidth / 4), 0, pageWidth / 4 + 0.3, 3.2, 'F');
    });

    write('Portfolio Insights', 18, [18, 32, 51], 'bold', 2);
    const prepared = (this.briefAt || new Date()).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    write(`AI Credit Intelligence  ·  ${prepared}`, 10, [102, 117, 138], 'normal', 5);
    write(brief.lead, 12, [15, 23, 42], 'bold', 2);
    write(brief.period, 9, [102, 117, 138], 'normal', 4);

    section('Decision rates');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Measure', 'Rate', 'Count']],
      body: brief.rates.map(rate => [rate.label, rate.value, rate.note]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, textColor: [18, 32, 51] },
      headStyles: { fillColor: [15, 40, 74], textColor: 255, fontStyle: 'bold' },
      theme: 'striped'
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    write(brief.rateNote, 9, [102, 117, 138], 'normal', 3);

    section('Reasons for decline and referral');
    if (brief.reasons.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Reason', 'Files', 'Share', 'Split']],
        body: brief.reasons.map(reason => [reason.label, String(reason.count), reason.share, reason.split]),
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, textColor: [18, 32, 51] },
        headStyles: { fillColor: [15, 40, 74], textColor: 255, fontStyle: 'bold' },
        theme: 'striped'
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    } else {
      write('No declined or referred reason codes are on the loaded files.', 10, [18, 32, 51]);
    }
    write(brief.reasonNote, 9, [102, 117, 138], 'normal', 3);

    section('Risk distribution');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Band', 'Share', 'Count']],
      body: brief.risk.map(band => [band.label, band.value, band.note]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, textColor: [18, 32, 51] },
      headStyles: { fillColor: [15, 40, 74], textColor: 255, fontStyle: 'bold' },
      theme: 'striped'
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    write(brief.riskNote, 9, [102, 117, 138], 'normal', 3);

    section('Change versus the prior period');
    bullets(brief.movement);
    write(brief.movementNote, 9, [102, 117, 138], 'normal', 3);

    section('Operational issues');
    bullets(brief.operations.length ? brief.operations : ['No operational issues are recorded on the current book.']);

    section('Where to look next');
    bullets(brief.investigate);

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 145);
      doc.text('Eclectics  ·  Portfolio Insights', margin, pageHeight - 8);
      doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    const stamp = (this.briefAt || new Date()).toISOString().slice(0, 10);
    doc.save(`portfolio-insights-${stamp}.pdf`);
  }

  closeBrief(): void {
    if (this.briefTimer) {
      clearTimeout(this.briefTimer);
      this.briefTimer = null;
    }
    this.briefState = 'idle';
    this.brief = null;
  }


  private buildTrendChart(): void {
    this.trend = {
      series: [
        { name: 'Approved', data: DECISION_TREND.approved },
        { name: 'Declined', data: DECISION_TREND.declined },
        { name: 'Referred', data: DECISION_TREND.referred }
      ],
      chart: { 
        type: 'area', 
        height: 280, 
        toolbar: { show: false }, 
        fontFamily: 'Inter, Manrope, Roboto, sans-serif', 
        zoom: { enabled: false } 
      },
      colors: ['#10B981', '#EF4444', '#F59E0B'],
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      fill: { 
        type: 'gradient', 
        gradient: { 
          shadeIntensity: 1, 
          opacityFrom: 0.25, 
          opacityTo: 0.02, 
          stops: [0, 100] 
        } 
      },
      xaxis: { 
        categories: DECISION_TREND.categories, 
        labels: { style: { colors: '#94A3B8', fontWeight: 500 } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { 
        min: 0, 
        labels: { style: { colors: '#94A3B8', fontWeight: 500 } } 
      },
      grid: { 
        borderColor: '#F1F5F9', 
        strokeDashArray: 4 
      },
      legend: { 
        position: 'top', 
        horizontalAlign: 'right', 
        fontWeight: 600,
        markers: { radius: 4 }
      },
      tooltip: { shared: true }
    };
  }

  private buildDonut(summary: PortfolioSummary): any {
    return {
      series: [summary.lowRisk, summary.mediumRisk, summary.highRisk],
      chart: { 
        type: 'donut', 
        height: 250, 
        fontFamily: 'Inter, Manrope, Roboto, sans-serif' 
      },
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      colors: ['#10B981', '#F59E0B', '#EF4444'],
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: { 
                fontSize: '13px', 
                color: '#64748B', 
                offsetY: 20,
                fontWeight: 500
              },
              value: { 
                fontSize: '28px', 
                fontWeight: 700, 
                color: '#0F172A', 
                offsetY: -15, 
                formatter: (val: string) => Number(val).toLocaleString('en-KE') 
              },
              total: { 
                show: true, 
                label: 'Total', 
                fontSize: '12px', 
                color: '#64748B', 
                formatter: () => (summary?.total ?? 0).toLocaleString('en-KE') 
              }
            }
          }
        }
      }
    };
  }

  private composeBrief(summary: PortfolioSummary, apps: CreditApplication[], audits: AuditEvent[]): PortfolioBrief {
    const outcomeSum = summary.approved + summary.declined + summary.referred;
    const outcomesMatch = outcomeSum === summary.total;
    const approval = this.share(summary.approved, summary.total);
    const referral = this.share(summary.referred, summary.total);
    const decline = this.share(summary.declined, summary.total);
    const counted = this.countText(summary.total);

    const rates: BriefStat[] = [
      { label: 'Approval rate', value: approval, note: `${this.countText(summary.approved)} approved` },
      { label: 'Referral rate', value: referral, note: `${this.countText(summary.referred)} referred` },
      { label: 'Decline rate', value: decline, note: `${this.countText(summary.declined)} declined` }
    ];

    const held = apps.filter(app => app.decision === 'Declined' || app.decision === 'Refer');
    const reasonRows = this.reasonRows(held);
    const fileWindow = this.fileWindow(apps);
    const reasonNote = apps.length
      ? `${this.countText(held.length)} of ${this.countText(apps.length)} loaded files are declined or referred${fileWindow ? ', submitted ' + fileWindow : ''}. Each reason is counted once per file. A file can carry more than one reason, so the shares can add up past 100%. The book of ${counted} applications does not include reason codes, so these shares are not scaled up to the book.`
      : 'No application files are loaded, so decline and referral reasons cannot be counted.';

    const riskSum = summary.lowRisk + summary.mediumRisk + summary.highRisk;
    const riskBase = riskSum === summary.total ? summary.total : riskSum;
    const risk: BriefStat[] = [
      { label: 'Low risk', value: this.share(summary.lowRisk, riskBase), note: this.countText(summary.lowRisk) },
      { label: 'Medium risk', value: this.share(summary.mediumRisk, riskBase), note: this.countText(summary.mediumRisk) },
      { label: 'High risk', value: this.share(summary.highRisk, riskBase), note: this.countText(summary.highRisk) }
    ];
    const riskNote = riskSum === summary.total
      ? `The three bands cover all ${counted} applications on the book.`
      : `The three bands sum to ${this.countText(riskSum)}, which is not the book of ${counted}. The shares use the band total.`;

    const movement = [
      `Application count is recorded ${this.movementText(summary.deltas.total)} against the prior 7 days.`,
      `Approved count is recorded ${this.movementText(summary.deltas.approved)}, declined count ${this.movementText(summary.deltas.declined)}, and referred count ${this.movementText(summary.deltas.referred)}.`,
      `Average score is recorded ${summary.deltas.score >= 0 ? 'up' : 'down'} ${Math.abs(summary.deltas.score)} points, at ${summary.avgScore} now.`,
      `Average decision time is ${summary.avgDecisionSeconds} seconds, recorded ${this.movementText(summary.deltas.decisionTime)}.`
    ];
    if (summary.deltas.approved > 0 && summary.deltas.declined > 0 && summary.deltas.total > 0) {
      movement.push('Approved and declined counts are both recorded higher, on a larger book. That is a volume movement. It is not, by itself, a change in the approval rate.');
    }

    const operations = this.operations(summary, apps, audits);
    const investigate = this.investigations(summary, apps, audits, reasonRows);

    const lead = outcomesMatch
      ? `Of ${counted} applications on the book, ${approval} are approved and ${referral} are referred. ${decline} are declined.`
      : `The book lists ${counted} applications. Approved, declined, and referred outcomes sum to ${this.countText(outcomeSum)}, so the rates below use the book total and the counts beside them.`;

    return {
      lead,
      period: 'Current book, with the movement recorded against the prior 7 days',
      rates,
      rateNote: outcomesMatch
        ? 'Approved, declined, and referred outcomes add up to the book.'
        : `Outcomes add up to ${this.countText(outcomeSum)} of ${counted}.`,
      reasons: reasonRows.slice(0, 5),
      reasonNote,
      risk,
      riskNote,
      movement,
      movementNote: 'These are the movements stored on the book. The prior window is not loaded as applications, so this brief does not calculate a prior approval rate or invent a trend beyond these figures.',
      operations,
      investigate
    };
  }

  private reasonRows(held: CreditApplication[]): BriefReason[] {
    const counts = new Map<string, { count: number; declined: number; referred: number }>();
    held.forEach(app => {
      app.reasonCodes.forEach(code => {
        const row = counts.get(code) || { count: 0, declined: 0, referred: 0 };
        row.count += 1;
        if (app.decision === 'Declined') {
          row.declined += 1;
        } else {
          row.referred += 1;
        }
        counts.set(code, row);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .map(([label, row]) => ({
        label,
        count: row.count,
        share: this.share(row.count, held.length),
        split: `${row.referred} referred, ${row.declined} declined`
      }));
  }

  private operations(summary: PortfolioSummary, apps: CreditApplication[], audits: AuditEvent[]): string[] {
    const lines: string[] = [];
    if (summary.openApplications > 0) {
      lines.push(`${this.countText(summary.openApplications)} applications are still open on the book.`);
    }
    if (summary.highRisk > 0) {
      lines.push(`High-risk exposure on the book is ${this.credit.money(summary.exposureAtRisk)} across ${this.countText(summary.highRisk)} high-risk applications.`);
    }

    const unassigned = apps.filter(app => app.assignedTo === 'Unassigned' && app.caseStatus !== 'Closed');
    const waiting = apps.filter(app => app.caseStatus === 'Awaiting information');
    const escalated = apps.filter(app => app.caseStatus === 'Escalated');
    const openHigh = apps.filter(app => app.risk === 'High' && app.caseStatus !== 'Closed');
    const openFiles = apps.filter(app => app.caseStatus !== 'Closed');

    if (apps.length) {
      lines.push(`${this.countText(openFiles.length)} of the ${this.countText(apps.length)} loaded files are still open, with ${this.credit.money(openFiles.reduce((sum, app) => sum + app.amount, 0))} requested.`);
    }
    if (unassigned.length) {
      lines.push(`${this.countText(unassigned.length)} open ${unassigned.length === 1 ? 'file has' : 'files have'} no officer: ${unassigned.map(app => app.id).join(', ')}.`);
    }
    if (waiting.length) {
      lines.push(`${this.countText(waiting.length)} ${waiting.length === 1 ? 'file is' : 'files are'} waiting on information: ${waiting.map(app => app.id).join(', ')}.`);
    }
    if (escalated.length) {
      lines.push(`${this.countText(escalated.length)} ${escalated.length === 1 ? 'file is' : 'files are'} escalated: ${escalated.map(app => `${app.id} (${app.risk.toLowerCase()} risk)`).join(', ')}.`);
    }
    if (openHigh.length) {
      lines.push(`${this.countText(openHigh.length)} high-risk ${openHigh.length === 1 ? 'file is' : 'files are'} still open among the loaded files.`);
    }

    audits
      .filter(event => /held/i.test(event.action))
      .forEach(event => {
        lines.push(`${event.action}: ${event.detail}`);
      });

    return lines;
  }

  private investigations(
    summary: PortfolioSummary,
    apps: CreditApplication[],
    audits: AuditEvent[],
    reasons: BriefReason[]
  ): string[] {
    const items: string[] = [];
    const top = reasons[0];
    if (top) {
      items.push(`Start with "${top.label}". It appears on ${this.countText(top.count)} of the declined or referred files (${top.share}).`);
    }
    const unassigned = apps.filter(app => app.assignedTo === 'Unassigned' && app.caseStatus !== 'Closed');
    if (unassigned.length) {
      items.push(`Assign the ${this.countText(unassigned.length)} open ${unassigned.length === 1 ? 'file' : 'files'} that have no officer before reading more into the referral rate.`);
    }
    if (audits.some(event => /held/i.test(event.action))) {
      items.push('Clear the held disbursement. An approved application is still waiting before payout.');
    }

    const mixTotal = PRODUCT_MIX.reduce((sum, row) => sum + row.count, 0);
    if (mixTotal === summary.total && PRODUCT_MIX.length) {
      const weakest = [...PRODUCT_MIX].sort((a, b) => a.approval - b.approval || b.count - a.count)[0];
      items.push(`${weakest.name} has the lowest recorded approval rate on the product mix, ${weakest.approval}% across ${this.countText(weakest.count)} applications (${this.share(weakest.count, summary.total)} of the book). Review that product on its own.`);
    }

    const countryTotal = COUNTRY_MIX.reduce((sum, row) => sum + row.count, 0);
    if (countryTotal === summary.total && COUNTRY_MIX.length) {
      const weakest = [...COUNTRY_MIX].sort((a, b) => a.approval - b.approval || b.count - a.count)[0];
      items.push(`${weakest.name} has the lowest recorded approval rate on the country mix, ${weakest.approval}% across ${this.countText(weakest.count)} applications.`);
    }

    if (!items.length) {
      items.push('The loaded extracts do not show a concentration that this brief can point to.');
    }
    return items.slice(0, 5);
  }

  private fileWindow(apps: CreditApplication[]): string {
    if (!apps.length) {
      return '';
    }
    const dates = apps.map(app => app.submittedAt).sort();
    const from = this.shortDate(dates[0]);
    const to = this.shortDate(dates[dates.length - 1]);
    return from === to ? from : `${from} to ${to}`;
  }

  private shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private share(part: number, total: number): string {
    if (!total) {
      return '0%';
    }
    const rounded = Math.round((part / total) * 1000) / 10;
    return Number.isInteger(rounded) ? `${rounded.toFixed(0)}%` : `${rounded.toFixed(1)}%`;
  }

  private countText(value: number): string {
    return Math.round(value).toLocaleString('en-KE');
  }

  private movementText(delta: number): string {
    if (!delta) {
      return 'unchanged';
    }
    return `${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)}%`;
  }
}