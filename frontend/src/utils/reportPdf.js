import { formatDate, formatRupiah } from './format';
import { UNIT_LABEL } from './constants';

const BRAND = [165, 101, 31];

// jsPDF is large, so it is only loaded when the admin actually exports a report
export const exportReportPdf = async ({ summary, sales, topProducts, lowStock, groupBy }) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const tableStyle = { theme: 'striped', headStyles: { fillColor: BRAND }, styles: { fontSize: 9 }, margin: { left: margin, right: margin } };
  const section = (title) => {
    const y = (doc.lastAutoTable?.finalY ?? 150) + 28;
    doc.setFontSize(12).setTextColor(30).text(title, margin, y);
    return y + 8;
  };

  doc.setFillColor(...BRAND).rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255).setFontSize(18).text('ELEFEZ FARM - Sales Report', margin, 38);
  doc.setFontSize(10).text(`Period: ${formatDate(summary.range.start)} - ${formatDate(summary.range.end)}`, margin, 56);

  autoTable(doc, {
    ...tableStyle,
    startY: 90,
    head: [['Revenue (paid)', 'Paid sales', 'Items sold', 'Average sale']],
    body: [[formatRupiah(summary.totalRevenue), summary.salesCount, summary.itemsSold, formatRupiah(summary.averageSale)]],
  });

  autoTable(doc, {
    ...tableStyle,
    startY: section(`Revenue per ${groupBy === 'month' ? 'month' : 'day'}`),
    head: [['Period', 'Transactions', 'Revenue']],
    body: [...(sales.items || []).map((row) => [row.period, row.transactions, formatRupiah(row.revenue)]), ['Total', '', formatRupiah(sales.total)]],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  autoTable(doc, {
    ...tableStyle,
    startY: section('Best selling products'),
    head: [['Product', 'Quantity sold', 'Revenue']],
    body: (topProducts.items || []).map((row) => [row.productName, row.quantitySold, formatRupiah(row.revenue)]),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  });

  autoTable(doc, {
    ...tableStyle,
    startY: section('Low stock'),
    head: [['Product', 'SKU', 'Stock', 'Minimum']],
    body: (lowStock.items || []).map((p) => [p.name, p.sku, `${p.stock} ${UNIT_LABEL[p.unit] || ''}`, p.minStock]),
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8).setTextColor(120).text(`ELEFEZ FARM - ${new Date().toLocaleString('en-GB')} - Page ${page} of ${pages}`, margin, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`sales-report-${summary.range.start}-to-${summary.range.end}.pdf`);
};
