import { useState, useEffect, useRef } from 'react';

interface FakeTerminalProps {
  initialLogs: string[];
  commands: Record<string, string>;
  accentColor?: string;
}

export const FakeTerminal: React.FC<FakeTerminalProps> = ({
  initialLogs,
  commands,
  accentColor = '#14b8a6',
}) => {
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'system'; text: string }>>(
    () => initialLogs.map((log) => ({ type: 'system', text: log }))
  );
  const [inputVal, setInputVal] = useState('');
  const [commandIndex, setCommandIndex] = useState<number>(-1);
  const [pastInputs, setPastInputs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    setPastInputs((prev) => [...prev, trimmed]);
    setCommandIndex(-1);

    if (trimmed.toLowerCase() === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    const newEntries: Array<{ type: 'input' | 'output' | 'system'; text: string }> = [
      { type: 'input', text: trimmed },
    ];

    // Check exact or partial match in commands
    const matched = Object.entries(commands).find(
      ([key]) => key.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      newEntries.push({ type: 'output', text: matched[1] });
    } else {
      newEntries.push({
        type: 'output',
        text: `zsh: command not found: "${trimmed}". Type "help" to view executable commands.`,
      });
    }

    setHistory((prev) => [...prev, ...newEntries]);
    setInputVal('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pastInputs.length === 0) return;
      const nextIdx = commandIndex === -1 ? pastInputs.length - 1 : Math.max(0, commandIndex - 1);
      setCommandIndex(nextIdx);
      setInputVal(pastInputs[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandIndex !== -1) {
        const nextIdx = commandIndex + 1;
        if (nextIdx >= pastInputs.length) {
          setCommandIndex(-1);
          setInputVal('');
        } else {
          setCommandIndex(nextIdx);
          setInputVal(pastInputs[nextIdx]);
        }
      }
    }
  };

  const quickCommands = Object.keys(commands);

  return (
    <div className="flex flex-col h-full bg-stone-950/95 border border-stone-800 rounded-lg overflow-hidden font-mono text-xs sm:text-sm shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-stone-400 font-medium ml-2 flex items-center gap-1.5 text-xs">
            <span className="nf-glyph text-stone-400">{'\uf120'}</span>
            guest@deployedreject-node: ~
          </span>
        </div>
        <div className="text-[11px] text-stone-500 hidden sm:block">
          Interactive Mock TUI | Full Tab &amp; History
        </div>
      </div>

      {/* Quick Action Chips for Easy Clicking / Mobile Discovery */}
      <div className="px-3 py-1.5 bg-stone-900/60 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] text-stone-300">
        <span className="text-stone-500 shrink-0 flex items-center gap-1">
          <span className="nf-glyph text-amber-400">{'\uf0e7'}</span> Quick runs:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleCommand(cmd)}
            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-stone-500 shrink-0 transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
        <button
          onClick={() => handleCommand('clear')}
          className="px-2 py-0.5 rounded bg-stone-800/50 hover:bg-red-950/50 text-stone-400 hover:text-red-300 border border-stone-700/50 shrink-0 transition-colors"
        >
          clear
        </button>
      </div>

      {/* Terminal Logs & Output */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 select-text leading-relaxed text-stone-200 cursor-text min-h-[220px]"
      >
        {history.map((item, idx) => {
          if (item.type === 'input') {
            return (
              <div key={idx} className="flex items-start space-x-2 text-stone-100">
                <span className="text-emerald-400 shrink-0 font-bold nf-glyph">{'\uf054'}</span>
                <span className="font-semibold">{item.text}</span>
              </div>
            );
          }
          if (item.type === 'system') {
            return (
              <div key={idx} className="text-stone-400 font-mono">
                {item.text}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className="text-stone-300 whitespace-pre-wrap pl-3 border-l-2 py-0.5 font-mono"
              style={{ borderColor: accentColor }}
            >
              {item.text}
            </div>
          );
        })}

        {/* Input Line */}
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-emerald-400 font-bold shrink-0 nf-glyph">{'\uf054'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type 'help' or click quick buttons..."
            className="flex-1 bg-transparent outline-none text-emerald-300 font-mono caret-emerald-400 placeholder:text-stone-600 text-xs sm:text-sm"
          />
          <button
            onClick={() => handleCommand(inputVal)}
            className="p-1 text-stone-500 hover:text-emerald-400 transition-colors nf-glyph"
            title="Execute"
          >
            {'\uf061'}
          </button>
        </div>
      </div>
    </div>
  );
};

