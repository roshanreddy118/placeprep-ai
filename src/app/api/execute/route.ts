import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

interface TestCase {
  input: string;
  expected: string;
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, testCases } = (await req.json()) as {
      code: string;
      language: string;
      testCases: TestCase[];
    };

    if (!code || !language || !testCases) {
      return NextResponse.json(
        { error: "Code, language, and test cases are required" },
        { status: 400 }
      );
    }

    if (!["python", "javascript"].includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    const results = [];

    for (const testCase of testCases) {
      const wrappedCode = wrapCode(code, language, testCase.input);

      try {
        const output = await runCode(wrappedCode, language);

        if (output.stderr) {
          results.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: output.stderr.trim(),
            passed: false,
            error: true,
          });
        } else {
          const actual = (output.stdout || "").trim();
          const expected = testCase.expected.trim();
          const passed = normalizeOutput(actual) === normalizeOutput(expected);

          results.push({
            input: testCase.input,
            expected: testCase.expected,
            actual,
            passed,
            error: false,
          });
        }
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

    return NextResponse.json({
      results,
      allPassed,
      passedCount,
      totalCount: testCases.length,
    });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Execution failed" },
      { status: 500 }
    );
  }
}

function runCode(
  code: string,
  language: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise(async (resolve, reject) => {
    const dir = await mkdtemp(join(tmpdir(), "coderun-"));
    const ext = language === "python" ? "py" : "js";
    const filePath = join(dir, `solution.${ext}`);

    await writeFile(filePath, code, "utf-8");

    const cmd = language === "python" ? "python3" : "node";

    execFile(
      cmd,
      [filePath],
      { timeout: 10000, maxBuffer: 1024 * 1024 },
      async (error, stdout, stderr) => {
        // Clean up temp file
        try {
          await unlink(filePath);
        } catch {}

        if (error && !stdout && !stderr) {
          reject(new Error(error.killed ? "Time limit exceeded (10s)" : error.message));
          return;
        }
        resolve({ stdout: stdout || "", stderr: stderr || "" });
      }
    );
  });
}

function normalizeOutput(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function wrapCode(code: string, language: string, input: string): string {
  const safeInput = JSON.stringify(input);

  if (language === "python") {
    return `${code}

# --- Test Runner ---
import json, sys
try:
    test_input = json.loads(${safeInput})
    func = solution
    if isinstance(test_input, list):
        result = func(*test_input)
    else:
        result = func(test_input)
    print(json.dumps(result))
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
`;
  }

  // JavaScript
  return `${code}

// --- Test Runner ---
try {
  const testInput = JSON.parse(${safeInput});
  const result = Array.isArray(testInput) ? solution(...testInput) : solution(testInput);
  console.log(JSON.stringify(result));
} catch(e) {
  console.error(e.message);
}
`;
}
