const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const CYAN = "00C2D4";
const GREEN = "22C55E";
const YELLOW = "F59E0B";
const RED = "EF4444";
const DARK = "1E1E2E";
const LIGHT_BG = "F0F4FF";
const MID_BG = "E8F4FD";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: "1a1a2e", font: "Arial" })]
  });
}

function h2(text, color = "1E3A5F") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: CYAN, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 26, color, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: "2D3748", font: "Arial" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", ...opts })]
  });
}

function bullet(text, color = "374151") {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 19, color, font: "Arial" })]
  });
}

function statusBadge(label, color) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: "  " + label + "  ", size: 18, bold: true, color: "FFFFFF", highlight: color === GREEN ? "green" : color === RED ? "red" : "yellow", font: "Arial" })
    ]
  });
}

function promptBox(title, promptText) {
  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [9200],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders,
          width: { size: 9200, type: WidthType.DXA },
          shading: { fill: "1a1a2e", type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "🛠 WINDSURF PROMPT — " + title, bold: true, size: 18, color: "00C2D4", font: "Courier New" })] }),
          ]
        })]
      }),
      new TableRow({
        children: [new TableCell({
          borders,
          width: { size: 9200, type: WidthType.DXA },
          shading: { fill: "F8FAFF", type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: promptText, size: 18, font: "Courier New", color: "1a1a2e" })] })
          ]
        })]
      })
    ]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function issueRow(id, area, severity, desc, color) {
  const sevColor = severity === "CRITICAL" ? RED : severity === "HIGH" ? "E07000" : severity === "MEDIUM" ? "B45309" : GREEN;
  return new TableRow({
    children: [
      new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: id, size: 18, bold: true, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: area, size: 18, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 1000, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: severity, size: 17, bold: true, color: sevColor, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 5800, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: desc, size: 18, font: "Arial" })] })] }),
    ]
  });
}

