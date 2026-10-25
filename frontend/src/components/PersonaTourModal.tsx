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
        stepLabel: 'Classroom Hub',
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
        stepLabel: '1:1 Pupil Focus',
        title: 'Universal 1:1 Pupil Focus & In-the-Moment Calming Tools',
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
        stepLabel: 'Subject Adaptations',
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
        stepLabel: 'Provision Register',
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
        stepLabel: 'Statutory Reviews',
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
        stepLabel: 'Pupil Registration',
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
        stepLabel: 'Staff Deployment',
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
        stepLabel: 'Read-Receipts',
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

export const PersonaTourModal: React.FC<PersonaTourModalProps> = ({
  isOpen,
  onClose,
  userRole = 'teacher',
  schoolName,
  userName,
}) => {
  // Current active step within this role's tour
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Reset step index when modal opens or userRole changes
  useEffect(() => {
    if (isOpen) {
      setActiveStepIndex(0);
    }
  }, [isOpen, userRole]);

  if (!isOpen) return null;

  const currentTour = ROLE_TOURS[userRole] || ROLE_TOURS.teacher;
  const totalSteps = currentTour.steps.length;
  const currentStep = currentTour.steps[activeStepIndex] || currentTour.steps[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === totalSteps - 1;

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
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-white dark:bg-slate-900">
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

          {/* ⭐ High-Fidelity UI Visual Preview Card (2-Column Compact Layout) ⭐ */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-navy to-slate-900 text-white border border-slate-700/80 shadow-md space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStep.visualPreview.badgeColor}`}>
                {currentStep.visualPreview.badge}
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
