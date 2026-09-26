import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Sparkles, CheckCircle2, Camera, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Quest } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerLightImpact, triggerMediumImpact } from '../lib/capacitorBridge';

interface QuestRadialProgressProps {
  quest: Quest;
  onOpenVerifyModal: (quest: Quest) => void;
  questsList: Quest[];
  onSelectQuest: (quest: Quest) => void;
  hasPhotoAttached?: boolean;
}

export const QuestRadialProgress: React.FC<QuestRadialProgressProps> = ({
  quest,
  onOpenVerifyModal,
  questsList,
  onSelectQuest,
  hasPhotoAttached = false,
}) => {
  const { t, language } = useLanguage();
  const svgRef = useRef<SVGSVGElement | null>(null);

  // User checklist steps for this specific quest (saved per quest ID in localStorage)
  const [stepActionDone, setStepActionDone] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(`quest_step_action_${quest.id}`);
      return quest.completed || stored === 'true';
    } catch {
      return quest.completed || false;
    }
  });

  // Calculate percentage:
  // 1. Briefing: 25% (always unlocked since quest is open)
  // 2. Action Executed: +25% (50%)
  // 3. Proof Photo attached: +25% (75%)
  // 4. Karin AI verified: 100%
  const currentPercentage = useMemo(() => {
    if (quest.completed) return 100;
    let pct = 25; // Base: Quest started & briefing read
    if (stepActionDone) pct += 30; // 55%
    if (hasPhotoAttached) pct += 25; // 80%
    return Math.min(pct, 90);
  }, [quest.completed, stepActionDone, hasPhotoAttached]);

  // Sync step action state when quest changes
  useEffect(() => {
    if (quest.completed) {
      setStepActionDone(true);
    } else {
      try {
        const stored = localStorage.getItem(`quest_step_action_${quest.id}`);
        setStepActionDone(stored === 'true');
      } catch {
        setStepActionDone(false);
      }
    }
  }, [quest.id, quest.completed]);

  const toggleActionStep = () => {
    if (quest.completed) return;
    triggerLightImpact();
    const nextVal = !stepActionDone;
    setStepActionDone(nextVal);
    try {
      localStorage.setItem(`quest_step_action_${quest.id}`, String(nextVal));
    } catch {
      // ignore
    }
  };

  // Render D3 Radial Progress Gauge
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 140;
    const height = 140;
    const margin = 8;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius - 12;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for gradients & glow filters
    const defs = svg.append('defs');

    // Neon Arc Gradient (Emerald Green to Arcade Gold)
    const gradient = defs
      .append('linearGradient')
      .attr('id', `radial-gradient-${quest.id}`)
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2BD97F'); // Emerald Neon

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', quest.completed ? '#2BD97F' : '#FFD43F'); // Gold or full Green

    // Glow filter
    const filter = defs
      .append('filter')
      .attr('id', `arcade-glow-${quest.id}`)
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Arc Generator for Track & Fill
    const arcGenerator = d3
      .arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6);

    // 1. Background Track Arc (Dark green slot with retro border)
    g.append('path')
      .datum({
        startAngle: 0,
        endAngle: 2 * Math.PI,
      })
      .attr('d', arcGenerator as any)
      .attr('fill', '#062316')
      .attr('stroke', '#000000')
      .attr('stroke-width', 2);

    // 2. Milestone Tick Marks at 25%, 50%, 75%
    const tickPercentages = [0.25, 0.5, 0.75];
    tickPercentages.forEach((pct) => {
      const angle = pct * 2 * Math.PI - Math.PI / 2;
      const x1 = Math.cos(angle) * (innerRadius - 1);
      const y1 = Math.sin(angle) * (innerRadius - 1);
      const x2 = Math.cos(angle) * (radius + 1);
      const y2 = Math.sin(angle) * (radius + 1);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#000000')
        .attr('stroke-width', 2);
    });

    // 3. Foreground Progress Arc with D3 Tween Animation
    const targetEndAngle = (currentPercentage / 100) * 2 * Math.PI;

    const progressPath = g
      .append('path')
      .datum({ startAngle: 0, endAngle: 0 })
      .attr('fill', `url(#radial-gradient-${quest.id})`)
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5)
      .style('filter', `url(#arcade-glow-${quest.id})`);

    // Smooth transition interpolating angle
    progressPath
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attrTween('d', (d: any) => {
        const interpolate = d3.interpolate(d.endAngle, targetEndAngle);
        return (t: number) => {
          d.endAngle = interpolate(t);
          return arcGenerator(d) || '';
        };
      });

    // 4. Subtle inner ring border for 90s console feel
    g.append('circle')
      .attr('r', innerRadius - 2)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2 2');
  }, [currentPercentage, quest.id, quest.completed]);

  const questTitle = language === 'ar' ? quest.title_ar : quest.title_en;
  const isComplete = quest.completed;

  return (
    <div className="bg-[#103D29] border-3 border-black rounded-2xl p-3 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
      {/* Header bar with quest selector */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-black/50 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#FFD43F] animate-pulse" />
          <span className="text-[11px] font-black text-[#FFD43F] uppercase tracking-wider">
            {language === 'ar' ? 'المهمة البيئية النشطة' : 'ACTIVE QUEST GAUGE'}
          </span>
        </div>

        {/* Quest Switcher Dropdown */}
        <div className="relative">
          <select
            value={quest.id}
            onChange={(e) => {
              const found = questsList.find((q) => q.id === e.target.value);
              if (found) {
                triggerLightImpact();
                onSelectQuest(found);
              }
            }}
            className="bg-[#062316] text-[#A7F3D0] border-2 border-black rounded-lg text-[10px] font-black px-2 py-1 pr-6 appearance-none focus:outline-hidden cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:text-white"
          >
            {questsList.map((q) => (
              <option key={q.id} value={q.id} className="bg-[#103D29] text-white">
                {q.completed ? '✓ ' : '○ '}
                {language === 'ar' ? q.title_ar : q.title_en}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[#FFD43F] text-[9px]">
            ▼
          </div>
        </div>
      </div>

      {/* Main Radial Gauge & Info Section */}
      <div className="flex items-center gap-3">
        {/* D3 SVG Radial Progress Bar */}
        <div className="relative shrink-0 flex items-center justify-center w-[120px] h-[120px]">
          <svg
            ref={svgRef}
            viewBox="0 0 140 140"
            className="w-[120px] h-[120px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />

          {/* Center Gauge Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl leading-none">{quest.icon}</span>
            <span className="text-base font-black text-white font-mono mt-0.5 tracking-tight leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              {currentPercentage}%
            </span>
            <span className="text-[8px] font-black text-[#FFD43F] uppercase tracking-wide leading-none mt-0.5">
              {isComplete
                ? language === 'ar'
                  ? 'مكتملة'
                  : 'COMPLETED'
                : currentPercentage >= 75
                ? language === 'ar'
                  ? 'جاهز للاعتماد'
                  : 'READY'
                : language === 'ar'
                ? 'قيد الإنجاز'
                : 'IN PROGRESS'}
            </span>
          </div>
        </div>

        {/* Quest Details & Milestones Checklist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-extrabold text-sm text-white truncate leading-tight">
              {questTitle}
            </h3>
            <span className="shrink-0 bg-[#FFB443] text-black text-[10px] font-black px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              +{quest.points} {t('pts')}
            </span>
          </div>

          {/* Interactive 4-Stage Quest Checkpoints */}
          <div className="space-y-1 mb-2">
            {/* Step 1: Briefing Read */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#A7F3D0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2BD97F] shrink-0" />
              <span className="line-through opacity-80 truncate">
                {language === 'ar' ? '١. مراجعة إرشادات المهمة' : '1. Quest briefing noted'}
              </span>
            </div>

            {/* Step 2: Eco Action Performed (Interactive toggle) */}
            <button
              onClick={toggleActionStep}
              disabled={isComplete}
              className={`w-full flex items-center justify-between text-left p-1 rounded-md text-[10px] font-bold transition-all border ${
                stepActionDone
                  ? 'bg-[#062316] text-[#2BD97F] border-[#2BD97F]/40'
                  : 'bg-black/30 text-white/90 border-black hover:border-[#FFD43F]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] font-black shrink-0 ${
                    stepActionDone ? 'bg-[#2BD97F] text-black border-black' : 'border-neutral-400'
                  }`}
                >
                  {stepActionDone ? '✓' : ''}
                </span>
                <span className="truncate">
                  {language === 'ar' ? '٢. نفذت العمل البيئي ميدانياً' : '2. Executed eco action'}
                </span>
              </div>
              <span className="text-[8px] text-[#FFD43F] font-mono shrink-0">+30%</span>
            </button>

            {/* Step 3: Photo Verification */}
            <div className="flex items-center justify-between text-[10px] font-bold px-1 text-neutral-300">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] font-black shrink-0 ${
                    isComplete ? 'bg-[#2BD97F] text-black border-black' : 'border-neutral-500'
                  }`}
                >
                  {isComplete ? '✓' : ''}
                </span>
                <span className="truncate">
                  {language === 'ar' ? '٣. تصوير الإثبات واعتماد كارين' : '3. Karin AI inspection'}
                </span>
              </div>
              <span className="text-[8px] text-[#FFB443] font-mono shrink-0">+45%</span>
            </div>
          </div>

          {/* Action Trigger Button */}
          {isComplete ? (
            <div className="bg-[#062316] border border-[#2BD97F] text-[#2BD97F] text-center py-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('questStatusCompleted')}</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenVerifyModal(quest)}
              className="retro-btn w-full bg-[#2BD97F] hover:bg-[#25c472] text-black font-black text-xs py-1.5 px-2.5 rounded-xl border-2 border-black flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {currentPercentage >= 55
                  ? language === 'ar'
                    ? 'التقاط الإثبات والاعتماد'
                    : 'Submit Evidence'
                  : language === 'ar'
                  ? 'تفاصيل المهمة والإثبات'
                  : 'Submit Proof'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