function sectionDivider(label) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
    children: [new TextRun({ text: "  " + label, bold: true, size: 22, color: "FFFFFF", font: "Arial" })]
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1a1a2e" }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children: [

      // ── COVER ──────────────────────────────────────────────────────────────
      new Paragraph({ spacing: { before: 600, after: 40 }, children: [new TextRun({ text: "FitCore", bold: true, size: 64, color: "00C2D4", font: "Arial" })] }),
      new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "Project Audit Report", bold: true, size: 40, color: "1a1a2e", font: "Arial" })] }),
      new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun({ text: "Next.js 14 · TypeScript · Supabase · AI-Powered Fitness SaaS", size: 22, color: "6B7280", font: "Arial" })] }),
      new Table({
        width: { size: 9200, type: WidthType.DXA },
        columnWidths: [2300, 2300, 2300, 2300],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2300, type: WidthType.DXA }, shading: { fill: "00C2D4", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✅ DONE", bold: true, size: 22, color: "FFFFFF", font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Core Features", size: 18, color: "FFFFFF", font: "Arial" })] })] }),
          new TableCell({ borders: noBorders, width: { size: 2300, type: WidthType.DXA }, shading: { fill: "EF4444", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🔴 5 BUGS", bold: true, size: 22, color: "FFFFFF", font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Critical Issues", size: 18, color: "FFFFFF", font: "Arial" })] })] }),
          new TableCell({ borders: noBorders, width: { size: 2300, type: WidthType.DXA }, shading: { fill: "F59E0B", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "⚠ 9 ISSUES", bold: true, size: 22, color: "FFFFFF", font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Medium Priority", size: 18, color: "FFFFFF", font: "Arial" })] })] }),
          new TableCell({ borders: noBorders, width: { size: 2300, type: WidthType.DXA }, shading: { fill: "8B5CF6", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🚧 4 MISSING", bold: true, size: 22, color: "FFFFFF", font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Not Built Yet", size: 18, color: "FFFFFF", font: "Arial" })] })] }),
        ]})]
      }),
      spacer(),
      new Paragraph({ spacing: { before: 20, after: 300 }, children: [new TextRun({ text: "Audit Date: June 2026  |  Stack: Next.js 14, TypeScript, Supabase, Zustand, Framer Motion, Claude AI", size: 18, color: "9CA3AF", italics: true, font: "Arial" })] }),

      // ── SECTION 1: WHAT IS DONE ─────────────────────────────────────────────
      sectionDivider("SECTION 1 — FEATURES COMPLETED ✅"),
      spacer(),

      h2("1.1 Authentication & Routing"),
      bullet("Full Supabase Auth — login, signup, forgot-password pages exist under app/(auth)/"),
      bullet("Middleware.ts protects all routes: /dashboard, /workout, /diet, /progress, /analytics, /calendar, /ai-coach, /abs, /profile, /cardio"),
      bullet("Demo mode with DemoAuthProvider for testing without Supabase credentials"),
      bullet("Auto-redirect from / to /dashboard is implemented"),
      bullet("Route guards redirect unauthenticated users to /login"),
      spacer(),

      h2("1.2 Dashboard"),
      bullet("Dashboard summary API fetches profile, daily log, streak, meals, analytics in one parallel call"),
      bullet("Auto-creates profile and streak row for new users on first load"),
      bullet("Lazy-loaded WeightSparklineCard and WeeklyProgressChart for performance"),
      bullet("Today's calories, protein, water, streak shown via StatChips and TodayProgressRing"),
      bullet("BMI calculator, Sleep tracker, Deficit tracker, Quote card, Next workout card — all present"),
      bullet("5-minute client-side cache via useAppStore with lastFetched timestamps"),
      bullet("Window blur/focus cache invalidation (refreshes stale data after 2 min away)"),
      spacer(),

      h2("1.3 Workout System"),
      bullet("4 predefined split routines: Chest+Triceps, Back+Biceps, Shoulders+Abs, Leg Day"),
      bullet("Custom workout builder page at /workout/custom with dynamic exercise rows"),
      bullet("WorkoutSessionManager component handles live sessions with timer, sets, reps, weight"),
      bullet("ExerciseCard logs individual sets with rest-timer auto-start"),
      bullet("Workout history API at /api/workout/history with per-exercise PR detection"),
      bullet("AI workout suggestion API at /api/ai/workout-suggest (Claude Sonnet with rule-based fallback)"),
      bullet("Streak tracking — useStreak hook reads from streaks table via StreakRepository"),
      spacer(),

      h2("1.4 Diet & Nutrition Planner"),
      bullet("6 meal slots: Breakfast, Pre-Workout, Lunch, Post-Workout, Dinner, Snack"),
      bullet("25-item Indian food database with per-100g macros in lib/constants.ts"),
      bullet("Custom food entry (name, calories, protein, carbs, fat)"),
      bullet("Meals API at /api/meals with timezone-aware date filtering"),
      bullet("Water intake logging via useDailyLog hook"),
      bullet("AI meal suggestion API at /api/ai/meal-suggest"),
      bullet("Calorie adjustment AI endpoint at /api/ai/calorie-adjust"),
      spacer(),

      h2("1.5 Progress Photo System"),
      bullet("Upload photos via /api/progress-photos with angle selection (front, back, side_left, side_right)"),
      bullet("5MB file size limit, JPEG/PNG/WebP validation"),
      bullet("Photos stored in Supabase Storage 'progress-photos' bucket under user ID folder"),
      bullet("Claude Vision AI analyzes uploaded photo for body fat %, muscle symmetry notes"),
      bullet("Photos grouped by month in the UI with stats panel"),
      bullet("Side-by-side comparison feature (showComparison toggle)"),
      bullet("Delete photo with storage cleanup"),
      spacer(),

      h2("1.6 Analytics Page"),
      bullet("Body metrics logging: weight, waist, chest, hip, body fat %"),
      bullet("Timeframe filter: 2W, 1M, 3M, 6M"),
      bullet("Weight trend line chart via Recharts"),
      bullet("Body measurements multi-line chart (waist/chest/hip)"),
      bullet("Integration with progress photos in analytics view"),
      bullet("API at /api/body-metrics with Zod validation"),
      spacer(),

      h2("1.7 Calendar Page"),
      bullet("Month navigation with Previous/Next arrows"),
      bullet("Activity intensity heatmap (0–3 levels based on workout, cardio, calories, meals logged)"),
      bullet("Week summary card: workouts, cardio sessions, avg calories"),
      bullet("Day detail modal on cell click showing workout name, cardio type, calories vs target"),
      bullet("Timezone-safe date string helper (getLocalDateStr)"),
      spacer(),

      h2("1.8 AI Coach (Chatbot)"),
      bullet("Dedicated /ai-coach page with quick-reply buttons"),
      bullet("Floating chatbot drawer on all pages via ChatbotDrawer in AppShell"),
      bullet("Real-time SSE streaming responses from Claude Sonnet"),
      bullet("Conversation history sent in every request for multi-turn context"),
      bullet("Weekly summary context injected (avg calories, protein, steps, sleep, workouts)"),
      bullet("User profile context (name, goal, target kcal, protein goal, height, weight)"),
      bullet("Rate limiting: 20 chat messages per 15 minutes via checkAiChatLimit"),
      bullet("Chat history stored in Zustand (useChatStore) — persists during session"),
      spacer(),

      h2("1.9 Reports Page"),
      bullet("7-day calorie bar chart vs target baseline"),
      bullet("Weight trend line chart"),
      bullet("Summary stats: total workouts, cardio minutes, protein, weight change, top badge"),
      bullet("PDF/image export via html2canvas + jsPDF (Share button)"),
      spacer(),

      h2("1.10 Achievements"),
      bullet("Badge definitions in lib/constants.ts with BADGE_DEFINITIONS array"),
      bullet("Achievements page shows all badges (locked/earned) with AchievementService logic"),
      bullet("AchievementUnlockOverlay animation overlay component"),
      bullet("useAchievements hook fetches earned badges from AchievementsRepository"),
      spacer(),

      h2("1.11 Settings"),
      bullet("Full profile edit: name, height, weight, goal, experience, all macro targets"),
      bullet("Water goal, step goal, workout days per week"),
      bullet("useProfile hook with updateProfile function"),
      bullet("Optimistic update pattern in profile form"),
      spacer(),

      h2("1.12 Abs Goal Page (/abs)"),
      bullet("Body fat calculator with timeline to visible abs"),
      bullet("Mon/Wed/Fri abs schedule checklist with particle confetti on completion"),
      bullet("Exercise progression tracker (crunches, planks, leg raises) with history sparklines"),
      bullet("Animated progress rings and level unlocking (Beginner → Intermediate → Advanced)"),
      spacer(),

      h2("1.13 Infrastructure & Architecture"),
      bullet("Repository pattern: 8 typed repositories (meals, workouts, streaks, achievements, etc.)"),
      bullet("Service layer: AnalyticsService, WorkoutBusinessService, AchievementService, StreakService"),
      bullet("Zod validation schemas for all major API inputs (lib/validation.ts)"),
      bullet("Rate limiting with Supabase-backed sliding window + in-memory fallback"),
      bullet("Error boundaries on all page-level components (ErrorBoundary, ProductionErrorBoundary)"),
      bullet("Sentry integration for error monitoring (lib/sentry.ts, instrumentation.ts)"),
      bullet("PWA manifest with icon-192 and icon-512 SVGs"),
      bullet("Mock database (mockDb) for demo/offline mode without Supabase"),
      bullet("API response helpers: ok(), unauthorized(), badRequest(), tooManyRequests()"),
      bullet("SmartReminderEngine shows time-based toasts (breakfast, water, pre-workout)"),
      bullet("Vitest unit tests for AnalyticsService, WorkoutBusinessService, StreakService"),
      bullet("Playwright e2e test stubs for auth and dashboard flows"),
      spacer(),

      // ── SECTION 2: BUGS ────────────────────────────────────────────────────
      sectionDivider("SECTION 2 — ACTIVE BUGS 🔴"),
      spacer(),

      new Table({
        width: { size: 9200, type: WidthType.DXA },
        columnWidths: [600, 1800, 1000, 5800],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "ID", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
              new TableCell({ borders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Area", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
              new TableCell({ borders, width: { size: 1000, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Severity", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
              new TableCell({ borders, width: { size: 5800, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Description", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
            ]
          }),
          issueRow("BUG-01", "Reports Page", "CRITICAL", "useMemo() called inside an async function inside useEffect — this is an invalid hook call and will throw a React error at runtime. Line 42 of app/dashboard/reports/page.tsx.", RED),
          issueRow("BUG-02", "Meals API Timezone", "HIGH", "Timezone handling in /api/meals/route.ts is broken. toLocaleString('en-US', { timeZone }) converts a local Date to locale string then back to Date — this double-converts incorrectly. Meals logged near midnight may appear on wrong day.", RED),
          issueRow("BUG-03", "WorkoutSessionManager Progress", "MEDIUM", "useWorkoutSession.ts: completedSets and totalSets are both set to exerciseSets.length, so progressPercentage is always 100%. There is no separate tracking of which sets are 'completed' vs 'logged'.", "E07000"),
          issueRow("BUG-04", "SUPABASE_SERVICE_ROLE_KEY", "HIGH", "progress-photos API uses process.env.SUPABASE_SERVICE_ROLE_KEY directly with ! assertion but it's not listed in .env.example. Will throw in production if not set — no graceful fallback, no env validation.", RED),
          issueRow("BUG-05", "SmartReminderEngine localStorage", "LOW", "SmartReminderEngine reads/writes localStorage in a useEffect but this runs in SSR context on certain Next.js builds. Should guard with typeof window !== 'undefined' check.", "2563EB"),
        ]
      }),
      spacer(),

      h3("BUG-01 Fix — Reports Page useMemo in Async"),
      p("File: app/dashboard/reports/page.tsx", { bold: true }),
      promptBox("BUG-01: Fix illegal useMemo in Reports",
        "In app/dashboard/reports/page.tsx, inside the useEffect load() async function around line 42, there is a call to useMemo() which is illegal — React hooks cannot be called inside async functions or nested functions.\n\nFix it by:\n1. Remove the useMemo() wrapper entirely\n2. Replace it with a plain variable: const mapped = (logs.data ?? []).map(...)\n3. The .map() logic stays the same, just without useMemo\n\nThe function is inside useEffect so it re-runs only when the effect triggers — memoization is unnecessary here."
      ),
      spacer(),

      h3("BUG-02 Fix — Meals API Timezone"),
      p("File: app/api/meals/route.ts", { bold: true }),
      promptBox("BUG-02: Fix timezone double-conversion in meals API",
        "In app/api/meals/route.ts, the timezone conversion logic around lines 22-28 is broken.\n\nCurrent broken code:\n  const startOfDay = new Date(`${date}T00:00:00`);\n  const startUTC = new Date(startOfDay.toLocaleString('en-US', { timeZone: timezone }));\n\nThis is wrong — it converts a local Date to a locale string in the target timezone, then parses that string as if it were UTC, creating a double-offset.\n\nFix it to compute the UTC boundary correctly:\n  // Start of day in UTC: just parse the date string directly as UTC\n  const startISO = `${date}T00:00:00.000Z`;\n  const endISO = `${date}T23:59:59.999Z`;\n\nRemove all the startOfDay, endOfDay, startUTC, endUTC variables and just use startISO and endISO directly in the Supabase query. If timezone-local boundaries are needed in the future, implement them with proper offset math."
      ),
      spacer(),

      h3("BUG-03 Fix — Workout Progress Always 100%"),
      p("File: hooks/useWorkoutSession.ts", { bold: true }),
      promptBox("BUG-03: Fix workout progress percentage always being 100%",
        "In hooks/useWorkoutSession.ts, completedSets and totalSets are both set to exerciseSets.length, making progressPercentage always 100%.\n\nThe issue: exerciseSets contains all logged/completed sets. There is no field tracking 'planned but not yet done' sets.\n\nFix: Import the exercises array from the active session context. Total sets = sum of (sets per exercise × number of exercises planned). Completed sets = exerciseSets.length.\n\nIf planned set count is not available, add a prop or derive it from the Exercise[] array passed to WorkoutSessionManager (each exercise has an initialSets array whose length = planned sets). Pass totalPlannedSets as a number from WorkoutSessionManager into the useWorkoutSession context or return value, then:\n  const progressPercentage = totalPlannedSets > 0 ? Math.min(100, (exerciseSets.length / totalPlannedSets) * 100) : 0;"
      ),
      spacer(),

      h3("BUG-04 Fix — Missing SERVICE_ROLE_KEY in env"),
      p("File: app/api/progress-photos/route.ts + .env.example", { bold: true }),
      promptBox("BUG-04: Add SUPABASE_SERVICE_ROLE_KEY to env validation",
        "In app/api/progress-photos/route.ts, supabaseAdmin is created with process.env.SUPABASE_SERVICE_ROLE_KEY! (non-null assertion). This key is not in .env.example and not validated in lib/env.ts.\n\nDo the following:\n\n1. In .env.example, add:\n   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here\n   # Get from Supabase Dashboard → Settings → API → service_role (secret)\n\n2. In lib/env.ts, inside validateEnv(), add a production check:\n   if (env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {\n     errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production for file storage');\n   }\n\n3. At the top of app/api/progress-photos/route.ts, the existing check already returns serverError if env is missing — verify it runs before supabaseAdmin usage (it does on line 23). No change needed there."
      ),
      spacer(),

      h3("BUG-05 Fix — localStorage SSR Guard"),
      p("File: components/layout/SmartReminderEngine.tsx", { bold: true }),
      promptBox("BUG-05: Add SSR guard for localStorage in SmartReminderEngine",
        "In components/layout/SmartReminderEngine.tsx, inside the useEffect callback, localStorage.getItem() and localStorage.setItem() are called without checking if window exists.\n\nAlthough useEffect only runs client-side, certain Next.js edge cases or test environments can cause issues.\n\nFix: Wrap localStorage access:\n  if (typeof window === 'undefined') return undefined;\n  \n  Add this as the first line inside the useEffect callback, before any localStorage calls. This is a one-line safety guard."
      ),
      spacer(),

      // ── SECTION 3: ISSUES ──────────────────────────────────────────────────
      sectionDivider("SECTION 3 — MEDIUM ISSUES & IMPROVEMENTS ⚠"),
      spacer(),

      h2("ISSUE-01: RLS Policies Not Verified"),
      bullet("The SECURITY_AUDIT.md flags this as VERIFICATION REQUIRED"),
      bullet("The SQL setup files exist (FITCORE_FULL_SETUP_V2.sql) but RLS is not confirmed enabled"),
      bullet("Risk: without RLS, any authenticated user can query any other user's data"),
      spacer(),
      promptBox("ISSUE-01: Add RLS verification SQL script",
        "Create a new file supabase/VERIFY_RLS.sql with the following content:\n\n-- Run this in your Supabase SQL Editor to verify RLS is enabled\nSELECT tablename, rowsecurity\nFROM pg_tables\nWHERE schemaname = 'public'\nAND tablename IN ('profiles','daily_logs','meals','workout_sessions','exercise_sets','streaks','achievements','body_metrics','progress_photos','cardio_logs','rate_limits');\n\n-- All tables should show rowsecurity = true\n-- If any show false, run:\n-- ALTER TABLE <tablename> ENABLE ROW LEVEL SECURITY;\n\nAlso open supabase/FITCORE_FULL_SETUP_V2.sql and verify that every CREATE TABLE block is followed by:\n  ALTER TABLE <tablename> ENABLE ROW LEVEL SECURITY;\n  CREATE POLICY ... USING (auth.uid() = user_id);\nIf any table is missing this, add it."
      ),
      spacer(),

      h2("ISSUE-02: Cardio Page Missing"),
      bullet("Middleware protects /cardio route — meaning the app expects it to exist"),
      bullet("The /api/cardio route exists and works, but there is NO app/cardio/page.tsx"),
      bullet("Navigation likely has a cardio link that currently leads to a 404"),
      spacer(),
      promptBox("ISSUE-02: Create Cardio Logging Page",
        "Create app/cardio/page.tsx — a client component that:\n\n1. Fetches today's cardio logs from GET /api/cardio?date=TODAY\n2. Shows a form to log new cardio: type (running/cycling/walking/swimming/hiit/other), duration_mins, calories_burned (optional), notes\n3. Sends POST to /api/cardio with the form data\n4. Displays today's cardio sessions as a list with delete option\n5. Shows a weekly cardio summary (total minutes this week) by fetching with startDate and endDate params\n\nUse the same GlassCard, NeonButton, PageHeader pattern as other pages.\nUse the useProfile hook for calorie context.\nThe cardio_type must be one of: 'running','cycling','walking','swimming','hiit','other' (matches the DB constraint)."
      ),
      spacer(),

      h2("ISSUE-03: Achievement Progress Not Shown"),
      bullet("Achievements page shows 0 / threshold for locked badges — but threshold is shown, not current progress"),
      bullet("AchievementService.calculateProgress() exists but is never called in the page"),
      bullet("Users cannot see how close they are to earning a badge"),
      spacer(),
      promptBox("ISSUE-03: Show achievement progress bars",
        "In app/dashboard/achievements/page.tsx:\n\n1. Import AchievementService from '@/lib/services/AchievementService'\n2. For each badge, calculate the user's current progress value. The trigger types in BADGE_DEFINITIONS are things like 'workout_streak', 'total_workouts', etc. You need to fetch the relevant count for each.\n3. The simplest approach: add a progressMap to useAchievements hook that returns currentValue per badge_id.\n4. In the badge card, replace the '0 / threshold' text with:\n   - A progress bar (div with bg-neonCyan/20 and inner div width = progressPercentage%)\n   - Text showing currentValue + ' / ' + badge.threshold\n5. Use AchievementService.calculateProgress(currentValue, badge.threshold) for the percentage."
      ),
      spacer(),

      h2("ISSUE-04: Food Database is Very Small"),
      bullet("Only 25 food items in lib/constants.ts FOOD_DATABASE"),
      bullet("No search outside this static list — custom entry workaround exists but is tedious"),
      bullet("No barcode scanner, no external nutrition API integration"),
      spacer(),
      promptBox("ISSUE-04: Expand food database to 80+ items",
        "In lib/constants.ts, expand the FOOD_DATABASE array to include at least 80 Indian and common foods.\n\nAdd these categories that are currently missing:\n- Pulses: chana dal, masoor dal, urad dal, toor dal\n- Dairy: milk (full fat), buttermilk, cottage cheese\n- Breakfast: poha, upma (already there - check), dhokla, besan cheela\n- Rice variants: white rice cooked, basmati cooked, brown rice (already there)\n- Snacks: roasted chana, makhana, peanuts, almonds, cashews, walnuts\n- Vegetables: sweet potato, carrot, cucumber, tomato, onion, mushroom\n- Protein: fish (rohu/catla), egg bhurji, chicken curry, mutton\n- Fruits: mango, papaya, guava, pomegranate, orange\n- Street food: samosa (approx), pav bhaji (approx), chole (approx)\n\nEach entry needs: name, calories (per 100g), protein, carbs, fat, defaultWeightGrams.\nUse standard IFCT (Indian Food Composition Tables) values where possible."
      ),
      spacer(),

      h2("ISSUE-05: AI Coach Page Duplicates Chatbot Logic"),
      bullet("/ai-coach page and ChatbotDrawer are completely separate implementations"),
      bullet("Both call /api/ai/chat, both handle SSE streaming, both maintain their own message state"),
      bullet("Chat history in ChatbotDrawer (Zustand) does not sync with /ai-coach page (local useState)"),
      spacer(),
      promptBox("ISSUE-05: Unify AI chat into shared hook",
        "Create hooks/useAiChat.ts that:\n1. Uses useChatStore (Zustand) for shared message history\n2. Handles fetch to /api/ai/chat with SSE streaming\n3. Exposes: { messages, sendMessage, isStreaming, clearHistory }\n\nThen:\n- Refactor ChatbotDrawer to use useAiChat hook instead of its own state\n- Refactor app/ai-coach/page.tsx to also use useAiChat hook\n- Both will now share the same conversation history\n- The quick replies on ai-coach page will also appear in the drawer context"
      ),
      spacer(),

      h2("ISSUE-06: No Input Validation on Profile Update"),
      bullet("Settings page submits height_cm, weight_kg, target_kcal etc. as Number() converted strings"),
      bullet("If user types 'abc' for height, Number('abc') = NaN, which gets saved to DB"),
      bullet("No min/max validation on form fields — someone could set target_kcal to -500 or 99999"),
      spacer(),
      promptBox("ISSUE-06: Add form validation to Settings page",
        "In app/dashboard/settings/page.tsx, before calling updateProfile():\n\n1. Add a validateForm() function that checks:\n   - height_cm: between 100 and 250 (cm), must be a number\n   - weight_kg: between 30 and 300 (kg), must be a number\n   - target_kcal: between 1000 and 6000\n   - protein_goal_g: between 50 and 500\n   - water_goal_ml: between 1000 and 8000\n   - workout_days_per_week: between 1 and 7\n\n2. Show inline error messages below each field using a red text span\n3. Disable the Save button if any field has a validation error\n4. Also add Zod validation on the server side in the profile update API route if it doesn't already exist"
      ),
      spacer(),

      h2("ISSUE-07: Rate Limiting Not Applied to Auth Routes"),
      bullet("SECURITY_AUDIT.md recommends rate limiting on login/signup"),
      bullet("checkAiChatLimit, checkAiWorkoutLimit exist but no checkAuthLimit"),
      bullet("An attacker can brute-force passwords or spam signups without restriction"),
      spacer(),
      promptBox("ISSUE-07: Add rate limiting to auth API routes",
        "In lib/rate-limit.ts, add a new exported function:\n\nexport async function checkAuthLimit(identifier: string) {\n  return rateLimit(identifier, { limit: 5, windowSecs: 300 }); // 5 attempts per 5 minutes\n}\n\nThen in any API routes that handle auth (password reset, or server-side login if applicable), call checkAuthLimit at the top. If Supabase handles login client-side, add rate limiting in middleware.ts for POST requests to Supabase auth endpoints by checking request.nextUrl.pathname."
      ),
      spacer(),

      h2("ISSUE-08: useWorkoutSession Has Stub Functions"),
      bullet("In hooks/useWorkoutSession.ts, addExerciseToSession and updateSetDetails both return async () => null"),
      bullet("These are stub functions that do nothing — if anything calls them, silently fails"),
      bullet("Custom workout page calls handleStartWorkout which creates a session but may use these stubs"),
      spacer(),
      promptBox("ISSUE-08: Implement addExerciseToSession and updateSetDetails",
        "In hooks/useWorkoutSession.ts, the two stub functions need real implementations:\n\n1. addExerciseToSession(exercise) — should call useWorkout's internal mechanism to add a new exercise to the active session in Supabase (insert into exercise_sets or workout_sessions as appropriate)\n\n2. updateSetDetails(setId, updates) — should update an existing exercise set record in Supabase via the workouts repository\n\nLook at hooks/useWorkout.ts for the existing startSession/finishSession pattern and replicate it for these two operations using WorkoutsRepository from lib/repositories/workouts.repository.ts"
      ),
      spacer(),

      h2("ISSUE-09: SmartReminderEngine Re-runs on Every Calorie Update"),
      bullet("SmartReminderEngine's useEffect depends on [calorieTarget, caloriesConsumed]"),
      bullet("Every time a meal is added and caloriesConsumed changes, the effect re-runs"),
      bullet("This could show the same reminder multiple times if the localStorage key check has a race condition"),
      spacer(),
      promptBox("ISSUE-09: Fix SmartReminderEngine dependency array",
        "In components/layout/SmartReminderEngine.tsx:\n\nThe useEffect should only run once per session (or once per hour), not on every calorie change.\n\nFix:\n1. Change the dependency array to [] (run only on mount)\n2. Inside the effect, set up an interval that checks the current hour every 30 minutes:\n   const interval = setInterval(checkAndShowReminder, 30 * 60 * 1000);\n   checkAndShowReminder(); // check immediately on mount\n   return () => clearInterval(interval);\n\n3. Move the reminder logic into the checkAndShowReminder function\n4. Read calorieTarget and caloriesConsumed from the store inside the function using useAppStore.getState() to avoid stale closure issues"
      ),
      spacer(),

      // ── SECTION 4: NOT BUILT ───────────────────────────────────────────────
      sectionDivider("SECTION 4 — FEATURES NOT BUILT YET 🚧"),
      spacer(),

      h2("MISSING-01: Cardio Page (App Route)"),
      p("The /api/cardio endpoint is fully built with GET and POST. The middleware protects /cardio. But app/cardio/page.tsx does not exist. This is a dead link in the navigation.", { color: "374151" }),
      spacer(),

      h2("MISSING-02: Step Counter / Pedometer"),
      p("lib/types.ts and daily_logs table include a 'steps' column. The dashboard summary API returns steps data. But there is no UI anywhere to log steps manually or integrate with a device. The step_goal is set in profile but never compared to actual steps in the UI (only in AI context).", { color: "374151" }),
      spacer(),
      promptBox("MISSING-02: Add step logging to daily log",
        "In app/dashboard/page.tsx or app/diet/page.tsx (wherever the daily log quick-update panel is):\n\n1. Add a step counter input field below the water tracker\n2. Show today's steps vs step_goal from profile\n3. Call PATCH /api/log/daily with { steps: number } to save\n4. Display a circular progress or bar showing steps/goal ratio\n5. The daily_logs table already has a steps column — just need the UI"
      ),
      spacer(),

      h2("MISSING-03: Profile Avatar Upload"),
      p("The profiles table has avatar_url column. DemoAuthProvider mock user has avatar_url: null. Settings page has no avatar upload UI. Users cannot set a profile picture.", { color: "374151" }),
      spacer(),
      promptBox("MISSING-03: Add avatar upload to Settings",
        "In app/dashboard/settings/page.tsx:\n\n1. Add an avatar section at the top of the form\n2. Show current avatar or a placeholder initials circle\n3. Add a file input (accept image/*) with a click-to-upload pattern\n4. On file select, upload to Supabase Storage bucket 'avatars' at path {userId}/avatar.{ext}\n5. Get the public URL and save it to profiles.avatar_url via updateProfile\n6. Show the avatar in Navigation.tsx next to the user's name\n\nUse the same supabaseAdmin pattern from progress-photos/route.ts for the storage upload."
      ),
      spacer(),

      h2("MISSING-04: Notification / Push Reminder System"),
      p("SmartReminderEngine shows in-app toast reminders. But there is no push notification system for when the app is closed or in the background. The PWA manifest exists (public/manifest.json) with icons, but no service worker is registered for push notifications.", { color: "374151" }),
      spacer(),
      promptBox("MISSING-04: PWA push notification setup",
        "This is an advanced feature — implement only after the app is deployed.\n\n1. Create public/sw.js (service worker) that handles 'push' events\n2. In app/layout.tsx or a client component, register the service worker:\n   navigator.serviceWorker.register('/sw.js')\n3. Request notification permission from user on first login\n4. Store the push subscription in a new Supabase table 'push_subscriptions'\n5. Create a cron API route (app/api/cron/reminders/route.ts) that:\n   - Runs daily at 8am, 12pm, 8pm\n   - Checks which users have not logged meals/water\n   - Sends push via web-push npm package\n\nNote: Requires VAPID keys and a background job runner (Vercel Cron or Supabase Edge Functions)."
      ),
      spacer(),

      // ── SECTION 5: SUMMARY ────────────────────────────────────────────────
      sectionDivider("SECTION 5 — PRIORITY FIX ORDER"),
      spacer(),

      new Table({
        width: { size: 9200, type: WidthType.DXA },
        columnWidths: [600, 2000, 1200, 5400],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Priority", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
            new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "ID", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
            new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Effort", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
            new TableCell({ borders, width: { size: 5400, type: WidthType.DXA }, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "What", size: 18, bold: true, color: "FFFFFF", font: "Arial" })] })] }),
          ]}),
          ...[
            ["1 — FIX NOW", "BUG-01", "5 min", "Remove illegal useMemo from Reports page async function"],
            ["2 — FIX NOW", "BUG-04", "10 min", "Add SUPABASE_SERVICE_ROLE_KEY to .env.example and env validation"],
            ["3 — FIX NOW", "ISSUE-01", "30 min", "Run RLS verification SQL and fix any tables missing policies"],
            ["4 — FIX THIS WEEK", "MISSING-01 + ISSUE-02", "2 hrs", "Build /cardio page — endpoint is ready, just needs UI"],
            ["5 — FIX THIS WEEK", "BUG-02", "20 min", "Fix timezone double-conversion in meals API"],
            ["6 — FIX THIS WEEK", "ISSUE-06", "1 hr", "Add form validation to Settings page"],
            ["7 — IMPROVEMENT", "ISSUE-04", "2 hrs", "Expand food database to 80+ items"],
            ["8 — IMPROVEMENT", "ISSUE-03", "1 hr", "Show achievement progress bars on badges"],
            ["9 — IMPROVEMENT", "BUG-03", "1 hr", "Fix workout progress percentage calculation"],
            ["10 — NICE TO HAVE", "MISSING-02", "1 hr", "Add step logging UI"],
            ["11 — NICE TO HAVE", "MISSING-03", "2 hrs", "Avatar upload in Settings"],
            ["12 — FUTURE", "MISSING-04", "1 day", "PWA push notifications (post-deployment)"],
          ].map(([priority, id, effort, what]) =>
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: priority.includes("FIX NOW") ? "FEE2E2" : priority.includes("WEEK") ? "FEF3C7" : "F0FDF4", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: priority, size: 16, bold: true, font: "Arial", color: priority.includes("FIX NOW") ? "DC2626" : priority.includes("WEEK") ? "B45309" : "15803D" })] })] }),
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: id, size: 18, bold: true, font: "Courier New" })] })] }),
              new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: effort, size: 18, font: "Arial", color: "6B7280" })] })] }),
              new TableCell({ borders, width: { size: 5400, type: WidthType.DXA }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: what, size: 18, font: "Arial" })] })] }),
            ]})
          )
        ]
      }),
      spacer(),
      spacer(),
      new Paragraph({ spacing: { before: 100, after: 40 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: CYAN, space: 6 } }, children: [new TextRun({ text: "FitCore Audit Report  •  Generated June 2026  •  Stack: Next.js 14 · TypeScript · Supabase · Claude AI", size: 16, color: "9CA3AF", italics: true, font: "Arial" })] }),
    ]
  }]
});

const outputPath = path.join(__dirname, 'FitCore_Audit_Report.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('Report generated successfully at:', outputPath);
}).catch(err => {
  console.error('Error generating report:', err);
  process.exit(1);
});
