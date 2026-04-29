const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');
const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const extractMailerError = (error) => {
  if (!error) return 'Unknown MailerSend error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;

  const responseData = error.response?.data || error.body;
  if (responseData) return safeStringify(responseData);

  return safeStringify(error);
};

const sendExamReportEmail = async ({ toEmail, examTitle, examCode, score, riskScore, startedAt, endedAt }) => {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    return { skipped: true, reason: 'MailerSend env vars or recipient email missing' };
  }

  const fromName = process.env.MAILERSEND_FROM_NAME || 'ProctorAI';
  const sender = new Sender(fromEmail, fromName);
  const recipients = [new Recipient(toEmail, 'Student')];
  const subject = `Exam Report: ${examTitle || 'Your Exam'}`;

  const text = [
    'Your exam report is ready.',
    '',
    `Exam: ${examTitle || 'N/A'}`,
    `Code: ${examCode || 'N/A'}`,
    `Score: ${typeof score === 'number' ? score : 'N/A'}`,
    `Risk Score: ${typeof riskScore === 'number' ? riskScore : 'N/A'}`,
    `Started At: ${formatDate(startedAt)}`,
    `Submitted At: ${formatDate(endedAt)}`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin-bottom: 8px;">Your exam report is ready</h2>
      <p style="margin-top: 0; margin-bottom: 16px;">Here are your submission details:</p>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Exam</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${examTitle || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Code</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${examCode || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Score</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${typeof score === 'number' ? score : 'N/A'}</td></tr>
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Risk Score</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${typeof riskScore === 'number' ? riskScore : 'N/A'}</td></tr>
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Started At</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${formatDate(startedAt)}</td></tr>
        <tr><td style="padding: 6px 10px; border: 1px solid #ddd;"><strong>Submitted At</strong></td><td style="padding: 6px 10px; border: 1px solid #ddd;">${formatDate(endedAt)}</td></tr>
      </table>
    </div>
  `;

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(subject)
    .setText(text)
    .setHtml(html);

  const mailerSend = new MailerSend({ apiKey });
  try {
    await mailerSend.email.send(emailParams);
  } catch (error) {
    throw new Error(extractMailerError(error));
  }

  return { skipped: false };
};

module.exports = { sendExamReportEmail, extractMailerError };
