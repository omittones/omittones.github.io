import { useState, useCallback, useEffect } from "preact/hooks";
import {
  getDiagnosticLogText,
  getRedactedDiagnosticLogText,
  clearDiagnosticLog,
  copyTextToClipboard,
  disableDiagnosticDebugMode,
  logger,
} from "../diagnostic-log";
import { uploadContentToDpaste } from "../dpaste";

interface AboutProps {
  onBack: () => void;
  debugMode: boolean;
  onDiagnosticsDebugCleared?: () => void;
}

function copyWithFallback(text: string): void {
  copyTextToClipboard(text).catch(function () {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      logger("about").debug("copy used execCommand fallback");
    } catch (_e) {
      logger("about").warn("copy failed (clipboard and execCommand)");
    }
  });
}

export function About({ onBack, debugMode, onDiagnosticsDebugCleared }: AboutProps) {
  useEffect(function () {
    logger("about").debug("About mounted", { debugMode: debugMode });
  }, [debugMode]);

  var [refreshKey, setRefreshKey] = useState(0);
  var [pasteUrl, setPasteUrl] = useState<string | null>(null);
  var [uploadError, setUploadError] = useState<string | null>(null);
  var [isUploading, setIsUploading] = useState(false);
  var [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  var [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);

  var bump = useCallback(function () {
    setRefreshKey(function (k) {
      return k + 1;
    });
  }, []);

  var logText = getDiagnosticLogText();

  var handleRefresh = useCallback(
    function (e: Event) {
      e.preventDefault();
      logger("about").debug("diagnostics refresh view");
      bump();
    },
    [bump]
  );

  var handleCopy = useCallback(
    function (e: Event) {
      e.preventDefault();
      logger("about").debug("diagnostics copy redacted");
      copyWithFallback(getRedactedDiagnosticLogText());
      bump();
    },
    [bump]
  );

  var handleClearClick = useCallback(
    function (e: Event) {
      e.preventDefault();
      setUploadConfirmOpen(false);
      setClearConfirmOpen(true);
    },
    []
  );

  var handleClearCancel = useCallback(function (e: Event) {
    e.preventDefault();
    setClearConfirmOpen(false);
  }, []);

  var handleClearConfirm = useCallback(
    function (e: Event) {
      e.preventDefault();
      setClearConfirmOpen(false);
      logger("about").info("diagnostics log cleared by user");
      clearDiagnosticLog();
      disableDiagnosticDebugMode();
      if (onDiagnosticsDebugCleared) {
        onDiagnosticsDebugCleared();
      }
      setPasteUrl(null);
      setUploadError(null);
      bump();
    },
    [bump, onDiagnosticsDebugCleared]
  );

  var runUpload = useCallback(
    async function () {
      logger("about").debug("diagnostics upload start");
      setUploadError(null);
      setPasteUrl(null);
      setIsUploading(true);
      try {
        var url = await uploadContentToDpaste(getRedactedDiagnosticLogText(), {
          title: "KindLLM2 diagnostics",
          expiryDays: 1,
        });
        setPasteUrl(url);
        logger("about").info("diagnostics upload ok", { urlLen: url.length });
      } catch (err) {
        var msg = "Upload failed";
        if (err instanceof Error) {
          msg = err.message;
        }
        logger("about").error("diagnostics upload failed", { message: msg });
        setUploadError(msg);
      } finally {
        setIsUploading(false);
        bump();
      }
    },
    [bump]
  );

  var handleUploadClick = useCallback(
    function (e: Event) {
      e.preventDefault();
      setClearConfirmOpen(false);
      setUploadConfirmOpen(true);
    },
    []
  );

  var handleUploadCancel = useCallback(function (e: Event) {
    e.preventDefault();
    setUploadConfirmOpen(false);
  }, []);

  var handleUploadConfirm = useCallback(
    async function (e: Event) {
      e.preventDefault();
      setUploadConfirmOpen(false);
      await runUpload();
    },
    [runUpload]
  );

  return (
    <div className="about-page">
      <button
        type="button"
        className="footer-button about-back-button"
        onClick={function () {
          logger("about").debug("Back click");
          onBack();
        }}
      >
        Back
      </button>
      <h1 className="about-title">About KindLLM2</h1>
      <p>
        KindLLM2 is an LLM chat web app prototype for Kindle devices powered by Anthropic Claude.
      </p>
      <p>
        Based on{" "}
        <a href="https://github.com/andersrex/kindllm" style={{ color: "black" }}>
          kindllm
        </a>
      </p>
      <a href="#privacy">Privacy</a>

      {debugMode && (
        <div className="about-diagnostics">
          <h2 style={{ marginTop: "2rem" }}>Diagnostics</h2>
          <p style={{ fontSize: "0.9rem" }}>
            Add <code>?debug=1</code> to the page URL once; it is removed from the address bar after enabling.
            Verbose logging stays on until you clear the log below (stored in this browser).
            Keys are redacted; chat text may still appear.
          </p>
          <div className="about-diagnostics-actions">
            <button type="button" className="footer-button" onClick={handleRefresh}>
              Refresh log view
            </button>
            <button type="button" className="footer-button" onClick={handleCopy}>
              Copy redacted log
            </button>
            <button
              type="button"
              className="footer-button"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? "Uploading…" : "Upload to dpaste"}
            </button>
            <button type="button" className="footer-button" onClick={handleClearClick} disabled={isUploading}>
              Clear log
            </button>
          </div>
          {clearConfirmOpen && (
            <div className="about-inline-confirm" role="region" aria-label="Confirm clear log">
              <p className="about-inline-confirm-text">
                Remove all diagnostic lines from this device, turn off verbose debug mode, and stop saving logs
                to this browser? This cannot be undone.
              </p>
              <div className="about-diagnostics-actions">
                <button type="button" className="footer-button" onClick={handleClearCancel}>
                  Cancel
                </button>
                <button type="button" className="footer-button" onClick={handleClearConfirm}>
                  Yes, clear log
                </button>
              </div>
            </div>
          )}
          {uploadConfirmOpen && (
            <div className="about-inline-confirm" role="region" aria-label="Confirm upload">
              <p className="about-inline-confirm-text">
                Upload the redacted diagnostic log to dpaste.com (expires in one day). Recent chat text may
                still appear in the paste.
              </p>
              <div className="about-diagnostics-actions">
                <button type="button" className="footer-button" onClick={handleUploadCancel} disabled={isUploading}>
                  Cancel
                </button>
                <button type="button" className="footer-button" onClick={handleUploadConfirm} disabled={isUploading}>
                  Upload now
                </button>
              </div>
            </div>
          )}
          {pasteUrl && (
            <p style={{ marginTop: "1rem", wordBreak: "break-all" }}>
              Paste URL:{" "}
              <a href={pasteUrl} style={{ color: "#000" }}>
                {pasteUrl}
              </a>
            </p>
          )}
          {uploadError && (
            <p style={{ marginTop: "1rem", color: "#c00" }} role="alert">
              {uploadError}
            </p>
          )}
          <label className="about-diagnostics-label" htmlFor="diag-log-preview">
            Log preview
          </label>
          <textarea
            id="diag-log-preview"
            key={refreshKey}
            className="api-key-input about-diagnostics-textarea"
            readOnly
            value={logText}
            rows={12}
          />
        </div>
      )}
    </div>
  );
}
