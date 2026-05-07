import type { StudySession } from './types';

function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '');
}

export async function exportStudySheet(session: StudySession): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const CW = PW - M * 2;

  let y = M;

  const newPage = () => { doc.addPage(); y = M; };
  const checkPage = (h: number) => { if (y + h > PH - 65) newPage(); };

  const fc = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
  const dc = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);
  const tc = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);

  const sectionHeader = (title: string) => {
    checkPage(52);
    fc(79, 70, 229);
    doc.roundedRect(M, y, CW, 33, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    tc(255, 255, 255);
    doc.text(title, M + 14, y + 22);
    y += 46;
  };

  // ── COVER PAGE ──────────────────────────────────────────────────────────

  // Indigo top accent bar
  fc(79, 70, 229);
  doc.rect(0, 0, PW, 6, 'F');

  // Subtle background tint
  fc(248, 250, 252);
  doc.rect(0, 6, PW, 200, 'F');

  y = 68;

  // Logo square
  fc(79, 70, 229);
  doc.roundedRect(M, y, 46, 46, 9, 9, 'F');
  fc(99, 102, 241);
  doc.roundedRect(M + 24, y, 22, 22, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  tc(255, 255, 255);
  doc.text('R', M + 11, y + 33);
  doc.setFontSize(11);
  doc.text('IQ', M + 27, y + 16);

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  tc(15, 23, 42);
  doc.text('ReviseIQ', M + 60, y + 25);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  tc(100, 116, 139);
  doc.text('Transform textbooks into intelligent study systems.', M + 60, y + 42);

  y += 72;

  // Divider
  dc(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(M, y, PW - M, y);

  y += 30;

  // Doc title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  tc(15, 23, 42);
  doc.text('Personalised Study Guide', M, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  tc(100, 116, 139);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(`Generated on ${sanitize(dateStr)}`, M, y);

  y += 30;

  // Stats cards (4 across)
  const wordCount = session.inputText.trim().split(/\s+/).filter(Boolean).length;
  const stats = [
    { label: 'DIFFICULTY', value: sanitize(session.difficulty) },
    { label: 'READING TIME', value: `${session.readingTimeMin} min` },
    { label: 'REVISION TIME', value: `${session.revisionTimeMin} min` },
    { label: 'WORD COUNT', value: `${wordCount.toLocaleString()}` },
  ];
  const cw4 = (CW - 12) / 4;
  stats.forEach(({ label, value }, i) => {
    const cx = M + i * (cw4 + 4);
    fc(255, 255, 255);
    doc.roundedRect(cx, y, cw4, 64, 5, 5, 'F');
    dc(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(cx, y, cw4, 64, 5, 5, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    tc(148, 163, 184);
    doc.text(label, cx + 10, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    tc(15, 23, 42);
    doc.text(value, cx + 10, y + 42);
  });

  y += 82;

  // "What's inside" banner
  fc(238, 242, 255);
  doc.roundedRect(M, y, CW, 52, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  tc(79, 70, 229);
  doc.text("WHAT'S INSIDE THIS GUIDE", M + 16, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  tc(99, 102, 241);
  const contents = [
    `${session.notes.length} Summary Notes`,
    `${session.keywords.length} Key Concepts`,
    `${session.flashcards.length} Flashcards`,
    `${session.quizQuestions.length} Quiz Questions`,
  ].join('     |     ');
  doc.text(contents, M + 16, y + 36);

  // ── SUMMARY NOTES ──────────────────────────────────────────────────────

  newPage();
  sectionHeader('SUMMARY NOTES');

  session.notes.forEach((note, i) => {
    const noteClean = sanitize(note);
    const wrapped = doc.splitTextToSize(noteClean, CW - 46);
    checkPage(wrapped.length * 15 + 34);

    // Number badge
    fc(238, 242, 255);
    doc.roundedRect(M, y, 26, 26, 13, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    tc(79, 70, 229);
    doc.text(`${i + 1}`, M + (i + 1 < 10 ? 9 : 6), y + 17);

    // Note text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    tc(30, 41, 59);
    doc.text(wrapped, M + 36, y + 16);

    y += Math.max(wrapped.length * 15 + 6, 30) + 14;
  });

  y += 12;

  // ── KEY CONCEPTS ───────────────────────────────────────────────────────

  checkPage(88);
  sectionHeader('KEY CONCEPTS');

  let kx = M;
  const kwRowStart = y;
  session.keywords.forEach((kw) => {
    const kwc = sanitize(kw);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const kwW = doc.getTextWidth(kwc) + 24;
    if (kx + kwW > PW - M + 4) {
      kx = M;
      y += 30;
    }
    fc(238, 242, 255);
    doc.roundedRect(kx, y, kwW, 22, 11, 11, 'F');
    tc(79, 70, 229);
    doc.text(kwc, kx + 12, y + 15);
    kx += kwW + 8;
  });
  y = Math.max(y, kwRowStart) + 40;

  // ── FLASHCARDS ─────────────────────────────────────────────────────────

  checkPage(80);
  sectionHeader('FLASHCARDS');

  session.flashcards.forEach((card, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const frontLines = doc.splitTextToSize(sanitize(card.front), CW - 32);
    const backLines = doc.splitTextToSize(sanitize(card.back), CW - 32);
    const cardH = frontLines.length * 14 + backLines.length * 14 + 62;
    checkPage(cardH + 14);

    // Card background
    fc(250, 251, 252);
    doc.roundedRect(M, y, CW, cardH, 6, 6, 'F');
    dc(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, cardH, 6, 6, 'S');

    // Card header bar
    fc(238, 242, 255);
    doc.roundedRect(M, y, CW, 18, 6, 6, 'F');
    doc.rect(M, y + 12, CW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    tc(148, 163, 184);
    doc.text(`CARD  ${i + 1}`, M + 14, y + 13);

    // Question
    const qY = y + 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    tc(99, 102, 241);
    doc.text('QUESTION', M + 14, qY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    tc(30, 41, 59);
    doc.text(frontLines, M + 14, qY + 14);

    // Mid-divider
    const divY = qY + frontLines.length * 14 + 16;
    dc(226, 232, 240);
    doc.line(M + 14, divY, PW - M - 14, divY);

    // Answer
    const aY = divY + 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    tc(22, 163, 74);
    doc.text('ANSWER', M + 14, aY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    tc(30, 41, 59);
    doc.text(backLines, M + 14, aY + 14);

    y += cardH + 14;
  });

  y += 8;

  // ── QUIZ QUESTIONS & ANSWERS ───────────────────────────────────────────

  checkPage(80);
  sectionHeader('QUIZ QUESTIONS & ANSWERS');

  session.quizQuestions.forEach((q, qi) => {
    const qClean = `${qi + 1}.  ${sanitize(q.question)}`;
    const qLines = doc.splitTextToSize(qClean, CW - 8);
    const totalH = qLines.length * 14 + q.options.length * 22 + 24;
    checkPage(totalH + 20);

    // Question text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    tc(15, 23, 42);
    doc.text(qLines, M, y);
    y += qLines.length * 14 + 10;

    // Options
    q.options.forEach((opt, j) => {
      const isCorrect = opt === q.answer;
      const letter = String.fromCharCode(65 + j);
      const optLines = doc.splitTextToSize(`${letter}.   ${sanitize(opt)}`, CW - 22);
      const optH = optLines.length * 13 + 12;

      if (isCorrect) {
        fc(220, 252, 231);
        doc.roundedRect(M, y - 2, CW, optH, 3, 3, 'F');
        dc(134, 239, 172);
        doc.roundedRect(M, y - 2, CW, optH, 3, 3, 'S');
      }

      doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
      doc.setFontSize(9.5);
      tc(isCorrect ? 22 : 100, isCorrect ? 163 : 116, isCorrect ? 74 : 139);
      doc.text(optLines, M + 12, y + 9);
      y += optH + 4;
    });

    y += 20;
  });

  // ── PAGE FOOTERS ───────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    fc(15, 23, 42);
    doc.rect(0, PH - 30, PW, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    tc(148, 163, 184);
    doc.text('ReviseIQ  |  Transform textbooks into intelligent study systems.', M, PH - 11);
    doc.text(`Page ${pg} / ${totalPages}`, PW - M - 36, PH - 11);
  }

  doc.save('reviseiq-study-guide.pdf');
}
