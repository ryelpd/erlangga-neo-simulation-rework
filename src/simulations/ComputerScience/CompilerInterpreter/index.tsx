import { useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

interface Token {
  type: string;
  value: string | number;
  meta: {
    color: string;
    text: string;
    border: string;
  };
}

interface ASTNode {
  id: string;
  type: string;
  op?: string;
  value?: number;
  left?: ASTNode;
  right?: ASTNode;
  x?: number;
  y?: number;
}

interface ExecutionStep {
  node: ASTNode;
  val: number;
}

const TOKEN_TYPES = {
  NUM: { color: 'bg-yellow-300', text: 'text-yellow-900', border: 'border-yellow-600' },
  OP: { color: 'bg-sky-300', text: 'text-sky-900', border: 'border-sky-600' },
  PAR: { color: 'bg-rose-300', text: 'text-rose-900', border: 'border-rose-600' },
  EOF: { color: 'bg-slate-300', text: 'text-slate-600', border: 'border-slate-500' }
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) { i++; continue; }
    if (/\d/.test(char)) {
      let numStr = '';
      while (i < input.length && (/\d/.test(input[i]) || input[i] === '.')) {
        numStr += input[i];
        i++;
      }
      if (isNaN(parseFloat(numStr))) throw new Error(`Lex Error: Angka tidak valid '${numStr}'`);
      tokens.push({ type: 'NUM', value: parseFloat(numStr), meta: TOKEN_TYPES.NUM });
      continue;
    }
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OP', value: char, meta: TOKEN_TYPES.OP });
      i++; continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: 'PAR', value: char, meta: TOKEN_TYPES.PAR });
      i++; continue;
    }
    throw new Error(`Lex Error: Karakter tidak dikenal '${char}'`);
  }
  tokens.push({ type: 'EOF', value: 'EOF', meta: TOKEN_TYPES.EOF });
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private nodeIdCounter: number = 1;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private eat(type: string, value: string | null = null): Token {
    const token = this.tokens[this.pos];
    if (token.type === type && (value === null || token.value === value)) {
      this.pos++;
      return token;
    }
    throw new Error(`Syntax Error: Diharapkan '${value || type}', mendapat '${token.value}'`);
  }

  parse(): ASTNode {
    const ast = this.expr();
    if (this.tokens[this.pos].type !== 'EOF') {
      throw new Error(`Syntax Error: Token sisa '${this.tokens[this.pos].value}' di luar operasi.`);
    }
    return ast;
  }

  private expr(): ASTNode {
    let node = this.term();
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === 'OP' && ['+', '-'].includes(this.tokens[this.pos].value as string)) {
      const token = this.tokens[this.pos];
      this.eat('OP');
      node = { id: `node_${this.nodeIdCounter++}`, type: 'BinaryOp', op: token.value as string, left: node, right: this.term() };
    }
    return node;
  }

  private term(): ASTNode {
    let node = this.factor();
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === 'OP' && ['*', '/'].includes(this.tokens[this.pos].value as string)) {
      const token = this.tokens[this.pos];
      this.eat('OP');
      node = { id: `node_${this.nodeIdCounter++}`, type: 'BinaryOp', op: token.value as string, left: node, right: this.factor() };
    }
    return node;
  }

  private factor(): ASTNode {
    const token = this.tokens[this.pos];
    if (token.type === 'OP' && token.value === '-') {
      this.eat('OP', '-');
      return { id: `node_${this.nodeIdCounter++}`, type: 'UnaryOp', op: '-', right: this.factor() };
    }
    if (token.type === 'NUM') {
      this.eat('NUM');
      return { id: `node_${this.nodeIdCounter++}`, type: 'Literal', value: token.value as number };
    } else if (token.type === 'PAR' && token.value === '(') {
      this.eat('PAR', '(');
      const node = this.expr();
      this.eat('PAR', ')');
      return node;
    }
    throw new Error(`Syntax Error: Token tidak terduga '${token.value}'`);
  }
}

function getAstDepth(node: ASTNode | undefined): number {
  if (!node) return 0;
  if (node.type === 'Literal') return 1;
  if (node.type === 'UnaryOp') return 1 + getAstDepth(node.right);
  return 1 + Math.max(getAstDepth(node.left), getAstDepth(node.right));
}

