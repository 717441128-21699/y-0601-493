import * as XLSX from 'xlsx';

/**
 * 解析 Excel 文件为行数组
 * @param file File 对象（Excel 文件）
 * @returns 解析后的行数据数组（第一行为表头，后续为数据）
 */
export async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('读取 Excel 文件失败'));
    };

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Excel 文件内容为空'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(rows);
      } catch (error) {
        reject(new Error('解析 Excel 文件失败：' + (error as Error).message));
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 导出数据为 Excel 文件
 * @param data 数据数组（对象数组）
 * @param headers 表头配置 { key: 列标题 } 或 ['列1', '列2']
 * @param filename 导出文件名，默认 'export.xlsx'
 */
export function exportExcel(
  data: Record<string, any>[],
  headers: Record<string, string> | string[],
  filename = 'export.xlsx'
): void {
  let exportData: any[][];

  if (Array.isArray(headers)) {
    exportData = [
      headers,
      ...data.map((row) => Object.values(row)),
    ];
  } else {
    const keys = Object.keys(headers);
    const headerRow = Object.values(headers);
    exportData = [
      headerRow,
      ...data.map((row) => keys.map((k) => row[k])),
    ];
  }

  const worksheet = XLSX.utils.aoa_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
}

/**
 * 下载 Excel 导入模板（只有表头）
 * @param headers 表头配置 { key: 列标题 } 或 ['列1', '列2']
 * @param filename 模板文件名，默认 'template.xlsx'
 */
export function downloadTemplate(
  headers: Record<string, string> | string[],
  filename = 'template.xlsx'
): void {
  const headerRow = Array.isArray(headers) ? headers : Object.values(headers);
  const worksheet = XLSX.utils.aoa_to_sheet([headerRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
}
