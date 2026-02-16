import React from 'react';
import './EthereaAgent.css';

type AgentExpression = 'neutral' | 'happy' | 'thinking' | 'listening' | 'concern';

interface EthereaAgentProps {
  expression: AgentExpression;
  mouthOpen: number;
  isSpeaking: boolean;
}

const EthereaAgent: React.FC<EthereaAgentProps> = ({ expression, mouthOpen, isSpeaking }) => {
  const containerClasses = ['etherea-agent-container', `expression-${expression}`, isSpeaking ? 'is-speaking' : ''].join(' ').trim();

  return (
    <div className={containerClasses}>
      <svg className="etherea-avatar" viewBox="0 0 280 320" role="img" aria-label="Etherea avatar">
        <defs>
          <radialGradient id="skinGradient" cx="48%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#ffe6de" />
            <stop offset="55%" stopColor="#f7c8bb" />
            <stop offset="100%" stopColor="#dfa391" />
          </radialGradient>
          <radialGradient id="hairGradient" cx="50%" cy="20%" r="90%">
            <stop offset="0%" stopColor="#7359d6" />
            <stop offset="100%" stopColor="#2f255f" />
          </radialGradient>
          <radialGradient id="irisGradient" cx="32%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#9cd3ff" />
            <stop offset="52%" stopColor="#5b88f0" />
            <stop offset="100%" stopColor="#203a7d" />
          </radialGradient>
          <filter id="softBlush" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
          <filter id="faceDepth" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.34" />
          </filter>
        </defs>

        <ellipse className="avatar-aura" cx="140" cy="160" rx="112" ry="142" />

        <g className="head-group">
          <path
            className="hair-back"
            d="M56 132c0-62 44-98 84-98s84 28 84 99c0 17-4 35-8 49l-19-8c2-13 3-22 3-33 0-45-27-71-60-71s-62 27-62 72c0 11 2 22 5 34l-21 7c-4-13-6-31-6-51z"
          />
          <ellipse className="face" cx="140" cy="164" rx="80" ry="92" />
          <ellipse className="blush" cx="92" cy="176" rx="22" ry="12" />
          <ellipse className="blush" cx="188" cy="176" rx="22" ry="12" />

          <ellipse className="nose" cx="140" cy="168" rx="8" ry="13" />

          <g className="eyes" filter="url(#faceDepth)">
            <g className="eye left-eye">
              <ellipse className="sclera" cx="108" cy="142" rx="20" ry="16" />
              <ellipse className="iris" cx="108" cy="144" rx="12" ry="13" />
              <ellipse className="pupil" cx="108" cy="145" rx="5" ry="6" />
              <ellipse className="catchlight primary" cx="104" cy="139" rx="3.5" ry="2.8" />
              <ellipse className="catchlight secondary" cx="112" cy="146" rx="1.8" ry="1.6" />
              <path className="eyelid" d="M88 143c5-11 36-12 40 0" />
            </g>
            <g className="eye right-eye">
              <ellipse className="sclera" cx="172" cy="142" rx="20" ry="16" />
              <ellipse className="iris" cx="172" cy="144" rx="12" ry="13" />
              <ellipse className="pupil" cx="172" cy="145" rx="5" ry="6" />
              <ellipse className="catchlight primary" cx="168" cy="139" rx="3.5" ry="2.8" />
              <ellipse className="catchlight secondary" cx="176" cy="146" rx="1.8" ry="1.6" />
              <path className="eyelid" d="M152 143c5-11 36-12 40 0" />
            </g>
          </g>

          <path className="mouth" style={{ transform: `scaleY(${mouthOpen})` }} d="M112 214c12 12 44 12 56 0" />
          <path className="hair-front" d="M69 112c22-31 48-43 72-43 29 0 52 12 73 42-18-10-40-16-73-16-30 0-55 4-72 17z" />
        </g>
      </svg>
    </div>
  );
};

export default EthereaAgent;
