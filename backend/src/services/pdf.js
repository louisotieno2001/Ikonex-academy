// PDF generation — individual report cards and class performance reports via PDFKit
const PDFDocument = require('pdfkit');

const BRAND = '#6366F1';
const BRAND_LIGHT = '#EEF2FF';
const BRAND_DARK = '#4338CA';
const ACCENT = '#F59E0B';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const BORDER = '#E5E7EB';

function generateReportCard(data, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-card-${data.admissionNumber}.pdf`);
  doc.pipe(res);

  const pw = doc.page.width - 80;

  // ── Header band ──
  doc.rect(0, 0, doc.page.width, 110).fill(BRAND);

  // Logo icon box
  const logoX = 50, logoY = 25, logoSize = 60;
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 12).fill(BRAND_DARK);
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF')
    .text('IA', logoX, logoY + 14, { width: logoSize, align: 'center' });

  // School name
  doc.fontSize(26).font('Helvetica-Bold').fillColor('#FFFFFF')
    .text('IKONEX ACADEMY', logoX + logoSize + 18, 32);
  doc.fontSize(11).font('Helvetica').fillColor('#C7D2FE')
    .text('OFFICIAL REPORT CARD', logoX + logoSize + 18, 64);

  // Term / Year badge
  const badgeW = 130, badgeH = 28, badgeX = doc.page.width - 50 - badgeW;
  doc.roundedRect(badgeX, 32, badgeW, badgeH, 14).fill('#FFFFFF');
  doc.fontSize(10).font('Helvetica-Bold').fillColor(BRAND_DARK)
    .text(`${data.term.toUpperCase()} · ${data.academicYear}`, badgeX, 38, { width: badgeW, align: 'center' });

  // ── Student info strip ──
  const infoY = 130;
  doc.rect(40, infoY, pw, 50).fill(BRAND_LIGHT);

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937');
  doc.text(data.studentName, 55, infoY + 10);
  doc.fontSize(10).font('Helvetica').fillColor(GRAY);
  doc.text(`Adm No: ${data.admissionNumber}`, 55, infoY + 30);

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937');
  doc.text(data.className, 320, infoY + 10);
  doc.fontSize(10).font('Helvetica').fillColor(GRAY);
  doc.text(`${data.term.toUpperCase()} · ${data.academicYear}`, 320, infoY + 30);

  // ── Subjects table ──
  const tableY = infoY + 70;
  const colW = [125, 65, 65, 70, 65, 65];
  const headers = ['Subject', 'Exam (50)', 'CAT (50)', 'Total', 'Grade', 'Pos'];

  // header row
  doc.rect(40, tableY, pw, 22).fill(BRAND);
  let hx = 40;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
  headers.forEach((h, i) => {
    doc.text(h, hx, tableY + 6, { width: colW[i], align: 'center' });
    hx += colW[i];
  });

  // body rows
  let by = tableY + 22;
  doc.fontSize(9).font('Helvetica');
  data.subjects.forEach((subj, idx) => {
    if (idx % 2 === 0) doc.rect(40, by, pw, 20).fill(GRAY_LIGHT);

    const vals = [
      subj.name,
      subj.examScore.toString(),
      subj.caScore.toString(),
      subj.total.toFixed(1),
      subj.grade,
      `${subj.position}`,
    ];
    hx = 40;
    vals.forEach((v, i) => {
      const color = i === 3 ? BRAND : i === 4 ? (subj.grade === 'A' ? '#059669' : subj.grade === 'B' ? '#2563EB' : subj.grade === 'C' ? '#D97706' : '#DC2626') : '#1F2937';
      doc.fillColor(color).font(i === 3 ? 'Helvetica-Bold' : 'Helvetica').text(v, hx, by + 5, { width: colW[i], align: 'center' });
      hx += colW[i];
    });
    by += 20;
  });

  // bottom border
  doc.moveTo(40, by).lineTo(pw + 40, by).strokeColor(BORDER).stroke();
  by += 8;

  // ── Totals footer ──
  doc.rect(40, by, pw, 40).fill(BRAND_LIGHT);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(BRAND_DARK);
  doc.text(`Total: ${data.totals.totalMarks.toFixed(1)}`, 55, by + 12);
  doc.text(`Avg: ${data.totals.average.toFixed(1)}%`, 180, by + 12);
  doc.text(`Rank: ${data.totals.classPosition}/${data.totals.totalStudents}`, 310, by + 12);

  // ── Signature line ──
  const sigY = by + 70;
  doc.fontSize(8).font('Helvetica').fillColor(GRAY);
  doc.text('________________________________', 55, sigY, { align: 'center' });
  doc.text('Principal\'s Signature', 55, sigY + 12, { align: 'center' });

  doc.text('________________________________', pw - 95, sigY, { align: 'center' });
  doc.text('Date', pw - 95, sigY + 12, { align: 'center' });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Generated: ${dateStr}`, 40, doc.page.height - 40, { align: 'center', width: pw });

  doc.end();
}

function generateClassReport(className, term, academicYear, studentResults, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const pageWidth = doc.page.width - 80;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=class-report-${className}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text('IKONEX ACADEMY', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text(`Class Performance Report: ${className}`, { align: 'center' });
  doc.fontSize(11).text(`Term: ${term.toUpperCase()} ${academicYear}`, { align: 'center' });
  doc.moveDown(1);

  if (studentResults.length > 0 && studentResults[0].subjects) {
    const subjNames = studentResults[0].subjects.map((s) => s.name);
    const colWidths = [160, ...subjNames.map(() => 60), 70, 70];
    const headers = ['Student', ...subjNames, 'Total', 'Avg'];

    doc.fontSize(8).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(pageWidth + 40, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(8).font('Helvetica');
    studentResults.forEach((s) => {
      x = 40;
      const vals = [s.studentName, ...s.subjects.map((sub) => sub.total.toString()), s.totalMarks.toString(), s.average.toFixed(1)];
      vals.forEach((v, i) => {
        doc.text(v, x, doc.y, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });
      doc.moveDown(0.5);
    });
  }

  doc.end();
}

module.exports = { generateReportCard, generateClassReport };
