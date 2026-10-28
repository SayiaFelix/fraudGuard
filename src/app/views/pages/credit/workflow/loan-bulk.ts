import { BulkApplicationRow } from './loan-workflow.models';

export const BULK_COLUMNS = ['national_id', 'requested_amount', 'tenor_months', 'product', 'application_id', 'reassessment_note'];
export const BULK_LIMIT = 500;

/** RFC 4180 CSV parser, including quoted commas, newlines and escaped quotes. */
export function parseLoanCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let value = ''; let quoted = false; let closed = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else { value += c; }
    } else if (c === '"') {
      if (value || closed) { throw new Error('Invalid CSV quoting. Enclose the complete field in double quotes.'); }
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(value); value = ''; closed = false;
      if (c !== ',') {
        rows.push(row); row = [];
        if (c === '\r' && source[i + 1] === '\n') { i++; }
        if (rows.length > BULK_LIMIT + 1) { throw new Error('Upload at most 500 applications per file.'); }
      }
    } else {
      if (closed && c.trim()) { throw new Error('Unexpected text after a quoted CSV field.'); }
      if (!closed) { value += c; }
    }
  }
  if (quoted) { throw new Error('CSV contains an unclosed quoted field.'); }
  if (value || row.length || closed) { row.push(value); rows.push(row); }
  return rows;
}

export function loanRowsFromCells(cells: unknown[][]): BulkApplicationRow[] {
  if (cells.length < 2) { throw new Error('The file needs a header and at least one application.'); }
  const headers = cells[0].map(x => String(x ?? '').replace(/^\uFEFF/, '').trim().toLowerCase());
  if (new Set(headers).size !== headers.length) { throw new Error('The file contains duplicate column names.'); }
  const required = BULK_COLUMNS.slice(0, 4);
  const missing = required.filter(x => !headers.includes(x));
  if (missing.length) { throw new Error('Missing columns: ' + missing.join(', ')); }
  const unknown = headers.filter(x => !BULK_COLUMNS.includes(x));
  if (unknown.length) { throw new Error('Unexpected columns: ' + unknown.join(', ') + '. Use the download template.'); }
  const nonEmpty = cells.slice(1).map((row, index) => ({ row, number: index + 2 })).filter(x => x.row.some(v => String(v ?? '').trim()));
  if (!nonEmpty.length || nonEmpty.length > BULK_LIMIT) { throw new Error('Upload between 1 and 500 non-empty application rows.'); }
  const seen = new Set<string>();
  return nonEmpty.map(({ row, number }) => {
    const get = (key: string): unknown => row[headers.indexOf(key)] ?? '';
    const nationalId = String(get('national_id')).trim();
    const amount = Number(get('requested_amount')); const tenorMonths = Number(get('tenor_months'));
    const product = String(get('product')).trim(); const applicationId = String(get('application_id')).trim();
    const errors: string[] = [];
    if (row.length > headers.length) { errors.push('Too many cells. Quote commas inside CSV fields.'); }
    if (typeof get('national_id') !== 'string') { errors.push('National ID must be Text in Excel to preserve leading zeros.'); }
    if (!nationalId) { errors.push('National ID is required.'); }
    if (!String(get('requested_amount')).trim() || !Number.isFinite(amount) || amount < 1) { errors.push('Requested amount must be at least KSh 1.'); }
    if (!String(get('tenor_months')).trim() || !Number.isInteger(tenorMonths) || tenorMonths < 1 || tenorMonths > 60) { errors.push('Tenor must be a whole number from 1 to 60 months.'); }
    if (!product) { errors.push('Product is required.'); }
    const key = applicationId || [nationalId.toUpperCase(), product.toLowerCase(), amount, tenorMonths].join('|');
    if (seen.has(key)) { errors.push('Duplicate application in this file.'); } seen.add(key);
    return { row: number, nationalId, amount, tenorMonths, product, applicationId,
      reassessmentNote: String(get('reassessment_note')).trim(), errors,
      state: errors.length ? 'Invalid' : 'Ready', message: '', resultId: '', submissionKey: '' };
  });
}

export async function readLoanUpload(file: File): Promise<BulkApplicationRow[]> {
  if (file.size > 2 * 1024 * 1024) { throw new Error('Choose a file no larger than 2 MB.'); }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') { return loanRowsFromCells(parseLoanCsv(await file.text())); }
  if (extension !== 'xlsx' && extension !== 'xls') { throw new Error('Choose a CSV, XLSX or XLS file.'); }
  const xlsx = await import('xlsx');
  let book: import('xlsx').WorkBook;
  try { book = xlsx.read(await file.arrayBuffer(), { type: 'array', sheetRows: BULK_LIMIT + 2, cellFormula: true, cellHTML: false }); }
  catch { throw new Error('This workbook could not be read. Check that it is a valid, unencrypted Excel file.'); }
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) { throw new Error('The workbook has no worksheet.'); }
  const range = sheet['!fullref'] || sheet['!ref'];
  if (range && xlsx.utils.decode_range(range).e.r > BULK_LIMIT) { throw new Error('Upload at most 500 applications on the first worksheet.'); }
  if (Object.keys(sheet).some(key => !key.startsWith('!') && sheet[key]?.f)) { throw new Error('Use cell values rather than Excel formulas in the upload worksheet.'); }
  return loanRowsFromCells(xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' }));
}
