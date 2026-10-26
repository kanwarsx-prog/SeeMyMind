import React, { useState, useEffect } from 'react';
import { RoleView } from '../types';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  User,
  Users,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Layers,
  Award,
  Bell,
  Sun,
  BookOpen,
  Zap,
  Target,
  ArrowRight,
  Info,
  Play,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';

export interface PersonaTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: RoleView;
  schoolName?: string;
  userName?: string;
}

interface TourStep {
  stepNumber: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  icon: any;
  visualPreview: {
    badge: string;
    badgeColor: string;
    title: string;
    items: {
      label: string;
      value: string;
      accent?: boolean;
    }[];
    highlightText: string;
  };
  whyItMatters: string;
  timeSaved: string;
}

interface RoleTourConfig {
  role: RoleView;
  roleTitle: string;
  personaName: string;
  avatarEmoji: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  icon: any;
  mission: string;
  steps: TourStep[];
}

interface JourneyStep {
  time: string;
  actor: string;
  role: string;
  title: string;
  story: string;
  action: string;
  outcome: string;
  thinking: string;
  need: string;
  better: string;
  icon: any;
  color: string;
  items: { label: string; value: string }[];
}

const DAY_IN_LIFE: JourneyStep[] = [
  {
    time: '7:58 AM', actor: 'Dana · Parent', role: 'Home → School', title: 'A better start begins before the bell',
    story: 'Phoenix had a broken night and is worried about the loud assembly. Dana shares the useful context in one calm, 20-second handover.',
    action: 'Send the morning handover', outcome: 'Ms Johnson sees the context before Phoenix enters the classroom.', icon: HeartHandshake, color: '#B87A2A',
    thinking: 'What small detail would change the way school meets Phoenix this morning?', need: 'Share the context that is useful—not a full report.', better: 'A 20-second note replaces a stressful gate conversation and gives the teacher a head start.',
    items: [{ label: 'Sleep', value: 'Disturbed · woke at 4:30 AM' }, { label: 'Sensory flag', value: 'Assembly noise' }, { label: 'Packed support', value: 'Ear defenders' }],
  },
  {
    time: '8:42 AM', actor: 'Ms Johnson · Teacher', role: 'Classroom Overview', title: 'Context arrives where it matters',
    story: 'Phoenix appears in the Room 4 readiness view with the home context attached. The teacher can adjust the first transition before dysregulation starts.',
    action: 'Acknowledge and prepare', outcome: 'The parent receives a read receipt; the classroom is ready before registration.', icon: GraduationCap, color: '#5E4D9A',
    thinking: 'What can I adjust before Phoenix has to ask for help?', need: 'Acknowledge the handover and prepare the first transition.', better: 'The right support is ready before a difficult moment becomes visible.',
    items: [{ label: 'Readiness', value: 'Gentle start recommended' }, { label: 'Preparation', value: 'Quiet seat ready' }, { label: 'Connection', value: 'Parent notified' }],
  },
  {
    time: '10:16 AM', actor: 'Melissa · TA', role: 'Support Hub', title: 'Support becomes an action, not a guess',
    story: 'A fire-drill vibration catches Phoenix off guard. The TA sees the personalised strategy, chooses the smallest useful intervention, and records what happened.',
    action: 'Use the visual timer + quiet route', outcome: 'Phoenix returns to learning in four minutes and the strategy is available next time.', icon: Users, color: '#059669',
    thinking: 'Which low-demand strategy will help Phoenix recover without adding pressure?', need: 'Choose one proven tool, observe the result, and record the outcome.', better: 'A useful response becomes shared knowledge instead of living only in one adult’s memory.',
    items: [{ label: 'Trigger', value: 'Unexpected bell vibration' }, { label: 'Strategy', value: 'Noise defenders + break' }, { label: 'Result', value: 'Regulated · returned' }],
  },
  {
    time: '12:35 PM', actor: 'Phoenix · Pupil', role: 'Pupil Voice', title: 'The child gets a voice in the record',
    story: 'Phoenix chooses an energy level and names what helped. The system captures pupil voice without asking them to complete a clinical form.',
    action: 'Complete the 10-second check-in', outcome: 'Adults see the child’s perspective alongside observations and outcomes.', icon: MessageCircle, color: '#E06A55',
    thinking: 'How can I show adults what is happening when words feel like too much?', need: 'Choose a mood, energy level, and what helped.', better: 'Pupil voice sits beside adult observations—never underneath them.',
    items: [{ label: 'Mood', value: 'OK' }, { label: 'Energy', value: '75% charged' }, { label: 'What helped', value: 'Quiet route' }],
  },
  {
    time: '3:15 PM', actor: 'See My Mind · Shared loop', role: 'Home-time', title: 'The day closes with a strength, not a deficit',
    story: 'The family receives a concise summary: what took effort, what worked, and one gentle decompression suggestion for home.',
    action: 'Share the day’s win', outcome: 'Home and school finish with the same language—and Phoenix’s progress is visible.', icon: Sparkles, color: '#2A6B62',
    thinking: 'What should home know tonight so the transition feels safe and positive?', need: 'Share one honest summary, one win, and one gentle next step.', better: 'The day ends with a useful handover and a strength to celebrate—not a list of problems.',
    items: [{ label: 'Today’s win', value: 'Returned after the break' }, { label: 'Home suggestion', value: '20-minute quiet buffer' }, { label: 'Shared record', value: 'Timeline updated' }],
  },
];

interface PersonaLens {
  label: string;
  title: string;
  thinking: string;
  need: string;
  systemHelps: string;
  whyBetter: string;
  cta: string;
}