function calculateTreeLayout(node: ASTNode | undefined, x: number, y: number, maxDepth: number, currentDepth: number): void {
  if (!node) return;
  node.x = x;
  node.y = y;
  if (node.type === 'BinaryOp') {
    const spacing = Math.pow(1.8, maxDepth - currentDepth) * 30;
    calculateTreeLayout(node.left, x - spacing, y + 70, maxDepth, currentDepth + 1);
    calculateTreeLayout(node.right, x + spacing, y + 70, maxDepth, currentDepth + 1);
  } else if (node.type === 'UnaryOp') {
    calculateTreeLayout(node.right, x, y + 70, maxDepth, currentDepth + 1);
  }
}

function evaluateAST(node: ASTNode, steps: ExecutionStep[]): number {
  if (node.type === 'Literal') {
    steps.push({ node, val: node.value! });
    return node.value!;
  }
  if (node.type === 'UnaryOp') {
    const rightVal = evaluateAST(node.right!, steps);
    const res = node.op === '-' ? -rightVal : rightVal;
    steps.push({ node, val: res });
    return res;
  }
  if (node.type === 'BinaryOp') {
    const leftVal = evaluateAST(node.left!, steps);
    const rightVal = evaluateAST(node.right!, steps);
    let res: number;
    switch (node.op) {
      case '+': res = leftVal + rightVal; break;
      case '-': res = leftVal - rightVal; break;
      case '*': res = leftVal * rightVal; break;
      case '/': res = leftVal / rightVal; break;
      default: res = 0;
    }
    steps.push({ node, val: res });
    return res;
  }
  return 0;
}

interface NodeResult {
  [key: string]: number;
}

const presets = [
  '-3 + 5 * 2',
  '10 / ( 2 + 3 )',
  '8 + 2 * 5 - 3'
];

