import axios from 'axios';

// JDoodle API Configuration
const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || '';
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || '';

interface RunResult {
  output: string;
  waveformData: string[];
}

/**
 * Inject a $monitor-style statement into the testbench so that
 * every signal change is logged in a parseable format:
 *   #WAVE|<time>|sig1=val1,sig2=val2,...
 *
 * Strategy: find "initial begin" in the testbench, and right after it
 * insert a $monitor line that references all declared regs/wires.
 */
function injectWaveformLogging(testbench: string): string {
  // Extract all "reg" and "wire" variable declarations from the testbench
  const signals: { name: string; isBus: boolean; width: string }[] = [];

  // Match: reg [3:0] a, b;  OR  reg a, b;  OR  wire [6:0] seg;
  const declRegex = /\b(reg|wire)\s+(\[\d+:\d+\])?\s*([^;]+);/g;
  let match;
  while ((match = declRegex.exec(testbench)) !== null) {
    const busWidth = match[2] || '';
    const isBus = !!match[2];
    const names = match[3].split(',').map(n => n.trim()).filter(n => n.length > 0);
    for (const name of names) {
      // Skip names that have parentheses (module instantiation ports)
      if (!name.includes('(') && !name.includes(')') && /^[a-zA-Z_]\w*$/.test(name)) {
        signals.push({ name, isBus, width: busWidth });
      }
    }
  }

  if (signals.length === 0) return testbench;

  // Build the $monitor format string and argument list
  // For buses, use %d (decimal); for single-bit, use %b (binary)
  const formatParts = signals.map(s => `${s.name}=${s.isBus ? '%d' : '%b'}`);
  const formatStr = `"#WAVE|%0t|${formatParts.join(',')}"`;
  const args = ['$time', ...signals.map(s => s.name)].join(', ');
  const monitorLine = `$monitor(${formatStr}, ${args});`;

  // Insert after the first "initial begin"
  const insertPoint = testbench.search(/initial\s+begin/i);
  if (insertPoint === -1) return testbench;

  const beginMatch = testbench.match(/initial\s+begin/i);
  if (!beginMatch) return testbench;

  const afterBegin = insertPoint + beginMatch[0].length;
  const injected =
    testbench.slice(0, afterBegin) +
    '\n      ' + monitorLine +
    testbench.slice(afterBegin);

  return injected;
}

// This function will:
// 1. Inject waveform logging into the testbench
// 2. Combine user code + testbench into one script
// 3. Send it to JDoodle's cloud compiler API
// 4. Return the simulation output + parsed waveform data
export const runVerilog = async (userCode: string, testbenchCode: string): Promise<RunResult> => {
  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    return {
      output: '❌ Server Error: JDoodle API credentials not configured. Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file.',
      waveformData: []
    };
  }

  // Inject $monitor into testbench for waveform data
  const enhancedTestbench = injectWaveformLogging(testbenchCode);

  // Combine the design code and testbench into a single script
  const combinedScript = `${userCode}\n\n// --- Testbench ---\n${enhancedTestbench}`;

  try {
    const response = await axios.post(JDOODLE_API_URL, {
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
      script: combinedScript,
      language: 'verilog',
      versionIndex: '0',
    }, {
      timeout: 15000, // 15 second timeout
    });

    const { output, statusCode } = response.data;

    if (statusCode === 200) {
      const rawOutput = output || '(No output produced)';
      return splitOutput(rawOutput);
    } else {
      return {
        output: `❌ Execution Error (Status ${statusCode}):\n${output || 'Unknown error'}`,
        waveformData: []
      };
    }
  } catch (error: any) {
    let errorMsg = '';
    if (error.response) {
      const { status, data } = error.response;
      if (status === 429) {
        errorMsg = '❌ Rate Limit: Daily API quota exceeded. Try again tomorrow.';
      } else {
        errorMsg = `❌ API Error (${status}): ${data?.error || data?.message || 'Unknown error'}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = '❌ Timeout: Simulation took too long (>15s). Check for infinite loops.';
    } else {
      errorMsg = `❌ Network Error: Could not reach the compilation server. ${error.message}`;
    }
    return { output: errorMsg, waveformData: [] };
  }
};

/**
 * Split raw JDoodle output into:
 * - output: the pass/fail test results (clean, human-readable)
 * - waveformData: array of "#WAVE|time|signals" lines
 */
function splitOutput(raw: string): RunResult {
  const lines = raw.split('\n');
  const waveformData: string[] = [];
  const outputLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('#WAVE|')) {
      waveformData.push(line.trim());
    } else {
      outputLines.push(line);
    }
  }

  return {
    output: outputLines.join('\n'),
    waveformData
  };
}