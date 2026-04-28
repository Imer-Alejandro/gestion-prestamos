import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface BusinessInfo {
  name: string;
  rnc?: string;
  phone?: string;
  address?: string;
  email?: string;
}

const DEFAULT_BUSINESS: BusinessInfo = {
  name: "MI NEGOCIO SRL",
  phone: "809-000-0000",
  address: "Santo Domingo, República Dominicana",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

const translateFrequency = (freq: string) => {
  const map: Record<string, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
  };
  return map[freq.toLowerCase()] || freq;
};

const getCommonStyles = () => `
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    background: #f5f5f5;
    padding: 20px;
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: auto;
    background: #fff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid #333;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  .business-title {
    font-size: 24px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .business-info {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }
  .receipt-meta {
    text-align: right;
    font-size: 13px;
  }
  .receipt-id {
    font-size: 18px;
    font-weight: bold;
    color: #d32f2f;
    margin: 4px 0;
  }
  .section {
    margin-top: 25px;
  }
  .section h3 {
    font-size: 15px;
    margin-bottom: 8px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 6px 0;
    font-size: 14px;
  }
  .label {
    color: #777;
    font-weight: 500;
  }
  .value {
    font-weight: 600;
    color: #1a1a1a;
  }
  .total-section {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 2px dashed #eee;
    text-align: right;
  }
  .total-label {
    font-size: 14px;
    color: #666;
    font-weight: bold;
  }
  .total-amount {
    font-size: 22px;
    font-weight: 900;
    color: #1a1a1a;
    display: block;
  }
  .comments-box {
    margin-top: 20px;
    padding: 12px;
    background: #f9f9f9;
    border-left: 4px solid #ddd;
    font-size: 13px;
    font-style: italic;
    color: #555;
  }
  .footer {
    margin-top: 40px;
    text-align: center;
    font-size: 12px;
    color: #999;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }
  .signatures {
    margin-top: 50px;
    display: flex;
    justify-content: space-between;
  }
  .sig-box {
    width: 45%;
    text-align: center;
  }
  .sig-line {
    border-top: 1px solid #333;
    margin-top: 40px;
    padding-top: 5px;
    font-size: 11px;
    font-weight: bold;
  }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    opacity: 0.03;
    font-size: 80px;
    font-weight: 900;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }
  @media print {
    body { background: none; padding: 0; }
    .container { box-shadow: none; border: 1px solid #eee; }
  }
`;

