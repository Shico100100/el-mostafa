import * as ExcelJS from 'exceljs';

export function jsonToSheetBuffer(
  data: Record<string, unknown>[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  addDataSheet(workbook, data, sheetName);
  return workbook.xlsx.writeBuffer().then((b) => b as unknown as Buffer);
}

export function multiSheetToBuffer(
  sheets: { name: string; data: Record<string, unknown>[] }[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const { name, data } of sheets) {
    addDataSheet(workbook, data, name);
  }
  return workbook.xlsx.writeBuffer().then((b) => b as unknown as Buffer);
}

function addDataSheet(
  workbook: ExcelJS.Workbook,
  data: Record<string, unknown>[],
  sheetName: string,
) {
  const ws = workbook.addWorksheet(sheetName);
  if (data.length > 0) {
    ws.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
      width: 18,
    }));
    ws.addRows(data);
  }
}

export async function sheetToJson(
  buffer: Buffer,
): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = workbook.worksheets[0];
  if (!ws) return [];

  const rows: Record<string, unknown>[] = [];
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell) => {
    headers.push(String(cell.value ?? ''));
  });

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      rowData[headers[colNumber - 1]] = cell.value;
    });
    rows.push(rowData);
  });

  return rows;
}
