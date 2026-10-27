import * as XLSX from 'xlsx';
import { BulkApplicationRow } from './loan-workflow.models';

export const BULK_COLUMNS = ['national_id', 'requested_amount', 'tenor_months', 'product', 'application_id', 'reassessment_note'];

export function parseLoanCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') { cell += '"'; index++; }
        else { quoted = false; }
      } else { cell += char; }
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ',') { row.push(cell); cell = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') { index++; }
      row.push(cell); cell = '';
      if (row.some(value => value !== '')) { rows.push(row); }
      row = [];
      continue;
    }
    cell += char;
  }
  if (quoted) { throw new Error('The CSV has an unclosed quoted value.'); }
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some(value => value !== '')) { rows.push(row); }
  }
  return rows;
}

function textCell(value: unknown): string {
  if (value === undefined || value === null) { return ''; }
  return String(value).trim();
}

export function loanRowsFromCells(cells: unknown[][]): BulkApplicationRow[] {
  if (!cells.length) { throw new Error('The file has no application rows.'); }
  const header = cells[0].map(value => textCell(value).toLowerCase());
  const missing = ['national_id', 'requested_amount', 'tenor_months', 'product'].filter(column => !header.includes(column));
  if (missing.length) { throw new Error('Missing columns: ' + missing.join(', ') + '.'); }
  const body = cells.slice(1).filter(row => row.some(value => textCell(value) !== ''));
  if (body.length > 500) { throw new Error('Upload at most 500 applications at a time.'); }
  const indexOf = (name: string): number => header.indexOf(name);
  const seen = new Set<string>();
  return body.map((source, position) => {
    const nationalId = textCell(source[indexOf('national_id')]);
    const amount = Number(source[indexOf('requested_amount')]);
    const tenorMonths = Number(source[indexOf('tenor_months')]);
    const product = textCell(source[indexOf('product')]);
    const applicationId = indexOf('application_id') >= 0 ? textCell(source[indexOf('application_id')]) : '';
    const reassessmentNote = indexOf('reassessment_note') >= 0 ? textCell(source[indexOf('reassessment_note')]) : '';
    const errors: string[] = [];
    if (typeof source[indexOf('national_id')] === 'number') { errors.push('National ID must be stored as Text so leading zeroes are preserved.'); }
    if (!nationalId) { errors.push('National ID is required.'); }
    const key = nationalId.toUpperCase() + '|' + product + '|' + amount + '|' + tenorMonths + '|' + applicationId;
    if (nationalId && seen.has(key)) { errors.push('This row duplicates an earlier row in the file.'); }
    if (nationalId) { seen.add(key); }
    return {
      row: position + 2,
      nationalId,
      amount,
      tenorMonths,
      product,
      applicationId,
      reassessmentNote,
      errors,
      state: errors.length ? 'Invalid' : 'Ready',
      message: '',
      resultId: '',
      submissionKey: ''
    };
  });
}

export async function readLoanUpload(file: File | { name: string; size: number }): Promise<BulkApplicationRow[]> {
  const name = file.name || '';
  if (!/\.(csv|xlsx|xls)$/i.test(name)) { throw new Error('Upload a CSV, XLSX or XLS file.'); }
  if (file.size > 2 * 1024 * 1024) { throw new Error('The file is larger than 2 MB.'); }
  if (!(file instanceof File)) { throw new Error('Choose a CSV, XLSX or XLS file from this computer.'); }
  const buffer = await file.arrayBuffer();
  if (/\.csv$/i.test(name)) { return loanRowsFromCells(parseLoanCsv(new TextDecoder().decode(buffer))); }
  const book = XLSX.read(buffer, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  const cells = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' }) as unknown[][];
  return loanRowsFromCells(cells);
}