const PERSONA_LENSES: Record<RoleView, PersonaLens> = {
  teacher: {
    label: 'Teacher lens', title: 'Run the room with context, not guesswork.',
    thinking: 'Who needs a gentler start today, and what will help them access the lesson?',
    need: 'Scan the cohort, acknowledge home context, and adapt the next transition.',
    systemHelps: 'Turns handovers, readiness signals, pupil profiles, and lesson adaptations into one classroom view.',
    whyBetter: 'You spend less time reconstructing context and more time teaching with confidence.', cta: 'Explore teacher workspace',
  },
  ta: {
    label: 'TA lens', title: 'Know where your support matters most.',
    thinking: 'What is the smallest useful intervention I can offer right now?',
    need: 'Find the pupil strategy, act in the moment, and capture what actually worked.',
    systemHelps: 'Puts transition times, calming tools, pupil profiles, and quick notes in reach on any device.',
    whyBetter: 'Your observations become shared evidence instead of disappearing into end-of-day memory.', cta: 'Explore TA workspace',
  },
  senco: {
    label: 'SENCO lens', title: 'Turn scattered evidence into a live inclusion picture.',
    thinking: 'Where is provision working, where are reviews due, and which pupil needs attention first?',
    need: 'Review caseload health, statutory evidence, staffing, and next actions across the school.',
    systemHelps: 'Connects pupil timelines, provision maps, EHCP evidence, staff allocation, and analytics.',
    whyBetter: 'Leadership decisions are grounded in current evidence rather than spreadsheet archaeology.', cta: 'Explore SENCO workspace',
  },
  parent: {
    label: 'Parent lens', title: 'Stay connected without chasing the school.',
    thinking: 'Did the team understand what my child needs today, and how did the day really go?',
    need: 'Share the useful context quickly, receive acknowledgement, and understand the home-time handover.',
    systemHelps: 'Creates a calm loop between morning notes, classroom acknowledgement, wins, and evening support.',
    whyBetter: 'You get reassurance and practical next steps instead of uncertainty or repeated phone calls.', cta: 'Explore parent workspace',
  },
  child: {
    label: 'Pupil lens', title: 'Be understood without having to explain everything.',
    thinking: 'How am I feeling, what will help, and can I show someone without making a big fuss?',
    need: 'Use a quick check-in, choose a support tool, and celebrate what went well.',
    systemHelps: 'Uses visual, low-demand check-ins and strengths-based wins that adults can understand.',
    whyBetter: 'Your voice travels with you, while support feels more predictable and less clinical.', cta: 'Explore pupil workspace',
  },
  admin: {
    label: 'Admin lens', title: 'Make trust, access, and accountability visible.',
    thinking: 'Are the right people seeing the right information, and can we evidence every decision?',
    need: 'Provision schools, manage roles, delegate responsibility, and inspect the audit trail.',
    systemHelps: 'Centralises tenancy, role permissions, delegation, and security events in one governance hub.',
    whyBetter: 'Operational confidence comes from traceable controls rather than manual checks.', cta: 'Explore admin workspace',
  },
  parentplus: {
    label: 'Parent Plus lens', title: 'Build a future around strengths, not limitations.',
    thinking: 'What does my child naturally excel at, and how can that become a meaningful pathway?',
    need: 'Connect strengths, interests, activities, and future opportunities into an optimistic plan.',
    systemHelps: 'Turns longitudinal strengths and interests into practical home activities and pathway ideas.',
    whyBetter: 'Future planning becomes specific, positive, and grounded in the child’s real patterns.', cta: 'Explore Parent Plus workspace',
  },
};