export const generateLoanReceipt = async (loan: any, client: any, business = DEFAULT_BUSINESS) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>${getCommonStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">KANNI CASH</div>
        
        <div class="header">
          <div>
            <div class="business-title">${business.name}</div>
            <div class="business-info">
              ${business.address}<br>
              Tel: ${business.phone}
            </div>
          </div>
          <div class="receipt-meta">
            <strong>COMPROBANTE</strong>
            <div class="receipt-id">#${loan.contract_number || 'S/N'}</div>
            <div>Fecha: ${formatDate(loan.created_at || new Date().toISOString())}</div>
          </div>
        </div>

        <div class="section">
          <h3>Información del Cliente</h3>
          <div class="row"><span class="label">Nombre:</span><span class="value">${client.first_name} ${client.last_name}</span></div>
          <div class="row"><span class="label">Cédula/RNC:</span><span class="value">${client.document_number}</span></div>
          <div class="row"><span class="label">Teléfono:</span><span class="value">${client.phone_primary}</span></div>
        </div>

        <div class="section">
          <h3>Detalle del Préstamo</h3>
          <div class="row"><span class="label">Monto Capital:</span><span class="value">${formatCurrency(loan.principal_amount)}</span></div>
          <div class="row"><span class="label">Tasa de Interés:</span><span class="value">${loan.interest_rate}% (${translateFrequency(loan.payment_frequency)})</span></div>
          <div class="row"><span class="label">Plazo:</span><span class="value">${loan.installments} pagos</span></div>
        </div>

        ${loan.comments ? `
          <div class="section">
            <h3>Notas / Comentarios</h3>
            <div class="comments-box">${loan.comments.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}

        <div class="total-section">
          <span class="total-label">TOTAL A PAGAR</span>
          <span class="total-amount">${formatCurrency(loan.current_balance)}</span>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line">POR LA INSTITUCIÓN</div>
          </div>
          <div class="sig-box">
            ${client.signature_svg ? `
              <div style="height: 50px; margin-bottom: -35px;">
                ${client.signature_svg.startsWith('data:')
        ? `<img src="${client.signature_svg}" style="max-height: 50px; max-width: 100%;" />`
        : `<div style="height: 50px; transform: scale(0.5); transform-origin: bottom;">${client.signature_svg}</div>`
      }
              </div>
            ` : ''}
            <div class="sig-line">FIRMA DEL CLIENTE</div>
          </div>
        </div>

        <div class="footer">
          Este documento sirve como comprobante legal del préstamo otorgado.<br>
          Gracias por confiar en nosotros.
        </div>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const generatePaymentReceipt = async (payment: any, loan: any, client: any, business = DEFAULT_BUSINESS) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>${getCommonStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">KANNI CASH</div>
        
        <div class="header">
          <div>
            <div class="business-title">${business.name}</div>
            <div class="business-info">
              ${business.address}<br>
              Tel: ${business.phone}
            </div>
          </div>
          <div class="receipt-meta">
            <strong>RECIBO DE PAGO</strong>
            <div class="receipt-id">#${payment.id || 'N/A'}</div>
            <div>Fecha: ${formatDate(payment.payment_date || new Date().toISOString())}</div>
          </div>
        </div>

        <div class="section">
          <h3>Cliente</h3>
          <div class="row"><span class="label">Nombre:</span><span class="value">${client.first_name} ${client.last_name}</span></div>
          <div class="row"><span class="label">Contrato:</span><span class="value">#${loan.contract_number || 'S/N'}</span></div>
        </div>

        <div class="section">
          <h3>Detalle de la Transacción</h3>
          <div class="row"><span class="label">Monto del Préstamo:</span><span class="value">${formatCurrency(loan.principal_amount)}</span></div>
          <div class="row"><span class="label">Saldo Anterior:</span><span class="value">${formatCurrency(loan.current_balance + payment.amount)}</span></div>
          <div class="row"><span class="label">Método de Pago:</span><span class="value" style="text-transform: capitalize;">${payment.payment_method}</span></div>
          ${payment.reference_number ? `<div class="row"><span class="label">Referencia:</span><span class="value">${payment.reference_number}</span></div>` : ''}
        </div>

        <div class="total-section">
          <span class="total-label">MONTO ABONADO</span>
          <span class="total-amount" style="color: #2e7d32;">${formatCurrency(payment.amount)}</span>
          <div style="margin-top: 10px; font-size: 14px;">
            <span class="label">NUEVO SALDO:</span>
            <span class="value">${formatCurrency(loan.current_balance)}</span>
          </div>
        </div>

        <div class="footer">
          Conserve este recibo como comprobante de su pago.<br>
          ¡Gracias por su puntualidad!
        </div>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const generateClientStatusReport = async (client: any, loans: any[], business = DEFAULT_BUSINESS) => {
  const totalBalance = loans.reduce((sum, loan) => sum + (loan.current_balance || 0), 0);
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonStyles()}
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          color: #777;
          border-bottom: 1px solid #eee;
          padding: 8px 4px;
        }
        td {
          padding: 10px 4px;
          font-size: 11px;
          border-bottom: 1px solid #f9f9f9;
        }
        .text-right { text-align: right; }
        .status-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-activo { background: #e8f5e9; color: #2e7d32; }
        .status-atrasado { background: #fff3e0; color: #ef6c00; }
        .status-mora { background: #ffebee; color: #c62828; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">KANNI CASH</div>
        
        <div class="header">
          <div>
            <div class="business-title">${business.name}</div>
            <div class="business-info">
              ${business.address}<br>
              Tel: ${business.phone}
            </div>
          </div>
          <div class="receipt-meta">
            <strong>ESTADO DE CUENTA</strong>
            <div class="receipt-id">CLIENTE</div>
            <div>Fecha: ${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <div class="section">
          <h3>Información del Cliente</h3>
          <div class="row"><span class="label">Nombre:</span><span class="value">${client.first_name} ${client.last_name}</span></div>
          <div class="row"><span class="label">Cédula/RNC:</span><span class="value">${client.document_number || 'N/A'}</span></div>
          <div class="row"><span class="label">Teléfono:</span><span class="value">${client.phone_primary || 'N/A'}</span></div>
        </div>

        <div class="section">
          <h3>Resumen de Préstamos Activos</h3>
          <table>
            <thead>
              <tr>
                <th># Contrato</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Int (%)</th>
                <th>Frecuencia</th>
                <th>Cuotas</th>
                <th class="text-right">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(loan => `
                <tr>
                  <td><strong>#${loan.contract_number || loan.id}</strong></td>
                  <td>${formatDate(loan.created_at)}</td>
                  <td>${formatCurrency(loan.principal_amount)}</td>
                  <td>${loan.interest_rate}%</td>
                  <td>${translateFrequency(loan.payment_frequency)}</td>
                  <td>${loan.installments}</td>
                  <td class="text-right"><strong>${formatCurrency(loan.current_balance)}</strong></td>
                </tr>
              `).join('')}
              ${loans.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #999;">No hay préstamos activos</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <span class="total-label">TOTAL GENERAL ADEUDADO</span>
          <span class="total-amount">${formatCurrency(totalBalance)}</span>
        </div>

        <div class="footer">
          Este documento es un resumen informativo del estado actual de sus compromisos.<br>
          Generado automáticamente por el sistema de gestión.
        </div>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};
