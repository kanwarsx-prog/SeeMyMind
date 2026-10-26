import React, { useState } from 'react';
import { Child } from '../types';
import { Sparkles } from 'lucide-react';

interface ParentPlusViewProps {
  child: Child;
}

export const ParentPlusView: React.FC<ParentPlusViewProps> = ({ child }) => {
  const [activeCareer, setActiveCareer] = useState('gamedesign');
  const pupilName = child.preferred_name || child.first_name;

  const careers: Record<string, any> = {
    gamedesign: {
      title: '🎮 Game Designer',
      match: '92% match · R-I-A profile',
      salary: '£24-30k entry · £38k median · £55k+ senior',
      routes: 'Level 3 BTEC Games Development, degree apprenticeship (games/software), or BA/BSc Game Design',
      day: 'Designing levels, mechanics and systems; prototyping in engines like Unity or Unreal; playtesting with artists and engineers.',
      fit: 'Draws directly on spatial reasoning, systems thinking and hyperfocus - the exact combination Phoenix has demonstrated consistently.',
    },
    uxdesign: {
      title: '🖥️ UX / Product Designer',
      match: '81% match · A-I profile',
      salary: '£26-32k entry · £42k median · £60k+ senior',
      routes: 'Level 4 UX apprenticeship, portfolio-based entry, or a degree in Design, HCI or Computer Science',
      day: 'Researching how people use a product, sketching flows and interfaces, testing prototypes with real users.',
      fit: 'Strong match for visual-spatial skills and pattern recognition.',
    },
    dataviz: {
      title: '📊 Data Visualisation Specialist',
      match: '74% match · I-C profile',
      salary: '£26-32k entry · £39k median · £52k+ senior',
      routes: 'Data apprenticeship, degree in Computer Science/Statistics, or strong portfolio',
      day: 'Turning large datasets into clear, interactive visuals and dashboards that help people make decisions.',
      fit: 'Leans on analytical pattern recognition and hyperfocus.',
    },
  };

  const selected = careers[activeCareer];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-4 sm:p-6 bg-gradient-to-r from-gold-light via-cardBg to-mint-light dark:from-amber-950/20 dark:via-cardBg dark:to-teal-950/20 border-l-4 border-l-gold">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="text-base sm:text-xl font-serif font-bold text-navy dark:text-white">Parent Plus · Future Pathways & Careers</h2>
              <span className="bg-gold text-navy font-bold text-[10px] px-2 py-0.5 rounded-full">Year 10+</span>
            </div>
            <p className="text-xs text-textSub dark:text-slate-300 mt-1">
              Translating {pupilName}'s strengths, hyperfocus, and spatial reasoning into real-world career destinations.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-bold text-navy dark:text-white">RIASEC Profile: Realistic / Investigative</div>
            <div className="text-[10px] text-textDim dark:text-slate-400">Validated by classroom observations</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Career Matches List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Ranked Career Matches</h3>
          {Object.entries(careers).map(([key, c]) => (
            <div
              key={key}
              onClick={() => setActiveCareer(key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeCareer === key
                  ? 'bg-cardBg border-gold shadow-md ring-2 ring-gold/40'
                  : 'bg-cardSubtle border-borderMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-navy dark:text-white">{c.title}</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{c.match.split('·')[0]}</span>
              </div>
              <p className="text-[11px] text-textDim dark:text-slate-400 mt-1">{c.salary.split('·')[0]} · {c.match.split('·')[1]}</p>
            </div>
          ))}
        </div>

        {/* Selected Career Deep Dive */}
        <div className="lg:col-span-7">
          <div className="card p-6 space-y-5 border-t-4 border-t-gold">
            <div>
              <h3 className="text-lg font-serif font-bold text-navy dark:text-white">{selected.title}</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">{selected.match}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 mb-1">UK Salary Progression</div>
                <div className="p-3 bg-cardSubtle border border-borderMain rounded-xl font-bold text-navy dark:text-white">{selected.salary}</div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 mb-1">Recommended Entry Routes</div>
                <div className="p-3 bg-cardSubtle border border-borderMain rounded-xl text-textSub dark:text-slate-300 leading-relaxed">{selected.routes}</div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 mb-1">A Day in the Role</div>
                <div className="p-3 bg-cardSubtle border border-borderMain rounded-xl text-textSub dark:text-slate-300 leading-relaxed">{selected.day}</div>
              </div>

              <div className="p-4 bg-mint/10 dark:bg-teal-950/30 border border-mint/40 dark:border-teal-800/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal dark:text-teal-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why {pupilName} Fits This Role</span>
                </div>
                <p className="text-xs text-navy/90 dark:text-slate-200 leading-relaxed">{selected.fit}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
