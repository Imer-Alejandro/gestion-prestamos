import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getDb } from "../database/db.js";
import { getClients } from "./client.service.js";
import { getLoansByStatus } from "./loan.service.js";

/**
 * Crear estilos para el Excel
 */
const createHeaderStyle = () => ({
  font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
  fill: { fgColor: { rgb: "13678A" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  },
});

const createTitleStyle = () => ({
  font: { bold: true, size: 18, color: { rgb: "13678A" } },
  alignment: { horizontal: "left", vertical: "center" },
});

const createSubtitleStyle = () => ({
  font: { size: 11, color: { rgb: "666666" } },
  alignment: { horizontal: "left", vertical: "center" },
});

/**
 * Agregar estilos a las celdas en un rango
 */
function addStylesToRange(worksheet, startRow, endRow, style) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = 1; col <= 20; col++) {
      const cellRef = XLSX.utils.encode_col(col - 1) + row;
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = style;
      }
    }
  }
}

/**
 * Exporta clientes a Excel
 */
export async function exportClientsToExcel(userId) {
  try {
    const clients = await getClients(userId);

    // Preparar datos formateados
    const data = clients.map((client) => ({
      "Nombre Completo": `${client.first_name} ${client.last_name}`,
      "Tipo Doc": client.document_type,
      "Número Doc": client.document_number,
      "Teléfono": client.phone_primary,
      "Email": client.email || "-",
      "Dirección": client.address_line || "-",
      "Ciudad": client.city || "-",
      "Ocupación": client.occupation || "-",
      "Ingreso Mensual": client.monthly_income || "-",
      "Límite Crédito": client.credit_limit || 0,
      "Deuda Total": client.totalDebt || 0,
      "Pagado": client.totalPaid || 0,
      "Pendiente": client.pendingDebt || 0,
      "Estado": client.status,
      "Préstamos Activos": client.activeLoansCount || 0,
    }));

    const workbook = XLSX.utils.book_new();
    
    // Crear hoja con título
    const wsData = [
      ["REPORTE DE CLIENTES"],
      [`Generado: ${new Date().toLocaleDateString("es-ES")}`],
      [""],
      ...XLSX.utils.json_to_sheet(data, { header: 1 }).slice(),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Aplicar estilos al título
    worksheet["A1"].s = createTitleStyle();
    worksheet["A2"].s = createSubtitleStyle();

    // Aplicar estilos a headers (row 4)
    const headerStyle = createHeaderStyle();
    for (let col = 0; col < Object.keys(data[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + "4";
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }

    // Ajustar ancho de columnas
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    // Guardar archivo
    const fileName = `Clientes_${new Date().toISOString().split("T")[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: "base64",
    });

    // Compartir archivo
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar Clientes",
      });
    }

    return fileUri;
  } catch (error) {
    console.error("Error exportando clientes:", error);
    throw error;
  }
}

/**
 * Exporta préstamos a Excel
 */
export async function exportLoansToExcel(userId) {
  try {
    const db = await getDb();

    // Obtener todos los préstamos del usuario con información del cliente
    const loans = await db.getAllAsync(`
      SELECT 
        l.*,
        c.first_name,
        c.last_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `, [userId]);

    const data = loans.map((loan) => ({
      "Contrato": loan.contract_number || "-",
      "Cliente": `${loan.first_name} ${loan.last_name}`,
      "Tipo": loan.loan_type || "-",
      "Monto Principal": loan.principal_amount || 0,
      "Monto Desembolsado": loan.disbursed_amount || 0,
      "Saldo Actual": loan.current_balance || 0,
      "Tasa %": `${loan.interest_rate || 0}%`,
      "Total Interés": loan.total_interest || 0,
      "Total Multas": loan.total_late_fees || 0,
      "Total Pagado": loan.total_paid || 0,
      "Cuotas": loan.installments || 0,
      "Frecuencia": loan.payment_frequency || "-",
      "Inicio": new Date(loan.start_date).toLocaleDateString("es-ES"),
      "Vencimiento": loan.due_date ? new Date(loan.due_date).toLocaleDateString("es-ES") : "-",
      "Estado": loan.status || "-",
    }));

    const workbook = XLSX.utils.book_new();
    
    // Crear hoja con título
    const wsData = [
      ["REPORTE DE PRÉSTAMOS"],
      [`Generado: ${new Date().toLocaleDateString("es-ES")}`],
      [`Total de préstamos: ${loans.length}`],
      [""],
      ...XLSX.utils.json_to_sheet(data, { header: 1 }).slice(),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Aplicar estilos
    worksheet["A1"].s = createTitleStyle();
    worksheet["A2"].s = createSubtitleStyle();
    worksheet["A3"].s = createSubtitleStyle();

    // Aplicar estilos a headers (row 5)
    const headerStyle = createHeaderStyle();
    for (let col = 0; col < Object.keys(data[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + "5";
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Préstamos");
    const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const fileName = `Prestamos_${new Date().toISOString().split("T")[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: "base64",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar Préstamos",
      });
    }

    return fileUri;
  } catch (error) {
    console.error("Error exportando préstamos:", error);
    throw error;
  }
}

/**
 * Exporta pagos a Excel
 */
export async function exportPaymentsToExcel(userId) {
  try {
    const db = await getDb();

    // Obtener pagos del usuario
    const payments = await db.getAllAsync(`
      SELECT 
        p.*,
        l.contract_number,
        c.first_name,
        c.last_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ?
      ORDER BY p.payment_date DESC
    `, [userId]);

    const data = payments.map((payment) => ({
      "Contrato": payment.contract_number || "-",
      "Cliente": `${payment.first_name} ${payment.last_name}`,
      "Monto Pagado": payment.amount || 0,
      "Interés Pagado": payment.interest_paid || 0,
      "Multa Pagada": payment.late_fee_paid || 0,
      "Método": payment.payment_method || "-",
      "Referencia": payment.reference || "-",
      "Fecha": new Date(payment.payment_date).toLocaleDateString("es-ES"),
      "Estado": payment.status || "-",
    }));

    const workbook = XLSX.utils.book_new();
    
    // Crear hoja con título
    const wsData = [
      ["REPORTE DE PAGOS Y ABONOS"],
      [`Generado: ${new Date().toLocaleDateString("es-ES")}`],
      [`Total de transacciones: ${payments.length}`],
      [""],
      ...XLSX.utils.json_to_sheet(data, { header: 1 }).slice(),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Aplicar estilos
    worksheet["A1"].s = createTitleStyle();
    worksheet["A2"].s = createSubtitleStyle();
    worksheet["A3"].s = createSubtitleStyle();

    // Aplicar estilos a headers (row 5)
    const headerStyle = createHeaderStyle();
    for (let col = 0; col < Object.keys(data[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + "5";
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
    const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const fileName = `Pagos_${new Date().toISOString().split("T")[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: "base64",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar Pagos",
      });
    }

    return fileUri;
  } catch (error) {
    console.error("Error exportando pagos:", error);
    throw error;
  }
}

/**
 * Exporta todo (clientes, préstamos y pagos) en un único Excel
 */
export async function exportAllDataToExcel(userId) {
  try {
    const db = await getDb();

    // Obtener clientes
    const clients = await getClients(userId);

    // Obtener préstamos
    const loans = await db.getAllAsync(`
      SELECT 
        l.*,
        c.first_name,
        c.last_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `, [userId]);

    // Obtener pagos
    const payments = await db.getAllAsync(`
      SELECT 
        p.*,
        l.contract_number,
        c.first_name,
        c.last_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ?
      ORDER BY p.payment_date DESC
    `, [userId]);

    // Preparar datos de clientes
    const clientsData = clients.map((client) => ({
      "Nombre": `${client.first_name} ${client.last_name}`,
      "Documento": client.document_number,
      "Teléfono": client.phone_primary,
      "Email": client.email || "-",
      "Ciudad": client.city || "-",
      "Deuda Total": client.totalDebt || 0,
      "Pagado": client.totalPaid || 0,
      "Pendiente": client.pendingDebt || 0,
      "Estado": client.status,
    }));

    // Preparar datos de préstamos
    const loansData = loans.map((loan) => ({
      "Contrato": loan.contract_number || "-",
      "Cliente": `${loan.first_name} ${loan.last_name}`,
      "Principal": loan.principal_amount || 0,
      "Saldo": loan.current_balance || 0,
      "Tasa": `${loan.interest_rate || 0}%`,
      "Interés": loan.total_interest || 0,
      "Multas": loan.total_late_fees || 0,
      "Pagado": loan.total_paid || 0,
      "Estado": loan.status || "-",
    }));

    // Preparar datos de pagos
    const paymentsData = payments.map((payment) => ({
      "Contrato": payment.contract_number || "-",
      "Cliente": `${payment.first_name} ${payment.last_name}`,
      "Monto": payment.amount || 0,
      "Interés": payment.interest_paid || 0,
      "Multa": payment.late_fee_paid || 0,
      "Fecha": new Date(payment.payment_date).toLocaleDateString("es-ES"),
      "Método": payment.payment_method || "-",
    }));

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const headerStyle = createHeaderStyle();

    // ==================== HOJA 1: CLIENTES ====================
    const ws1Data = [
      ["RESUMEN GENERAL - REPORTE COMPLETO"],
      [`Generado: ${new Date().toLocaleDateString("es-ES")}`],
      [""],
      ["👥 CLIENTES"],
      [`Total de clientes: ${clients.length}`],
      [""],
      ...XLSX.utils.json_to_sheet(clientsData, { header: 1 }).slice(),
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1["A1"].s = createTitleStyle();
    ws1["A2"].s = createSubtitleStyle();
    ws1["A4"].s = { ...createSubtitleStyle(), font: { size: 12, bold: true, color: { rgb: "13678A" } } };
    ws1["A5"].s = createSubtitleStyle();

    // Headers para clientes (row 7)
    const clientHeaderRow = 7;
    for (let col = 0; col < Object.keys(clientsData[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + clientHeaderRow;
      if (ws1[cellRef]) {
        ws1[cellRef].s = headerStyle;
      }
    }

    ws1["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    // ==================== HOJA 2: PRÉSTAMOS ====================
    const ws2Data = [
      ["💰 PRÉSTAMOS"],
      [`Total de préstamos: ${loans.length}`],
      [""],
      ...XLSX.utils.json_to_sheet(loansData, { header: 1 }).slice(),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2["A1"].s = { ...createSubtitleStyle(), font: { size: 12, bold: true, color: { rgb: "13678A" } } };
    ws2["A2"].s = createSubtitleStyle();

    // Headers para préstamos (row 4)
    const loanHeaderRow = 4;
    for (let col = 0; col < Object.keys(loansData[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + loanHeaderRow;
      if (ws2[cellRef]) {
        ws2[cellRef].s = headerStyle;
      }
    }

    ws2["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    ];

    // ==================== HOJA 3: PAGOS ====================
    const ws3Data = [
      ["🏦 PAGOS Y ABONOS"],
      [`Total de transacciones: ${payments.length}`],
      [""],
      ...XLSX.utils.json_to_sheet(paymentsData, { header: 1 }).slice(),
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3["A1"].s = { ...createSubtitleStyle(), font: { size: 12, bold: true, color: { rgb: "13678A" } } };
    ws3["A2"].s = createSubtitleStyle();

    // Headers para pagos (row 4)
    const paymentHeaderRow = 4;
    for (let col = 0; col < Object.keys(paymentsData[0]).length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + paymentHeaderRow;
      if (ws3[cellRef]) {
        ws3[cellRef].s = headerStyle;
      }
    }

    ws3["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, ws1, "Resumen");
    XLSX.utils.book_append_sheet(workbook, ws2, "Préstamos");
    XLSX.utils.book_append_sheet(workbook, ws3, "Pagos");

    // Escribir archivo
    const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const fileName = `Datos_Completos_${new Date().toISOString().split("T")[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: "base64",
    });

    // Compartir
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar Datos Completos",
      });
    }

    return fileUri;
  } catch (error) {
    console.error("Error exportando datos completos:", error);
    throw error;
  }
}
