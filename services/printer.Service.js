import {
  BluetoothEscposPrinter,
} from "react-native-bluetooth-escpos-printer";
import { PlanManager } from "./quota.service.js";

// Ancho lógico para impresoras térmicas de 58mm (aprox. 32 caracteres por línea).
const PAPER_WIDTH = 32;

// Función utilitaria para asegurar que siempre trabajamos con string.
const toText = (value) => (value ?? "").toString().trim();

// Formateo monetario homogéneo para facturas/recibos en RD$.
const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `RD$ ${new Intl.NumberFormat("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
};

// Permite mostrar una fecha legible aunque venga en distintos formatos.
const formatDateTime = (value) => {
  if (!value) return new Date().toLocaleString("es-DO");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toText(value);
  return date.toLocaleString("es-DO");
};

// Rellena a la derecha y recorta si excede el ancho.
const padRight = (text, width) => {
  const parsed = toText(text);
  if (parsed.length >= width) return parsed.slice(0, width);
  return `${parsed}${" ".repeat(width - parsed.length)}`;
};

// Crea una línea con valor alineado a la derecha.
const lineKV = (label, value, width = PAPER_WIDTH) => {
  const left = toText(label);
  const right = toText(value);
  const spaces = Math.max(1, width - left.length - right.length);
  return `${left}${" ".repeat(spaces)}${right}`;
};

// Separa visualmente secciones en la factura.
const divider = (char = "-") => char.repeat(PAPER_WIDTH);

// Wrapper para imprimir texto línea por línea y mantener consistencia de saltos.
const printLine = async (text = "", options = {}) => {
  await BluetoothEscposPrinter.printText(`${toText(text)}\n\r`, options);
};

// Recolecta y normaliza datos de compañía para evitar condicionales repetidos.
const getCompanyData = (invoice, fallbackCompany = {}) => {
  const company = invoice?.company || fallbackCompany || {};

  return {
    name: toText(company.name || "FINANCIERA JOSE"),
    rnc: toText(company.rnc),
    phone: toText(company.phone),
    address: toText(company.address),
  };
};

// Imprime cabecera reutilizable para todas las facturas.
const printHeader = async (invoice, options = {}) => {
  const company = getCompanyData(invoice, options.company);

  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await printLine(company.name);

  if (company.rnc) await printLine(`RNC: ${company.rnc}`);
  if (company.phone) await printLine(`Tel: ${company.phone}`);
  if (company.address) await printLine(company.address);

  await printLine(divider("="));
  await printLine("FACTURA");
  await printLine(divider("="));
};

// Imprime datos principales del documento.
const printInvoiceMeta = async (invoice) => {
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

  await printLine(`No. Factura: ${toText(invoice?.number || invoice?.id || "N/A")}`);
  await printLine(`Fecha: ${formatDateTime(invoice?.date || invoice?.fecha)}`);
  await printLine(`Cliente: ${toText(invoice?.customerName || invoice?.cliente || "N/A")}`);

  const customerPhone = toText(invoice?.customerPhone || invoice?.telefono);
  if (customerPhone) await printLine(`Teléfono: ${customerPhone}`);

  const advisor = toText(invoice?.advisorName || invoice?.cobrador || invoice?.usuario);
  if (advisor) await printLine(`Atendido por: ${advisor}`);

  await printLine(divider());
};

// Imprime una tabla simplificada de conceptos o líneas de cobro.
const printInvoiceItems = async (invoice) => {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];

  // Si no vienen ítems, imprimimos un resumen mínimo del pago.
  if (!items.length) {
    await printLine(lineKV("Concepto", "Monto"));
    await printLine(divider());
    await printLine(
      lineKV(
        toText(invoice?.concept || "Pago de cuota"),
        formatMoney(invoice?.amount || invoice?.monto || 0)
      )
    );
    await printLine(divider());
    return;
  }

  await printLine("Detalle:");
  await printLine(lineKV("Cant x Precio", "Subtotal"));
  await printLine(divider());

  for (const item of items) {
    // Se parte la descripción y se limita para que no rompa el formato térmico.
    const description = toText(item?.description || item?.descripcion || "Item");
    await printLine(padRight(description, PAPER_WIDTH));

    const qty = Number(item?.qty ?? item?.cantidad ?? 1);
    const price = Number(item?.price ?? item?.precio ?? 0);
    const subtotal = Number(
      item?.subtotal ?? (Number.isFinite(qty) ? qty : 1) * (Number.isFinite(price) ? price : 0)
    );

    await printLine(
      lineKV(
        `${Number.isFinite(qty) ? qty : 1} x ${formatMoney(Number.isFinite(price) ? price : 0)}`,
        formatMoney(Number.isFinite(subtotal) ? subtotal : 0)
      )
    );
  }

  await printLine(divider());
};

// Imprime totales y estado de saldo para reflejar la factura de cobro.
const printTotals = async (invoice) => {
  const subtotal = Number(invoice?.subtotal ?? invoice?.amount ?? invoice?.monto ?? 0);
  const discount = Number(invoice?.discount ?? invoice?.descuento ?? 0);
  const tax = Number(invoice?.tax ?? invoice?.impuesto ?? 0);
  const total = Number(invoice?.total ?? subtotal - discount + tax);
  const paid = Number(invoice?.paidAmount ?? invoice?.pagado ?? total);
  const change = Number(invoice?.change ?? invoice?.cambio ?? 0);
  const previousBalance = Number(invoice?.previousBalance ?? invoice?.saldoAnterior ?? 0);
  const newBalance = Number(invoice?.newBalance ?? invoice?.saldo ?? 0);

  await printLine(lineKV("Subtotal:", formatMoney(subtotal)));

  if (discount > 0) {
    await printLine(lineKV("Descuento:", `- ${formatMoney(discount)}`));
  }

  if (tax > 0) {
    await printLine(lineKV("Impuesto:", formatMoney(tax)));
  }

  await printLine(lineKV("TOTAL:", formatMoney(total)));
  await printLine(divider());

  await printLine(lineKV("Pagado:", formatMoney(paid)));

  if (change > 0) {
    await printLine(lineKV("Cambio:", formatMoney(change)));
  }

  if (previousBalance > 0 || newBalance > 0) {
    await printLine(lineKV("Saldo anterior:", formatMoney(previousBalance)));
    await printLine(lineKV("Saldo actual:", formatMoney(newBalance)));
  }

  await printLine(divider());
};

// Pie de factura con mensaje configurable.
const printFooter = async (invoice, options = {}) => {
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

  const note = toText(invoice?.note || invoice?.nota || options.note);
  if (note) await printLine(note);

  await printLine(toText(options.thanksMessage || "Gracias por su pago"));
  await printLine("Conserve esta factura");
  await printLine("");
  await printLine("");
};

// Servicio principal para imprimir facturas de cobro.
// Recibe userId para el control de cuota (opcional: si no se pasa, no valida).
export const printInvoice = async (invoice, options = {}) => {
  const userId = options.userId || invoice?.userId || null;

  try {
    if (!invoice || typeof invoice !== "object") {
      throw new Error("Los datos de la factura son inválidos.");
    }

    // ── Validación de cuota ──────────────────────────────────
    if (userId) {
      const quotaCheck = await PlanManager.canExecute(userId, 'printInvoice');
      if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
    }
    // ─────────────────────────────────────────────────────────

    await printHeader(invoice, options);
    await printInvoiceMeta(invoice);
    await printInvoiceItems(invoice);
    await printTotals(invoice);
    await printFooter(invoice, options);

    // ── Registrar operación exitosa ──────────────────────────
    if (userId) await PlanManager.registerOperation(userId, 'printInvoice');
    // ─────────────────────────────────────────────────────────

    return { success: true };
  } catch (error) {
    console.log("Error al imprimir factura:", error);
    return { success: false, error };
  }
};

// Imprime estado de cuenta — suma como operación pero NO como comprobante.
export const printStatusReport = async (data, options = {}) => {
  const userId = options.userId || data?.userId || null;

  try {
    if (userId) {
      const quotaCheck = await PlanManager.canExecute(userId, 'printStatus');
      if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
    }

    // Aqui va la lógica de impresión del estado (puedes reusar printHeader, etc.)
    // Por ahora se delega a printInvoice para no duplicar código de impresora.
    const result = await printInvoice(data, { ...options, userId: null }); // no doble conteo

    if (result.success && userId) {
      await PlanManager.registerOperation(userId, 'printStatus');
    }

    return result;
  } catch (error) {
    console.log("Error al imprimir estado:", error);
    return { success: false, error };
  }
};

// Compatibilidad: mantiene el método existente para recibos y lo enruta al nuevo flujo.
export const printReceipt = async (receipt) => {
  const invoice = {
    id: receipt?.id,
    date: receipt?.fecha,
    customerName: receipt?.cliente,
    amount: receipt?.monto,
    total: receipt?.monto,
    newBalance: receipt?.saldo,
    concept: "Abono registrado",
  };

  return printInvoice(invoice);
};