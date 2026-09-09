import nodemailer from 'nodemailer';
import axios from 'axios';

export class NotificationService {
  private transporter: any;

  constructor() {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(subject: string, message: string): Promise<void> {
    if (!this.transporter) {
      console.log(`📧 [EMAIL] ${subject}\n${message}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.EDITOR_EMAIL,
        subject,
        html: `<p>${message}</p>`,
      });
      console.log(`✅ Email sent: ${subject}`);
    } catch (error) {
      console.error('❌ Email failed:', error);
    }
  }

  async sendTeamsNotification(message: string): Promise<void> {
    if (!process.env.TEAMS_WEBHOOK_URL) {
      console.log(`💬 [TEAMS] ${message}`);
      return;
    }

    try {
      await axios.post(process.env.TEAMS_WEBHOOK_URL, {
        text: message,
        sections: [
          {
            activityTitle: 'Book Generation System',
            facts: [{ name: 'Status', value: message }],
          },
        ],
      });
      console.log(`✅ Teams notified`);
    } catch (error) {
      console.error('❌ Teams notification failed:', error);
    }
  }

  async notifyOutlineReady(bookTitle: string): Promise<void> {
    const message = `📖 Outline for "${bookTitle}" is ready for review!`;
    await this.sendEmail('Outline Ready for Review', message);
    await this.sendTeamsNotification(message);
  }

  async notifyChapterReady(bookTitle: string, chapterNum: number): Promise<void> {
    const message = `📄 Chapter ${chapterNum} of "${bookTitle}" is ready for review!`;
    await this.sendEmail(`Chapter ${chapterNum} Ready`, message);
    await this.sendTeamsNotification(message);
  }

  async notifyBookComplete(bookTitle: string, filePath: string): Promise<void> {
    const message = `✅ Book "${bookTitle}" has been compiled! Download: ${filePath}`;
    await this.sendEmail('Book Compilation Complete', message);
    await this.sendTeamsNotification(message);
  }

  async notifyError(error: any): Promise<void> {
    const message = `❌ Error occurred: ${error.message}`;
    await this.sendEmail('Book Generation Error', message);
    await this.sendTeamsNotification(message);
  }
}

export const notificationService = new NotificationService();
