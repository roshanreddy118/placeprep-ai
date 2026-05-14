// Client-side code execution using Web Workers (JS) and Pyodide (Python)

interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error: boolean;
}

function normalizeOutput(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Run JavaScript in a sandboxed Web Worker
function runJavaScript(code: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeInput = JSON.stringify(input);
    const workerCode = `
      'use strict';
      const __logs = [];
      const console = { log: (...a) => __logs.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')),
                         error: (...a) => __logs.push('Error: ' + a.join(' ')),
                         warn: () => {}, info: () => {} };
      try {
        ${code}
        const testInput = JSON.parse(${safeInput});
        const result = Array.isArray(testInput) ? solution(...testInput) : solution(testInput);
        postMessage({ type: 'result', value: JSON.stringify(result) });
      } catch(e) {
        postMessage({ type: 'error', value: e.message || String(e) });
      }
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error("Time limit exceeded (10s)"));
    }, 10000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (e.data.type === "error") {
        reject(new Error(e.data.value));
      } else {
        resolve(e.data.value);
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(e.message || "Execution error"));
    };
  });
}

// Cache Pyodide instance
let pyodideInstance: unknown = null;
let pyodideLoading: Promise<unknown> | null = null;

async function loadPyodideInstance(): Promise<unknown> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = (async () => {
    // Load Pyodide from CDN
    if (!(window as unknown as Record<string, unknown>).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    const loadPyodide = (window as unknown as Record<string, CallableFunction>).loadPyodide;
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    return pyodideInstance;
  })();

  return pyodideLoading;
}

// Run Python using Pyodide (WebAssembly)
async function runPython(code: string, input: string): Promise<string> {
  const pyodide = await loadPyodideInstance() as {
    runPythonAsync: (code: string) => Promise<unknown>;
    globals: { get: (key: string) => unknown };
  };

  const safeInput = JSON.stringify(input);

  const fullCode = `
import json, sys
from io import StringIO

__stdout = StringIO()
__stderr = StringIO()

${code}

try:
    test_input = json.loads(${safeInput})
    func = solution
    if isinstance(test_input, list):
        result = func(*test_input)
    else:
        result = func(test_input)
    __stdout.write(json.dumps(result))
except Exception as e:
    __stderr.write(f"Error: {e}")

__output = __stdout.getvalue()
__error = __stderr.getvalue()
`;

  try {
    await pyodide.runPythonAsync(fullCode);
    const error = pyodide.globals.get("__error") as string;
    if (error) {
      throw new Error(error);
    }
    return pyodide.globals.get("__output") as string;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<{
  results: TestResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}> {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    try {
      const actual =
        language === "python"
          ? await runPython(code, testCase.input)
          : await runJavaScript(code, testCase.input);

      const passed =
        normalizeOutput(actual) === normalizeOutput(testCase.expected.trim());

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: actual.trim(),
        passed,
        error: false,
      });
    } catch (err) {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: err instanceof Error ? err.message : "Execution failed",
        passed: false,
        error: true,
      });
    }
  }

  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;

  return { results, allPassed, passedCount, totalCount: testCases.length };
}
