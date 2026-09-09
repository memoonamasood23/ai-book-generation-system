# Automated Book Generation System

A Node.js-based system that automatically generates books using AI (OpenAI/Anthropic), with human-in-the-loop approval gates at each stage.

## 📋 System Overview

### Three Main Stages:

1. **Outline Generation** - AI creates book outline based on title + editor notes
2. **Chapter Generation** - AI writes individual chapters with context from previous chapters
3. **Final Compilation** - Chapters are compiled into DOCX and TXT formats

### Key Features:

✅ **Modular Architecture** - Each stage is independent and testable  
✅ **Human-in-the-Loop** - Editor approval gates at each stage  
✅ **Context Chaining** - Each chapter uses previous chapter summaries  
✅ **Multi-format Export** - DOCX, TXT output  
✅ **Notifications** - Email & MS Teams webhooks  
✅ **Database Tracking** - Supabase integration (or local demo mode)  

---

## 🚀 Quick Start (3-Hour Setup)

### Step 1: Prerequisites
- Node.js 18+ installed
- npm/yarn package manager
- (Optional) Supabase account + API keys
- (Optional) OpenAI API key

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key
```

**Note:** If you don't have these keys, the system will run in DEMO MODE with mock data.

### Step 4: Run the System
```bash
npm run dev
```

This will:
1. Create a sample book request
2. Generate an outline
3. Generate chapters (with context chaining)
4. Compile into DOCX file
5. Output results to `./output/` directory

---

## 📁 Project Structure

```
src/
├── index.ts                 # Main entry point
├── types/
│   └── index.ts            # TypeScript interfaces
├── services/
│   ├── database.ts         # Supabase operations
│   ├── llm.ts              # OpenAI/Anthropic integration
│   ├── notifications.ts    # Email & Teams webhooks
│   └── export.ts           # DOCX/TXT generation
└── workflows/
    ├── stage1-outline.ts   # Outline generation workflow
    ├── stage2-chapters.ts  # Chapter generation workflow
    └── stage3-compilation.ts # Compilation workflow
```

---

## 🗄️ Database Schema (Supabase)

### Tables:
- **books** - Main book records
- **outlines** - Generated outlines with approval status
- **chapters** - Individual chapters with summaries
- **approvals** - Gating/workflow statuses
- **final_books** - Compiled output files

### Approval Status Values:
- `yes` - Waiting for editor notes
- `no` - Paused/Rejected
- `no_notes_needed` - Proceed automatically

---

## 📝 Workflow Example

```
Input: Book Title + Editor Notes
         ↓
    [STAGE 1: OUTLINE]
    Generate outline with OpenAI
    ✅ Editor reviews and approves
         ↓
    [STAGE 2: CHAPTERS]
    For each chapter:
      - Use previous chapter summaries as context
      - Generate chapter with OpenAI
      - ✅ Editor reviews and approves
         ↓
    [STAGE 3: COMPILATION]
    Merge all chapters → Export as DOCX/TXT
         ↓
    Output: Final Book File
```

---

## 🔑 Key Technologies

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| LLM | OpenAI/Anthropic SDK |
| Database | Supabase (PostgreSQL) |
| Document Export | docx, pdfkit |
| Notifications | nodemailer, axios |
| APIs | OpenAI, Supabase, Google Sheets, MS Teams |

---

## 📤 Output Files

After running, files are saved to:
```
output/
├── the_future_of_artificial_intelligence_1715425600000.docx
└── the_future_of_artificial_intelligence_1715425600000.txt
```

Each file contains:
- Title page
- Table of contents
- Full outline
- All generated chapters
- Professional formatting

---

## 🧪 Demo Mode

If Supabase credentials are not set, the system runs in **DEMO MODE**:
- ✅ All features work
- 📁 Data stored locally
- 🤖 AI uses mock responses (no API calls)
- Perfect for testing without external dependencies

---

## 📧 Notifications Setup

### Email (Optional)
Set in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EDITOR_EMAIL=reviewer@example.com
```

### MS Teams (Optional)
1. Create incoming webhook in Teams channel
2. Add to `.env`:
```
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
```

---

## 🎯 Next Steps (Full Implementation)

For production, add:
1. **Google Sheets Integration** - Read input from sheet, update status
2. **Persistent Task Queue** - Use Bull + Redis for reliability
3. **Web UI** - Dashboard for editors to review/approve
4. **Advanced Caching** - Cache chapter summaries, prompts
5. **Error Recovery** - Retry logic, checkpoints
6. **Analytics** - Track tokens, costs, generation times

---

## 💬 Support

For issues or questions:
1. Check logs in console output
2. Verify `.env` configuration
3. Test with DEMO MODE first (no API keys needed)
4. Check Supabase dashboard for DB records

---

## 📄 License

MIT

---

**Created:** May 12, 2026  
**Version:** 1.0.0 MVP