const ROLE_TOURS: Record<RoleView, RoleTourConfig> = {
  teacher: {
    role: 'teacher',
    roleTitle: 'Classroom Teacher',
    personaName: 'Classroom Teacher Hub',
    avatarEmoji: '👩‍🏫',
    themeColor: '#5E4D9A',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    badgeText: 'text-purple-700',
    icon: GraduationCap,
    mission: 'Empowering morning readiness in under 15 seconds, morning handovers, and tailored subject differentiation.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Room 4 Overview',
        title: '8:45 AM Classroom Hub & Readiness Check',
        subtitle: 'Whole-class visibility across all SEND learners before registration begins',
        icon: Sun,
        visualPreview: {
          badge: '🏫 Room 4 Classroom Hub (Default View)',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          title: 'Whole-Class Morning Readiness Overview',
          items: [
            { label: 'Archie Evans (Yr 4)', value: '🟢 Energy Reserve 85% · Ready for Day', accent: true },
            { label: 'Riya Patel (Yr 4)', value: '🟢 Visual Task Cards Placed · TA Grant assigned' },
            { label: 'Aisha Khan (Yr 4)', value: '🟡 Arrival Caution: Skipped breakfast at home' },
            { label: 'Phoenix Carter (Yr 5)', value: '🟡 Restless sleep · Noise defenders in bag' },
          ],
          highlightText: 'Scans your entire differentiated cohort in 10 seconds. No manual paper logs.',
        },
        whyItMatters: 'Teachers start the day with complete awareness of sensory needs before the bell rings, eliminating unexpected morning stress.',
        timeSaved: 'Saves 15–20 minutes of morning paper checking.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Morning Handover',
        title: '1-Click Morning Handover & Reassurance Loop',
        subtitle: 'Instant home-to-school communication without telephone tag',
        icon: Bell,
        visualPreview: {
          badge: '📲 Home-to-Classroom Handover',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Morning Note from Dana Carter (Parent)',
          items: [
            { label: 'Sleep Quality', value: 'Disturbed sleep (woke at 4:30 AM)' },
            { label: 'Sensory Flag', value: 'Anxious about loud Hall Assembly' },
            { label: 'Adult Action', value: 'Ear defenders are packed in side pocket', accent: true },
          ],
          highlightText: 'Clicking [✓ Acknowledge Handover] instantly pings Dana’s phone with a read receipt.',
        },
        whyItMatters: 'Parents get instant peace of mind knowing the teacher is aware, and teachers receive critical context before any classroom meltdown occurs.',
        timeSaved: 'Zero telephone tag or handwritten sticky notes.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Pupil Profile',
        title: 'Pupil Profile & In-the-Moment Support',
        subtitle: 'Individual sensory timelines, triggers to avoid, and step-by-step calming strategies',
        icon: Target,
        visualPreview: {
          badge: '🧒 1:1 Focus Mode (Sticky Breadcrumb)',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          title: 'Calming Strategies & Refocus Steps',
          items: [
            { label: 'Level 1 (Early Warning)', value: 'Provide quiet corner with weighted lap cushion' },
            { label: 'Level 2 (Rising Anxiety)', value: 'Deploy visual 5-minute sand timer; lower classroom lights' },
            { label: 'Level 3 (Overwhelmed)', value: 'Offer green sensory card; transition to quiet sensory space', accent: true },
          ],
          highlightText: 'Sticky [← Back to Classroom Hub] breadcrumb returns to the full class anytime.',
        },
        whyItMatters: 'Every pupil card has a 1-click drill-down. Supply teachers and classroom staff have immediate access to validated calming steps.',
        timeSaved: 'Eliminates frantic searching through bulky paper IEP folders.',
      },
      {
        stepNumber: 4,
        stepLabel: 'Adapted Lesson Pathways',
        title: 'Live Subject Adaptations & Visual Task Cards',
        subtitle: 'Filtering lesson differentiation across Maths, English, and Science side-by-side',
        icon: BookOpen,
        visualPreview: {
          badge: '🎯 Curriculum Differentiation',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'Subject Adaptation Matrix (Room 4)',
          items: [
            { label: 'Maths Adaptation', value: 'Visual game design slope angles (Phoenix hook)', accent: true },
            { label: 'English Adaptation', value: 'Chunked reading strips with dyslexic color overlay' },
            { label: 'Science Adaptation', value: 'Hands-on water density practical with pictorial task cards' },
          ],
          highlightText: 'Subject filters let you differentiate worksheets for all 4 SEND pupils in one view.',
        },
        whyItMatters: 'Prevents cognitive overload and classroom disengagement by meeting pupils at their exact sensory and cognitive processing level.',
        timeSaved: 'Cuts lesson adaptation planning time in half.',
      },
    ],
  },
  senco: {
    role: 'senco',
    roleTitle: 'SENCO & Inclusion Lead',
    personaName: 'SENCO Provision Register',
    avatarEmoji: '🗂️',
    themeColor: '#1B8A8A',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
    badgeText: 'text-teal-700',
    icon: ShieldCheck,
    mission: 'Whole-school provision mapping, statutory EHCP review tracking, and multi-agency compliance evidence.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Inclusion & Caseload',
        title: 'Whole-School Provision Register & Live Metrics',
        subtitle: 'Dynamic caseload tracking across Statutory EHCP, SEN Support, and Monitoring tiers',
        icon: Layers,
        visualPreview: {
          badge: '🏛️ Whole-School Inclusion Cockpit',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          title: 'Pupil Support & Funding Summary',
          items: [
            { label: 'Total SEND Caseload', value: '34 Active Pupils (Live School Scoped)', accent: true },
            { label: 'Statutory EHCPs', value: '12 Pupils (Tier 3 Funded)' },
            { label: 'SEN Support (K)', value: '22 Pupils with Targeted Interventions' },
            { label: 'High Needs Funding', value: '£182,500 tracked across active provisions' },
          ],
          highlightText: 'Zero hardcoding: Metrics calculate directly from your school’s live pupil records.',
        },
        whyItMatters: 'School leaders and Ofsted inspectors see accurate, real-time provision numbers without relying on outdated termly Excel spreadsheets.',
        timeSaved: 'Saves 4+ hours per week of manual data collation.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Statutory EHCP Plans',
        title: '30-Day Statutory EHCP Review Countdown & Evidence',
        subtitle: 'Automated deadline tracking and one-click Local Authority evidence compilation',
        icon: Clock,
        visualPreview: {
          badge: '📅 Statutory Compliance Guard',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          title: 'Annual Review Evidence Dossier',
          items: [
            { label: 'Upcoming Review', value: 'Phoenix Carter · Review due in 14 days', accent: true },
            { label: 'Section E Evidence', value: '48 teacher notes & TA observations compiled' },
            { label: 'Pupil Voice', value: 'Completed emoji check-ins & strengths summary' },
          ],
          highlightText: 'Clicking [Export Evidence Pack] formats an Ofsted/LA-ready PDF review dossier.',
        },
        whyItMatters: 'Guarantees the school never breaches statutory 12-month annual review deadlines and provides empirical evidence of provision impact.',
        timeSaved: 'Compiles review evidence packs in seconds instead of days.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Register SEND Pupil',
        title: 'Universal Pupil Onboarding & 72-Hour Parent Invites',
        subtitle: '4-step child registration wizard and secure family portal onboarding tokens',
        icon: User,
        visualPreview: {
          badge: '✨ Universal Child Registration',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          title: 'New SEND Pupil Onboarding Wizard',
          items: [
            { label: 'Step 1: Demographics', value: 'Full name, DOB, Year group, Classroom' },
            { label: 'Step 2: Needs Category', value: 'Autism Spectrum (ASC), ADHD, Dyspraxia' },
            { label: 'Step 3: De-escalation', value: 'Triggers, calming strategies, emergency steps', accent: true },
            { label: 'Step 4: Parent Invite', value: 'Generate 72-Hour SMS/Email token' },
          ],
          highlightText: 'Invited parents access their dedicated hub without creating administrative clutter.',
        },
        whyItMatters: 'Zero friction to onboard new joiners. New pupils are immediately mapped into classroom readiness matrixes.',
        timeSaved: 'Onboards a child and family in under 3 minutes.',
      },
      {
        stepNumber: 4,
        stepLabel: 'Staff & Team Directory',
        title: 'Staff Directory & TA Allocation Tracking',
        subtitle: 'Transparent weekly 1:1 hours, classroom allocations, and supply teacher briefing',
        icon: Users,
        visualPreview: {
          badge: '🤝 Team Deployment & Resource Allocation',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'Teaching Assistant Deployment Matrix',
          items: [
            { label: 'Melissa Grant (TA)', value: '25.0 hrs/wk · Room 4 (Phoenix 1:1 + Archie support)', accent: true },
            { label: 'Sarah Jenkins (TA)', value: '18.5 hrs/wk · Room 2 (Speech & Language loops)' },
            { label: 'Supply Teacher Mode', value: '60-second classroom sensory brief ready' },
          ],
          highlightText: 'Ensures High Needs funding hours are deployed directly into classroom support.',
        },
        whyItMatters: 'Provides complete accountability for Local Authority funding audits and ensures TAs are allocated where the need is highest.',
        timeSaved: 'Full audit transparency with zero spreadsheet recalculations.',
      },
    ],
  },
  parent: {
    role: 'parent',
    roleTitle: 'Parent & Family',
    personaName: 'Parent Hub & Reassurance Loop',
    avatarEmoji: '👨‍👩‍👧',
    themeColor: '#B87A2A',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'text-amber-700',
    icon: HeartHandshake,
    mission: 'Bridging home and school with 20-second morning handovers, real-time reassurance, and peaceful evenings.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Morning Handover',
        title: '20-Second Morning Handover Before 8:45 AM',
        subtitle: 'Adult notes: zero paperwork and zero app demands on your child',
        icon: Sun,
        visualPreview: {
          badge: '☀️ Quick Morning Check-In (Mobile Friendly)',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Morning Check-In Note',
          items: [
            { label: 'Rest & Sleep', value: 'Restless sleep (woke up upset at 4:30 AM)' },
            { label: 'Nutrition', value: 'Skipped toast; ate a cereal bar in car' },
            { label: 'Sensory Flag', value: 'Hall assembly noise caution (ear defenders packed)', accent: true },
          ],
          highlightText: 'Takes under 20 seconds while walking to school. Child never fills out clinical forms.',
        },
        whyItMatters: 'Teachers walk into registration knowing exactly how your child’s morning began, preventing misinterpretation of when they are feeling overwhelmed.',
        timeSaved: 'Replaces stressful morning emails and gate conversations.',
      },
      {
        stepNumber: 2,
        stepLabel: 'School Acknowledgement',
        title: 'Real-Time Classroom Read-Receipts',
        subtitle: 'Instant reassurance that your child’s teacher has your note',
        icon: CheckCircle2,
        visualPreview: {
          badge: '📲 Closed-Loop Reassurance',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'Classroom Acknowledgment Alert',
          items: [
            { label: 'Teacher Status', value: '✓ Acknowledged by Ms Johnson at 8:50 AM', accent: true },
            { label: 'Action Taken', value: 'Ear defenders placed at desk; quiet seating arranged' },
            { label: 'Peace of Mind', value: 'No need to worry while you are at work' },
          ],
          highlightText: 'Immediate confirmation removes the anxious dread of "did they get my note?"',
        },
        whyItMatters: 'Relieves parental anxiety during the work day and establishes trust through mutual transparency.',
        timeSaved: 'Eliminates mid-morning phone calls to the school reception.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Home-Time Handover',
        title: 'Home-Time Note (3:15 PM) & Calming Steps',
        subtitle: 'How their day went and how to greet them at the gates',
        icon: BatteryCharging,
        visualPreview: {
          badge: '🌙 Peaceful Evening Recipe',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          title: 'Tonight’s Transition Recipe',
          items: [
            { label: 'Day Summary', value: 'High cognitive effort in Maths; regulated in Science' },
            { label: 'Tonight’s Tip', value: 'Allow 20 mins low-sensory quiet time before questions', accent: true },
            { label: 'Recommended Action', value: 'Offer preferred crunchy snack & dim bedroom lighting' },
          ],
          highlightText: 'Targeted tips based on how the school day actually unfolded.',
        },
        whyItMatters: 'Children who mask all day at school often collapse at home. Evidence-based tonight tips give families a peaceful evening.',
        timeSaved: 'Prevents evening meltdowns and family distress.',
      },
      {
        stepNumber: 4,
        stepLabel: 'Superpowers',
        title: 'ParentPlus Neurodivergent Strengths Pathway',
        subtitle: 'Celebrating visual-spatial, coding, and systems-thinking superpowers',
        icon: Award,
        visualPreview: {
          badge: '🌟 Strength-Based Education',
          badgeColor: 'bg-coral/20 text-coral border-coral/40',
          title: 'Child Strengths & Superpowers',
          items: [
            { label: 'Identified Superpower', value: 'Visual-Spatial Architecture & Pattern Recognition', accent: true },
            { label: 'Classroom Win', value: 'Led water density science experiment with visual cards' },
            { label: 'Home Activity Idea', value: 'Minecraft redstone engineering challenge' },
          ],
          highlightText: 'Focusing on what your child can do, not just their clinical deficits.',
        },
        whyItMatters: 'Builds pupil self-esteem and fosters a collaborative partnership between parents and educators.',
        timeSaved: 'Transforms clinical IEP meetings into positive strength discussions.',
      },
    ],
  },
  ta: {
    role: 'ta',
    roleTitle: 'Teaching Assistant',
    personaName: 'TA Support & Classroom Notes',
    avatarEmoji: '🤝',
    themeColor: '#059669',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    badgeText: 'text-emerald-700',
    icon: Users,
    mission: 'Providing targeted 1:1 support blocks, calming tools, and quick <30s classroom notes.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Transition Times',
        title: 'Key Daily Transition Times & Support Blocks',
        subtitle: 'Targeted support during busy transitions like playground and lesson changes',
        icon: Clock,
        visualPreview: {
          badge: '⏰ Targeted Support Schedule',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'Daily Support Schedule',
          items: [
            { label: '9:15 – 10:15 AM', value: 'Room 4 Maths: Phoenix (Visual Quest Task Cards)', accent: true },
            { label: '10:15 – 10:30 AM', value: 'Playground Transition: Sensory check & Archie support' },
            { label: '11:00 – 12:00 PM', value: 'Room 2 Literacy: Guided small-group phonetic loop' },
          ],
          highlightText: 'Clear schedule ensures your 1:1 hours target the most sensitive moments.',
        },
        whyItMatters: 'TAs know exactly where to position themselves for optimal impact without waiting for verbal instructions.',
        timeSaved: 'Prevents confusion during busy lesson transitions.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Classroom Notes',
        title: 'Quick Classroom Notes (< 30 Seconds)',
        subtitle: 'Rapid notes on what helped vs what caused distress',
        icon: Zap,
        visualPreview: {
          badge: '📝 Quick Classroom Note (<30s)',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          title: 'Live Observation Note',
          items: [
            { label: 'Trigger Observed', value: 'Unexpected fire drill bell vibration' },
            { label: 'Strategy Deployed', value: 'Noise defenders + 3-minute hallway sensory break', accent: true },
            { label: 'Outcome', value: 'Calmed successfully; returned to desk in 4 mins' },
          ],
          highlightText: 'Submit directly from a tablet or phone in under 30 seconds.',
        },
        whyItMatters: 'Provides real-time behavioral data for the SENCO and annual review packs without requiring hours of after-school paperwork.',
        timeSaved: 'Saves 30 minutes of end-of-day report writing.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Calming Tools',
        title: 'In-the-Moment Calming Tools',
        subtitle: 'Quick-access calming strategies tailored to each pupil',
        icon: BatteryCharging,
        visualPreview: {
          badge: '🧘 Calming Tools & Strategies',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          title: 'Verified Calming Tools',
          items: [
            { label: 'Visual Timer', value: 'Use 5-min blue sand timer for task pacing' },
            { label: 'Deep Pressure', value: 'Offer weighted lap pad during seated reading', accent: true },
            { label: 'Break Pass', value: 'Allow 2-min hallway water break without fuss' },
          ],
          highlightText: 'Actionable calming strategies validated by the child’s SENCO and occupational therapist.',
        },
        whyItMatters: 'Gives the TA immediate confidence and clarity during moments of pupil distress.',
        timeSaved: 'Helps pupils settle and refocus in minutes.',
      },
    ],
  },
  child: {
    role: 'child',
    roleTitle: 'Pupil Voice',
    personaName: 'Pupil Voice & Visual Quests',
    avatarEmoji: '🧒',
    themeColor: '#E06A55',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
    badgeText: 'text-rose-700',
    icon: User,
    mission: 'A child-friendly space to share feelings with emojis, conquer visual quests, and celebrate daily wins.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Daily Mood Check-In',
        title: 'Emoji Mood & Energy Level Check-In',
        subtitle: '10-second check-in to let teachers know how you are feeling',
        icon: Sun,
        visualPreview: {
          badge: '⭐ Daily Emoji Check-In',
          badgeColor: 'bg-coral/20 text-coral border-coral/40',
          title: 'How do you feel this morning?',
          items: [
            { label: 'Mood Choices', value: '😄 Great · 🙂 OK · 😐 Tired · 😟 Overwhelmed', accent: true },
            { label: 'Energy Level', value: '🔋 Energy Level: 75% Charged' },
            { label: 'Superpower Goal', value: 'Master today’s Maths video game quest' },
          ],
          highlightText: 'No long sentences or scary clinical questions. Just fun emojis.',
        },
        whyItMatters: 'Pupils feel heard and validated without feeling singled out or interrogated in front of peers.',
        timeSaved: 'Completed in under 10 seconds.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Visual Quests',
        title: 'Visual Quest Worksheets & Special Interests',
        subtitle: 'Learning connected to things you love (coding, gaming, science)',
        icon: BookOpen,
        visualPreview: {
          badge: '🎮 Visual Task Cards',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          title: 'Maths Quest: Video Game Slope Angles',
          items: [
            { label: 'Quest Step 1', value: 'Calculate the ramp jump angle (45 degrees)', accent: true },
            { label: 'Quest Step 2', value: 'Estimate speed needed to clear the water hazard' },
            { label: 'Reward Badge', value: 'Unlocks "Master Physics Builder" Gold Trophy' },
          ],
          highlightText: 'Breaks complex tasks into small, bite-sized visual steps.',
        },
        whyItMatters: 'Makes learning accessible and exciting by connecting directly to the child’s natural interests.',
        timeSaved: 'Eliminates task avoidance and maths anxiety.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Celebrating Wins',
        title: 'My Daily Wins & Achievement Trophies',
        subtitle: 'Celebrating every milestone with home and school',
        icon: Award,
        visualPreview: {
          badge: '🏆 Hall of Trophies',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Recent Trophies Earned',
          items: [
            { label: 'Science Win', value: 'Demonstrated water density practical leadership', accent: true },
            { label: 'Kindness Star', value: 'Helped Archie with his visual timetable' },
            { label: 'Focus Master', value: 'Completed 20 minutes of independent coding' },
          ],
          highlightText: 'Wins are shared directly with parents to celebrate at home tonight.',
        },
        whyItMatters: 'Reinforces positive identity, builds resilience, and reminds every learner of their worth.',
        timeSaved: 'Creates lasting pride and self-confidence.',
      },
    ],
  },
  admin: {
    role: 'admin',
    roleTitle: 'Platform Governance',
    personaName: 'Admin Hub & Tenancy',
    avatarEmoji: '🏛️',
    themeColor: '#3B82F6',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    badgeText: 'text-blue-700',
    icon: Building2,
    mission: 'Multi-school tenant provisioning, role-based access control, and UK GDPR statutory audit logs.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'School Onboarding',
        title: 'Multi-School Tenant Provisioning in 60 Seconds',
        subtitle: 'Zero-hardcoded school setup with isolated database schemas',
        icon: Building2,
        visualPreview: {
          badge: '🏢 Multi-Academy Trust Onboarding',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          title: 'Registered School Tenants',
          items: [
            { label: 'St. Jude’s Inclusive Academy', value: 'URN: 104523 · 34 SEND Pupils Active' },
            { label: 'Poverest Primary School', value: 'URN: 120894 · Lead SENCO: Priyanka Thakur', accent: true },
            { label: 'Data Isolation', value: 'Strict tenant scoping via Users.school_id' },
          ],
          highlightText: 'Newly provisioned schools start with clean zero-states and isolated caseloads.',
        },
        whyItMatters: 'Enables MAT (Multi-Academy Trust) central teams to provision and govern dozens of schools with complete multi-tenant safety.',
        timeSaved: 'Onboards a new school in 60 seconds.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Role Provisioning',
        title: 'Staff Hierarchy & Role-Based Access Control',
        subtitle: 'Provisioning Headteachers, SENCOs, Teachers, and TAs securely',
        icon: Users,
        visualPreview: {
          badge: '🔒 Role-Based Access Control',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          title: 'Staff Account Management',
          items: [
            { label: 'SENCO Role', value: 'Full statutory register, funding, and export rights' },
            { label: 'Teacher Role', value: 'Classroom Hub, morning handovers, lesson adaptations', accent: true },
            { label: 'TA Role', value: 'Classroom notes, calming tools, and transition schedule' },
          ],
          highlightText: 'Users only see data relevant to their role and allocated classroom cohort.',
        },
        whyItMatters: 'Protects sensitive pupil safeguarding and medical records under UK GDPR and DfE statutory guidelines.',
        timeSaved: 'Instant account provisioning with automated security tokens.',
      },
      {
        stepNumber: 3,
        stepLabel: 'GDPR Audit Trail',
        title: 'Statutory Safeguarding & GDPR Audit Trail',
        subtitle: 'Cryptographic time-stamped activity logging for full compliance',
        icon: ShieldCheck,
        visualPreview: {
          badge: '🛡️ UK GDPR & DfE Compliance Log',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'System Activity Audit Stream',
          items: [
            { label: '10:45 AM', value: 'Priyanka Thakur (SENCO) opened Poverest Provision Matrix', accent: true },
            { label: '09:15 AM', value: 'Ms Johnson acknowledged morning handover note for Phoenix' },
            { label: '08:48 AM', value: 'Dana Carter submitted 20-second morning handover' },
          ],
          highlightText: 'Every access and export is time-stamped and tamper-evident.',
        },
        whyItMatters: 'Guarantees complete legal compliance during statutory Local Authority reviews and Information Commissioner Office (ICO) audits.',
        timeSaved: 'Instant 1-click audit reports for Trust governance meetings.',
      },
    ],
  },
  parentplus: {
    role: 'parentplus',
    roleTitle: 'ParentPlus Superpowers',
    personaName: 'ParentPlus Strengths & Future Pathways',
    avatarEmoji: '🌟',
    themeColor: '#D97706',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'text-amber-700',
    icon: Award,
    mission: 'Unlocking neurodivergent strengths, visual-spatial architecture, and future development pathways.',
    steps: [
      {
        stepNumber: 1,
        stepLabel: 'Strength Profiling',
        title: 'Cognitive Superpowers & Strengths Profiling',
        subtitle: 'Shifting from clinical deficit models to visual and systems-thinking gifts',
        icon: Award,
        visualPreview: {
          badge: '🌟 Cognitive Superpower Radar',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Validated Superpower Profile',
          items: [
            { label: 'Spatial Architecture', value: 'Exceptional 3D rotational reasoning (Top 5%)', accent: true },
            { label: 'Hyperfocus Deep Work', value: 'Can sustain 45+ mins when building redstone logic' },
            { label: 'Pattern Recognition', value: 'Spots anomalies in complex data matrices instantly' },
          ],
          highlightText: 'Empowers parents with positive identity language for IEP and annual reviews.',
        },
        whyItMatters: 'Builds pupil confidence and self-advocacy by proving their neurodivergence includes genuine cognitive advantages.',
        timeSaved: 'Transforms defensive clinical reviews into inspiring strength conversations.',
      },
      {
        stepNumber: 2,
        stepLabel: 'Home Activities',
        title: 'Strength-Led Home Learning Activities',
        subtitle: 'Engaging challenges tailored to your child’s special interest hooks',
        icon: BookOpen,
        visualPreview: {
          badge: '💡 Home Learning Quests',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          title: 'Recommended Home Quests',
          items: [
            { label: 'Minecraft Engineering', value: 'Design a water-filtration elevator circuit', accent: true },
            { label: 'Visual Coding', value: 'Scratch block physics simulation of ramp friction' },
            { label: 'Lego Spatial Geometry', value: 'Construct modular bridge prototypes to test load' },
          ],
          highlightText: 'Activities turn hyperfocus into foundational STEM and computer science skills.',
        },
        whyItMatters: 'Removes homework conflict and task avoidance by working with your child’s dopamine pathways instead of fighting them.',
        timeSaved: 'Zero tears over evening homework.',
      },
      {
        stepNumber: 3,
        stepLabel: 'Future Careers',
        title: 'Future Pathways & Career Alignment',
        subtitle: 'Connecting childhood hyperfocus to high-value future professions',
        icon: Layers,
        visualPreview: {
          badge: '🚀 Future Horizons Matrix',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          title: 'Career Trajectory Pathways',
          items: [
            { label: 'Software Architecture', value: 'High fit for systems thinking and debugging logic', accent: true },
            { label: 'Game Engine Design', value: 'Ideal for 3D spatial simulation and procedural physics' },
            { label: 'Cybersecurity Analyst', value: 'Excells at intuitive pattern recognition and threat hunting' },
          ],
          highlightText: 'Helps families envision a thriving, independent adulthood for their child.',
        },
        whyItMatters: 'Replaces parental fear about the future with tangible, exciting career horizons grounded in their child’s natural cognitive gifts.',
        timeSaved: 'Provides long-term clarity and reassurance.',
      },
    ],
  },
};

