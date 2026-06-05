const PDFDocument = require('pdfkit');

function generateReportCard(data, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-card-${data.admissionNumber}.pdf`);
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;

  doc.fontSize(20).font('Helvetica-Bold').text('IKONEX ACADEMY', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Student Report Card', { align: 'center' });
  doc.moveDown(0.5);

  doc.moveTo(40, doc.y).lineTo(pageWidth + 40, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(`Student: ${data.studentName}`, { continued: true });
  doc.font('Helvetica').text(`    Adm No: ${data.admissionNumber}`, { align: 'right' });

  doc.font('Helvetica-Bold').text(`Class: ${data.className}`, { continued: true });
  doc.font('Helvetica').text(`    Term: ${data.term.toUpperCase()} ${data.academicYear}`, { align: 'right' });

  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(pageWidth + 40, doc.y).stroke();
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = [120, 70, 90, 70, 70, 70];
  const headers = ['Subject', 'Exam', 'Continuous Assessment', 'Total', 'Grade', 'Pos'];

  doc.fontSize(10).font('Helvetica-Bold');
  let x = 40;
  headers.forEach((h, i) => {
    doc.text(h, x, tableTop, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  });

  doc.moveTo(40, tableTop + 15).lineTo(pageWidth + 40, tableTop + 15).stroke();

  let y = tableTop + 20;
  doc.fontSize(10).font('Helvetica');
  data.subjects.forEach((subj) => {
    x = 40;
    const row = [subj.name, subj.examScore.toString(), subj.caScore.toString(), subj.total.toString(), subj.grade, subj.position.toString()];
    row.forEach((val, i) => {
      doc.text(val, x, y, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });
    y += 18;
  });

  doc.moveTo(40, y).lineTo(pageWidth + 40, y).stroke();
  y += 10;

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(`Total Marks: ${data.totals.totalMarks}`, 40, y, { continued: true });
  doc.text(`    Average: ${data.totals.average.toFixed(1)}%`, { align: 'center' });
  doc.text(`    Position: ${data.totals.classPosition}/${data.totals.totalStudents}`, { align: 'right' });

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