export default function CompilerInterpreter() {
  const [inputCode, setInputCode] = useState('-3 + 5 * 2');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [nodeResults, setNodeResults] = useState<NodeResult>({});
  const [finalResult, setFinalResult] = useState<string>('?');
  const [statusMsg, setStatusMsg] = useState('Menunggu proses kompilasi...');
  const [isError, setIsError] = useState(false);
  const [btnParseDisabled, setBtnParseDisabled] = useState(true);
  const [btnEvalDisabled, setBtnEvalDisabled] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const resetPipeline = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setTokens([]);
    setAst(null);
    setNodeResults({});
    setFinalResult('?');
    setStatusMsg('Menunggu proses kompilasi...');
    setIsError(false);
    setBtnParseDisabled(true);
    setBtnEvalDisabled(true);
    setEvaluating(false);
  }, []);

  const handleLex = () => {
    resetPipeline();
    try {
      const newTokens = tokenize(inputCode);
      setTokens(newTokens);
      setStatusMsg('Lexical Analysis Selesai. Token siap di-parse.');
      setBtnParseDisabled(false);
    } catch (err) {
      setStatusMsg((err as Error).message);
      setIsError(true);
    }
  };

  const handleParse = () => {
    setAst(null);
    setNodeResults({});
    setFinalResult('?');
    try {
      const parser = new Parser(tokens);
      const newAst = parser.parse();
      const maxDepth = getAstDepth(newAst);
      calculateTreeLayout(newAst, 500, 40, maxDepth, 1);
      setAst(newAst);
      
      const replacer = (_key: string, value: unknown) => {
        if (['id', 'x', 'y'].includes(_key)) return undefined;
        return value;
      };
      setStatusMsg('// JSON Output AST (Keluaran Parser)\n' + JSON.stringify(newAst, replacer, 2));
      setBtnEvalDisabled(false);
    } catch (err) {
      setStatusMsg((err as Error).message);
      setIsError(true);
    }
  };

  const handleEval = () => {
    if (!ast) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setNodeResults({});
    setFinalResult('...');
    setEvaluating(true);
    
    const steps: ExecutionStep[] = [];
    evaluateAST(ast, steps);
    
    let delay = 0;
    steps.forEach((step, idx) => {
      const to = setTimeout(() => {
        setNodeResults(prev => ({ ...prev, [step.node.id]: step.val }));
        if (idx === steps.length - 1) {
          setFinalResult(step.val.toString());
          setEvaluating(false);
        }
      }, delay);
      timeoutsRef.current.push(to);
      delay += 800;
    });
  };

  const renderTokens = () => {
    if (tokens.length === 0) {
      return <span className="text-xs font-bold text-slate-400 italic">Klik Tokenize untuk memulai...</span>;
    }
    return tokens.map((t, i) => (
      <div
        key={i}
        className={`shrink-0 px-3 py-1 border-2 font-black font-mono text-sm shadow-[2px_2px_0px_#000] ${t.meta.color} ${t.meta.text} ${t.meta.border}`}
        style={{ animation: `popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`, animationDelay: `${i * 0.05}s`, opacity: 0 }}
      >
        {t.value}
      </div>
    ));
  };

  const renderAST = () => {
    if (!ast) return null;
    
    const edges: ReactNode[] = [];
    const nodes: ReactNode[] = [];
    let delay = 0;

    const drawNode = (node: ASTNode) => {
      if (node.type === 'BinaryOp') {
        if (node.left) {
          edges.push(
            <line
              key={`edge-${node.id}-l`}
              x1={node.x}
              y1={node.y}
              x2={node.left.x}
              y2={(node.left.y || 0) - 15}
              stroke="#475569"
              strokeWidth={4}
              className="edge-draw"
              style={{ animationDelay: `${delay}s` }}
            />
          );
          drawNode(node.left);
        }
        if (node.right) {
          edges.push(
            <line
              key={`edge-${node.id}-r`}
              x1={node.x}
              y1={node.y}
              x2={node.right.x}
              y2={(node.right.y || 0) - 15}
              stroke="#475569"
              strokeWidth={4}
              className="edge-draw"
              style={{ animationDelay: `${delay}s` }}
            />
          );
          drawNode(node.right);
        }
      } else if (node.type === 'UnaryOp' && node.right) {
        edges.push(
          <line
            key={`edge-${node.id}-r`}
            x1={node.x}
            y1={node.y}
            x2={node.right.x}
            y2={(node.right.y || 0) - 15}
            stroke="#475569"
            strokeWidth={4}
            className="edge-draw"
            style={{ animationDelay: `${delay}s` }}
          />
        );
        drawNode(node.right);
      }

      const bgColor = node.type === 'BinaryOp' ? '#34d399' : (node.type === 'UnaryOp' ? '#fb923c' : '#fde047');
      const isEvaluated = nodeResults[node.id] !== undefined;
      const displayLabel = (node.type === 'BinaryOp' || node.type === 'UnaryOp') ? node.op : node.value;
      const result = nodeResults[node.id];
      const textStr = result !== undefined ? result.toString() : '';
      const boxWidth = Math.max(30, textStr.length * 10 + 10);

      nodes.push(
        <g
          key={node.id}
          id={`svg_${node.id}`}
          transform={`translate(${node.x}, ${node.y})`}
          className={`node-draw ${isEvaluated ? 'eval-glow' : ''}`}
          style={{ animationDelay: `${delay}s` }}
        >
          <rect
            className="node-rect"
            x={-25}
            y={-15}
            width={50}
            height={30}
            rx={6}
            fill={isEvaluated ? '#cbd5e1' : bgColor}
            stroke="#000"
            strokeWidth={3}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontFamily="Space Grotesk"
            fontWeight={900}
            fontSize={16}
          >
            {displayLabel}
          </text>
          {result !== undefined && (
            <>
              <rect
                x={-(boxWidth / 2)}
                y={-30}
                width={boxWidth}
                height={20}
                rx={10}
                fill="#1e293b"
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={0}
                y={-16}
                textAnchor="middle"
                fontFamily="Space Grotesk"
                fontWeight={900}
                fontSize={12}
                fill="#38bdf8"
              >
                {result}
              </text>
            </>
          )}
        </g>
      );
      delay += 0.1;
    };

    drawNode(ast);
    return (
      <>
        <g id="astEdges">{edges}</g>
        <g id="astNodes">{nodes}</g>
      </>
    );
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">ILMU KOMPUTER</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: COMPILER & INTERPRETER
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Lexical Analysis, Parsing, & Abstract Syntax Tree (AST)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Source Code
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">Tulis Ekspresi Matematika</label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => { setInputCode(e.target.value); resetPipeline(); }}
                className="neo-input px-4 py-3 w-full text-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black rounded-lg focus:bg-yellow-200 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {presets.map((code, i) => (
                <button
                  key={i}
                  onClick={() => { setInputCode(code); resetPipeline(); }}
                  className="neo-btn bg-slate-100 text-slate-600 py-2 text-xs border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Preset {i + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handleLex}
                className="neo-btn bg-sky-300 hover:bg-sky-200 py-3 text-sm flex items-center justify-between px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span>1. TOKENIZE (LEXER)</span> <span>✂️</span>
              </button>
              <button
                onClick={handleParse}
                disabled={btnParseDisabled}
                className="neo-btn bg-fuchsia-300 hover:bg-fuchsia-200 py-3 text-sm flex items-center justify-between px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:translate-x-1 disabled:translate-y-1 disabled:shadow-none"
              >
                <span>2. BUILD AST (PARSER)</span> <span>🌳</span>
              </button>
              <button
                onClick={handleEval}
                disabled={btnEvalDisabled || evaluating}
                className="neo-btn bg-emerald-400 hover:bg-emerald-300 py-3 text-sm flex items-center justify-between px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:translate-x-1 disabled:translate-y-1 disabled:shadow-none"
              >
                <span>3. EXECUTE (INTERPRET)</span> <span>⚡</span>
              </button>
              <button
                onClick={resetPipeline}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 text-xs mt-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 RESET PIPELINE
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 flex flex-col gap-3 rounded-lg">
            <h4 className="font-black text-emerald-400 text-[10px] uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL / STATUS KONSOL</h4>
            
            <div className="bg-black p-4 border-2 border-dashed border-slate-500 flex flex-col items-center rounded">
              <span className="text-4xl font-black text-emerald-400 font-mono">{finalResult}</span>
            </div>
            
            <div className={`text-xs font-mono font-bold p-3 border-2 rounded break-words max-h-[200px] overflow-y-auto ${isError ? 'text-rose-400 bg-rose-950 border-rose-600' : 'text-emerald-300 bg-slate-800 border-slate-600'}`} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {statusMsg}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-6 relative flex flex-col w-full h-[650px] border-8 border-black overflow-hidden justify-between gap-4 rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Pohon Sintaks
            </span>

            <div className="w-full bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] p-4 flex flex-col mt-6 z-20 min-h-[90px] rounded-lg">
              <span className="text-[10px] font-black uppercase text-slate-500 mb-2">1. Token Stream (Keluaran Lexer)</span>
              <div className="flex gap-2 overflow-x-auto pb-2 items-center flex-1">
                {renderTokens()}
              </div>
            </div>

            <div className="w-full bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] flex-1 relative overflow-hidden rounded-lg">
              <span className="absolute top-2 left-2 text-[10px] font-black uppercase text-slate-500 z-20 bg-white/80 px-1">2. Visualisasi Abstract Syntax Tree</span>
              
              <div className="w-full h-full relative z-10 flex items-center justify-center pt-6">
                <svg viewBox="0 0 1000 500" className="w-full h-full overflow-visible">
                  <style>
                    {`
                      @keyframes popIn {
                        to { opacity: 1; transform: scale(1); }
                      }
                      @keyframes popNode {
                        0% { opacity: 0; transform: scale(0); }
                        100% { opacity: 1; transform: scale(1); }
                      }
                      @keyframes drawLine {
                        to { stroke-dashoffset: 0; }
                      }
                      @keyframes evalPulse {
                        0% { filter: drop-shadow(0 0 15px #facc15); transform: scale(1.1); }
                        100% { filter: drop-shadow(0 0 0px #facc15); transform: scale(1); }
                      }
                      .edge-draw {
                        stroke-dasharray: 500;
                        stroke-dashoffset: 500;
                        animation: drawLine 0.5s ease-out forwards;
                      }
                      .node-draw {
                        animation: popNode 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        opacity: 0;
                        transform-origin: center;
                      }
                      .eval-glow {
                        animation: evalPulse 1s ease-out forwards;
                      }
                    `}
                  </style>
                  {renderAST()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}