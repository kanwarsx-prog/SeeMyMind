import React from 'react';

interface MarkdownTextProps {
  content?: string;
  darkSurface?: boolean;
  className?: string;
}

const renderInline = (text: string, darkSurface: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={index} className={darkSurface ? 'font-bold text-white' : 'font-semibold text-textHead'}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className={darkSurface ? 'rounded bg-white/15 px-1.5 py-0.5 font-mono text-[11px] text-white' : 'rounded border border-borderMain bg-cardSubtle px-1.5 py-0.5 font-mono text-[11px] text-teal'}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, darkSurface = false, className = '' }) => {
  if (!content) return null;

  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/^\s*[*_]?Citations?:?/i.test(line.trim()));

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;

        const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
          return (
            <h4 key={index} className={`pt-1 text-[13px] font-bold tracking-wide ${darkSurface ? 'text-white' : 'text-textHead'}`}>
              {renderInline(heading[1], darkSurface)}
            </h4>
          );
        }

        const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={index} className={`flex items-start gap-2 text-[13px] leading-relaxed ${darkSurface ? 'text-white/90' : 'text-textMain'}`}>
              <span className={`mt-[0.55rem] h-1.5 w-1.5 flex-shrink-0 rounded-full ${darkSurface ? 'bg-mint' : 'bg-teal'}`} />
              <span>{renderInline(bullet[1], darkSurface)}</span>
            </div>
          );
        }

        const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numbered) {
          return (
            <div key={index} className={`flex items-start gap-2 text-[13px] leading-relaxed ${darkSurface ? 'text-white/90' : 'text-textMain'}`}>
              <span className={`min-w-4 font-bold ${darkSurface ? 'text-mint' : 'text-teal'}`}>{numbered[1]}.</span>
              <span>{renderInline(numbered[2], darkSurface)}</span>
            </div>
          );
        }

        return (
          <p key={index} className={`text-[13px] leading-relaxed ${darkSurface ? 'text-white/90' : 'text-textMain'}`}>
            {renderInline(trimmed, darkSurface)}
          </p>
        );
      })}
    </div>
  );
};
