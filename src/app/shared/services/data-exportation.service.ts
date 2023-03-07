import { Injectable } from '@angular/core';

import * as jspdf from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DataExportationService {

  public CSV_EXTENSION: any = '.csv';
  public CSV_TYPE: any = 'text/plain;charset=utf-8';
  time: string;
  


  constructor(
  ) {
    this.time = new Date().toISOString()
   }

  /**exports grid entries to xlsx */
  exportDataXlsx(exportArray: any, title: string): void {
    console.log(exportArray);
    
    exportArray = Array.from(new Set(exportArray));
    let doc = exportArray;
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(doc);
    let dataLength = exportArray.length; 
    let wscols = [];
    for (let i = 1; i < (dataLength - 1); i++) {
      wscols.push({wch: 30})
    }
    ws['!cols'] = wscols;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${title}`);
    XLSX.utils.sheet_add_aoa(ws, [
      [`CHANNEL-MANAGER ${this.time}`]
    ], {origin: -1});
    
    XLSX.writeFile(wb, `${title}_${this.time}.xlsx`);
  }

  /**exports entries to pdf */
  exportToPdf(cols: string[], rows: string[][], title: string): void {
    console.log("cols: ", cols);
    console.log("rows: ", rows);
    let doc = new jspdf.jsPDF();
    doc.text(`${title}`, 14, 30);
    autoTable(doc, {head: [cols], body: rows, styles: {fontSize: 4}, didDrawPage: (data: any) => {
      doc.setFontSize(5);
      doc.setTextColor(40);
      doc.text(`CHANNEL-MANAGER ${this.time}`, data.settings.margin.left, 5);
    } });
    doc.save(title);
  }

  /**exports entries to csv */
  private saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    saveAs(data, fileName);
  }

  exportToCsv(rows: Record<string, string>[], title: string) {
    const replacer = (key: any, value: null) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(rows[0]);
    let csv = rows.map((row: { [x: string]: any; }) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    var blob = new Blob([csvArray], {type: 'text/csv' })
    saveAs(blob, `${title}.csv`);
}
}
