"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Terminal,
  FlaskConical,
} from "lucide-react";
import Button from "@/components/Button";
import { executeCode } from "@/lib/codeRunner";

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

interface CodeEditorProps {
  starterCode: { python: string; javascript: string };
  testCases: TestCase[];
  onAllPassed: () => void;
  onSubmit?: (passedCount: number, totalCount: number) => void;
}

export default function CodeEditor({
  starterCode,
  testCases,
  onAllPassed,
  onSubmit,
}: CodeEditorProps) {
  const [language, setLanguage] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState(starterCode.python);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [passedCount, setPassedCount] = useState(0);
  const [allPassed, setAllPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"test" | "custom">("custom");
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState<string | null>(null);
  const [customError, setCustomError] = useState(false);
  const [runningCustom, setRunningCustom] = useState(false);

  const handleLanguageChange = (lang: "python" | "javascript") => {
    setLanguage(lang);
    setCode(starterCode[lang]);
    setResults(null);
  };

  const handleReset = () => {
    setCode(starterCode[language]);
    setResults(null);
  };

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResults(null);

    try {
      const data = await executeCode(code, language, testCases);

      setResults(data.results);
      setPassedCount(data.passedCount);
      if (data.allPassed) {
        setAllPassed(true);
        onAllPassed();
      }
    } catch {
      setResults([
        {
          input: "",
          expected: "",
          actual: "Execution failed. Please check your code.",
          passed: false,
          error: true,
        },
      ]);
    } finally {
      setRunning(false);
    }
  }, [code, language, testCases, onAllPassed]);

  const handleCustomRun = useCallback(async () => {
    setRunningCustom(true);
    setCustomOutput(null);
    setCustomError(false);

    try {
      const dummyTestCase = [{ input: customInput || "null", expected: "" }];
      const data = await executeCode(code, language, dummyTestCase);
      const result = data.results[0];
      if (result.error) {
        setCustomOutput(result.actual);
        setCustomError(true);
      } else {
        setCustomOutput(result.actual);
      }
    } catch {
      setCustomOutput("Execution failed. Please check your code.");
      setCustomError(true);
    } finally {
      setRunningCustom(false);
    }
  }, [code, language, customInput]);

  const visibleTestCases = testCases.filter((tc) => !tc.hidden);

  return (
    <div className="space-y-4">
      {/* Language + Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["python", "javascript"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === lang
                  ? "bg-accent/20 text-accent-light border border-accent/30"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {lang === "python" ? "Python" : "JavaScript"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          {mode === "custom" ? (
            <Button size="sm" onClick={handleCustomRun} loading={runningCustom}>
              {!runningCustom && <Play className="w-3.5 h-3.5" />}
              Run
            </Button>
          ) : (
            <Button size="sm" onClick={handleRun} loading={running}>
              {!running && <Play className="w-3.5 h-3.5" />}
              Run Tests
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl overflow-hidden border border-border">
        <Editor
          height="300px"
          language={language}
          value={code}
          onChange={(val) => setCode(val || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: language === "python" ? 4 : 2,
            padding: { top: 12, bottom: 12 },
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        />
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("custom")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "custom"
              ? "bg-accent/20 text-accent-light border border-accent/30"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Custom Input
        </button>
        <button
          onClick={() => setMode("test")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "test"
              ? "bg-accent/20 text-accent-light border border-accent/30"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Test Cases
        </button>
      </div>

      {/* Custom Input Mode */}
      {mode === "custom" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Input (JSON format — e.g. <code className="text-accent-light">[1, 2]</code> for two args, or <code className="text-accent-light">5</code> for single arg)
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder='e.g. [1, 2] or "hello" or 42'
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all resize-none"
            />
          </div>
          {customOutput !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-xs font-medium text-muted mb-1.5">
                Output
              </label>
              <pre
                className={`p-3 rounded-lg border text-sm font-mono whitespace-pre-wrap ${
                  customError
                    ? "bg-danger/5 border-danger/20 text-danger"
                    : "bg-success/5 border-success/20 text-foreground"
                }`}
              >
                {customOutput}
              </pre>
            </motion.div>
          )}
        </div>
      )}

      {/* Test Cases (visible ones) — only show in test mode */}
      {mode === "test" && (
      <>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted">
          Test Cases ({visibleTestCases.length} visible, {testCases.length - visibleTestCases.length} hidden)
        </h4>
        {visibleTestCases.map((tc, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-background border border-border text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted">
                Input: <span className="text-foreground">{tc.input}</span>
              </span>
              <span className="text-muted">
                Expected: <span className="text-foreground">{tc.expected}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Summary */}
          <div
            className={`p-4 rounded-xl border ${
              allPassed
                ? "bg-success/5 border-success/20"
                : "bg-danger/5 border-danger/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {allPassed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-semibold text-success">
                    All Test Cases Passed! 🎉
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger" />
                  <span className="font-semibold text-danger">
                    {passedCount}/{testCases.length} Test Cases Passed
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Individual Results */}
          {results.map((result, i) => {
            const isHidden = i >= visibleTestCases.length;
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${
                  result.passed
                    ? "bg-success/5 border-success/20"
                    : "bg-danger/5 border-danger/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger" />
                  )}
                  <span className="font-medium">
                    Test Case {i + 1}{" "}
                    {isHidden ? "(Hidden)" : ""}
                  </span>
                  <span className={`ml-auto text-xs font-semibold ${result.passed ? "text-success" : "text-danger"}`}>
                    {result.passed ? "Passed" : "Failed"}
                  </span>
                </div>
                {!isHidden && !result.error && (
                  <div className="space-y-1 text-xs font-mono mt-2">
                    {result.input && (
                      <div>
                        <span className="text-muted">Input: </span>
                        {result.input}
                      </div>
                    )}
                    <div>
                      <span className="text-muted">Expected: </span>
                      <span className="text-success">{result.expected}</span>
                    </div>
                    <div>
                      <span className="text-muted">Got: </span>
                      <span className={result.passed ? "text-success" : "text-danger"}>
                        {result.actual}
                      </span>
                    </div>
                  </div>
                )}
                {result.error && !isHidden && (
                  <pre className="text-xs text-danger overflow-x-auto mt-2">
                    {result.actual}
                  </pre>
                )}
              </div>
            );
          })}

          {/* Submit button — allows user to accept partial score and move on */}
          {!allPassed && !submitted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSubmitted(true);
                onSubmit?.(passedCount, testCases.length);
              }}
              className="w-full mt-2"
            >
              Submit ({passedCount}/{testCases.length} passed) — Move On
            </Button>
          )}
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}