function getTourStepAction(role: RoleView, stepLabel: string): string {
  const label = stepLabel.toLowerCase();
  if (role === 'teacher') {
    if (label.includes('overview')) return 'Open Room 4 Classroom Overview from the teacher sidebar to scan the whole cohort.';
    if (label.includes('handover')) return 'Open Morning Briefings and select a pupil to review or acknowledge the latest handover.';
    if (label.includes('pupil profile')) return 'Select any pupil card to open their profile and see their personalised support strategies.';
    return 'Open Adapted Lesson Pathways to see the current subject-specific differentiation.';
  }
  if (role === 'senco') {
    if (label.includes('caseload')) return 'Start in Inclusion & Caseload to review live support tiers and provision coverage.';
    if (label.includes('statutory')) return 'Open Statutory EHCP Plans to review upcoming deadlines and evidence.';
    if (label.includes('register')) return 'Use Register SEND Pupil to begin a guided onboarding workflow.';
    return 'Open Staff & Team Directory to review allocation and deployment coverage.';
  }
  if (role === 'parent' || role === 'parentplus') return 'Use the left navigation to open the matching family or strengths pathway screen.';
  if (role === 'ta') return 'Use the TA Hub to open the pupil support tools and record a quick classroom note.';
  if (role === 'child') return 'Open My Check-In to share your mood, energy, and what would help today.';
  return 'Use the left navigation to open the matching governance workspace and explore the live records.';
}

const DayInLifeTour: React.FC<{
  onClose: () => void;
  onExploreRole: () => void;
  userRole: RoleView;
  userName?: string;
  schoolName?: string;
}> = ({ onClose, onExploreRole, userRole, userName, schoolName }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [choiceMade, setChoiceMade] = useState(false);
  const step = DAY_IN_LIFE[stepIndex];
  const lens = PERSONA_LENSES[userRole] || PERSONA_LENSES.teacher;
  const StepIcon = step.icon;
  const isLast = stepIndex === DAY_IN_LIFE.length - 1;

  const advance = () => {
    if (isLast) return;
    setStepIndex((current) => current + 1);
    setChoiceMade(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-[2rem] max-w-6xl w-full shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[94vh]">
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-[#112533] via-[#1A3A4A] to-[#2A6B62] text-white flex items-center justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-mint font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              A shared day, seen together
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">{lens.title}</h2>
            <p className="text-xs text-white/70 mt-1 truncate">{userName || 'Your workspace'}{schoolName ? ` · ${schoolName}` : ''}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors" title="Close day journey" aria-label="Close day journey">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-3 border-b border-borderMain bg-cardSubtle flex items-center gap-2 overflow-x-auto no-scrollbar">
          {DAY_IN_LIFE.map((journeyStep, idx) => {
            const Icon = journeyStep.icon;
            const active = idx === stepIndex;
            const complete = idx < stepIndex;
            return (
              <button key={journeyStep.time} type="button" onClick={() => { setStepIndex(idx); setChoiceMade(false); }} className="flex items-center gap-2 min-w-max group">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'text-white shadow-md scale-105' : complete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-cardBg text-textDim border border-borderMain'}`} style={active ? { backgroundColor: journeyStep.color } : undefined}>
                  {complete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </span>
                {idx < DAY_IN_LIFE.length - 1 && <span className={`hidden sm:block w-8 h-px ${complete ? 'bg-emerald-400' : 'bg-borderMain'}`} />}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-textDim whitespace-nowrap">{stepIndex + 1} / {DAY_IN_LIFE.length}</span>
        </div>

        <div key={stepIndex} className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 p-5 sm:p-7 overflow-y-auto animate-tour-panel">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: step.color }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: step.color }} />
              {step.time} · {step.role}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: step.color }}>
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-textDim">{step.actor}</div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-textHead leading-tight">{step.title}</h3>
              </div>
            </div>
            <p className="text-sm text-textSub leading-relaxed mt-5 max-w-xl">{step.story}</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-5">
              <div className="p-3 rounded-2xl bg-cardSubtle border border-borderMain">
                <div className="text-[10px] uppercase tracking-wider font-bold text-textDim">What you&apos;re thinking</div>
                <p className="text-xs text-textMain font-medium leading-snug mt-1">{step.thinking}</p>
              </div>
              <div className="p-3 rounded-2xl bg-cardSubtle border border-borderMain">
                <div className="text-[10px] uppercase tracking-wider font-bold text-textDim">What you need to do</div>
                <p className="text-xs text-textMain font-medium leading-snug mt-1">{step.need}</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 mt-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">Why this is better</div>
              <p className="text-xs text-amber-950 dark:text-amber-100 font-medium leading-snug mt-1">{step.better}</p>
            </div>
            <div className="mt-5 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
              <div className="text-[10px] uppercase tracking-wider font-bold text-teal-800 dark:text-teal-300">The connective tissue</div>
              <p className="text-sm font-semibold text-teal-950 dark:text-teal-100 mt-1">{step.outcome}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-[#142B3C] to-[#0B132B] p-4 sm:p-5 text-white shadow-xl border border-white/10 self-center">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-mint font-bold">Shared timeline</div>
                <div className="text-sm font-serif font-bold mt-1">{step.action}</div>
              </div>
              <span className="text-[10px] font-mono text-white/50">LIVE STORY</span>
            </div>
            <div className="grid gap-2 mt-4">
              {step.items.map((item, idx) => (
                <div key={item.label} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] animate-tour-item" style={{ animationDelay: `${idx * 80}ms` }}>
                  <span className="text-xs text-white/50">{item.label}</span>
                  <span className="text-xs font-semibold text-right">{item.value}</span>
                </div>
              ))}
            </div>
            {!choiceMade ? (
              <button type="button" onClick={() => setChoiceMade(true)} className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal hover:bg-teal-medium text-white text-xs font-bold transition-all active:scale-[.98]">
                <Play className="w-3.5 h-3.5 fill-current" />
                {step.action}
              </button>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-emerald-400/15 border border-emerald-300/30 text-emerald-100 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Action connected to the shared timeline</div>
                <p className="text-[11px] text-white/60 mt-1">That small action gives the next person better context.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-7 py-3 border-t border-borderMain bg-cardSubtle flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-textDim text-center sm:text-left">One child · one shared language · no context lost</div>
          <div className="flex items-center gap-2">
            {isLast && <button type="button" onClick={() => { setStepIndex(0); setChoiceMade(false); }} className="px-3 py-2 rounded-xl text-xs font-semibold text-textDim hover:text-textMain hover:bg-cardBg transition-colors inline-flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Replay</button>}
            <button type="button" onClick={isLast ? onExploreRole : advance} disabled={!choiceMade && !isLast} className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-all active:scale-95">
              {isLast ? lens.cta : 'Continue the day'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PersonaTourModal: React.FC<PersonaTourModalProps> = ({
  isOpen,
  onClose,
  userRole = 'teacher',
  schoolName,
  userName,
}) => {
  // Current active step within this role's tour
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [tourMode, setTourMode] = useState<'journey' | 'role'>('journey');

  // Reset step index when modal opens or userRole changes
  useEffect(() => {
    if (isOpen) {
      setActiveStepIndex(0);
      setTourMode('journey');
    }
  }, [isOpen, userRole]);

  if (!isOpen) return null;

  const currentTour = ROLE_TOURS[userRole] || ROLE_TOURS.teacher;
  if (tourMode === 'journey') {
    return (
      <DayInLifeTour
        onClose={onClose}
        onExploreRole={() => setTourMode('role')}
        userRole={userRole}
        userName={userName}
        schoolName={schoolName}
      />
    );
  }
  const totalSteps = currentTour.steps.length;
  const currentStep = currentTour.steps[activeStepIndex] || currentTour.steps[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === totalSteps - 1;
  const stepAction = getTourStepAction(currentTour.role, currentStep.stepLabel);
  const previewBadge = currentStep.visualPreview.badge.replace('Focus Mode', 'Pupil Profile');

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setActiveStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3 bg-navy text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xs border border-white/20"
              style={{ backgroundColor: `${currentTour.themeColor}30` }}
            >
              {currentTour.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-serif text-white flex items-center gap-1.5">
                  <span>{currentTour.roleTitle} Tour</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal/30 text-mint font-semibold">
                    Step {activeStepIndex + 1} of {totalSteps}
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-white/70 line-clamp-1">
                {userName ? `${userName} · ` : ''}{schoolName ? `${schoolName} · ` : ''}{currentTour.mission}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Ribbon / Pills */}
        <div className="lg:hidden px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {currentTour.steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isCompleted = idx < activeStepIndex;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStepIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal text-white shadow-xs font-bold'
                    : isCompleted
                    ? 'bg-teal/10 text-teal-700 dark:text-teal-300 hover:bg-teal/20'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isActive
                      ? 'bg-white text-teal'
                      : isCompleted
                      ? 'bg-teal text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : step.stepNumber}
                </span>
                <span>{step.stepLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Content Area - Compact to eliminate vertical scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          <div className="grid lg:grid-cols-[190px_minmax(0,1fr)] gap-5">
            <nav className="hidden lg:block border-r border-gray-200 dark:border-slate-800 pr-4" aria-label="Tour steps">
              <div className="sticky top-0 space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-teal">Your journey</div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-snug">A quick tour of the moments that matter most in this workspace.</p>
                </div>
                <div className="relative space-y-1.5 before:absolute before:left-4 before:top-5 before:bottom-5 before:w-px before:bg-gray-200 dark:before:bg-slate-700">
                  {currentTour.steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === activeStepIndex;
                    const isCompleted = idx < activeStepIndex;
                    return (
                      <button
                        key={step.stepNumber}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={`relative w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive ? 'bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal/30' : 'hover:bg-gray-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <span className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-teal text-white shadow-sm' : isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className={`block text-[11px] font-bold truncate ${isActive ? 'text-teal-900 dark:text-teal-200' : 'text-gray-700 dark:text-slate-300'}`}>{step.stepLabel}</span>
                          <span className="block text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">Step {step.stepNumber}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
            <div key={currentStep.stepNumber} className="space-y-3 min-w-0 animate-tour-panel">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            <span>Getting started with {currentTour.personaName}</span>
            <span>{Math.round(((activeStepIndex + 1) / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-1 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal to-emerald-500 transition-all duration-300"
              style={{ width: `${((activeStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step Title Header */}
          <div>
            <div className="flex items-center gap-2 text-teal font-bold text-[10px] uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Step {currentStep.stepNumber}: {currentStep.stepLabel}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-gray-900 dark:text-white leading-tight">
              {currentStep.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
            <div className="w-8 h-8 rounded-xl bg-teal text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-teal-800 dark:text-teal-300">Try this next</div>
              <p className="text-xs text-teal-950 dark:text-teal-100 font-medium leading-snug">{stepAction}</p>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap">In the live app →</span>
          </div>

          {/* ⭐ High-Fidelity UI Visual Preview Card (2-Column Compact Layout) ⭐ */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-navy to-slate-900 text-white border border-slate-700/80 shadow-md space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStep.visualPreview.badgeColor}`}>
                {previewBadge}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Interactive Mock</span>
            </div>

            <div className="text-xs font-bold text-slate-200 font-serif">
              {currentStep.visualPreview.title}
            </div>

            {/* Simulated Data Items in 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-800/70 p-2 rounded-xl border border-slate-700/60">
              {currentStep.visualPreview.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-1 text-[11px] px-2.5 py-1.5 rounded-lg ${
                    item.accent
                      ? 'bg-teal/20 text-white border border-teal/40 font-semibold'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <span className="text-slate-400 font-medium truncate">{item.label}</span>
                  <span className="text-right font-medium text-[11px] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-mint/90 flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint flex-shrink-0" />
              <span>{currentStep.visualPreview.highlightText}</span>
            </div>
            <div className="flex items-start gap-1.5 text-[10px] text-slate-400 border-t border-slate-700/60 pt-2">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Illustrative preview: live pupil records and permissions apply in your dashboard.</span>
            </div>
          </div>

          {/* Operational Impact & Time Saved Callouts in Streamlined Dual Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-teal flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal">Operational Impact</div>
                <p className="text-[11px] text-gray-700 dark:text-slate-300 leading-snug">
                  {currentStep.whyItMatters}
                </p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Time Saved</div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug font-medium">
                  {currentStep.timeSaved}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          {/* Step Context */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-semibold text-gray-800 dark:text-slate-200">Tour</span>
            <span className="text-gray-400 dark:text-slate-600">·</span>
            <span>Step {activeStepIndex + 1} of {totalSteps}: {currentStep.stepLabel}</span>
          </div>

          {/* Navigation Buttons: Previous / Next / Finish */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isLastStep
                  ? 'bg-gradient-to-r from-teal to-emerald-600 hover:from-emerald-600 hover:to-teal text-white shadow-teal/20'
                  : 'bg-teal hover:bg-teal-dark text-white shadow-teal/20'
              }`}
            >
              <span>{isLastStep ? '🚀 Explore Live Dashboard' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
