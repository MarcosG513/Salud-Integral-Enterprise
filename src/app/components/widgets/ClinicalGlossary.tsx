import { Info, X } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import { GLOSSARY_TERMS, findGlossaryTerm } from "../../../data/glossary-db";

export { GLOSSARY_TERMS };

// ── Portal Tooltip Engine ─────────────────────────────────────────────────────
// Uses ReactDOM.createPortal to render into document.body.
// Positions the tooltip with position: fixed using getBoundingClientRect() for viewport stability.

interface TooltipPortalProps {
  data: { term: string; definition: string; significance: string };
  anchorEl: HTMLButtonElement | null;
  position: "top" | "bottom";
  onClose: () => void;
}

function TooltipPortal({ data, anchorEl, position, onClose }: TooltipPortalProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computeCoords = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    const popupWidth = Math.min(320, vpW - 24);
    const calculatedLeft = rect.left + rect.width / 2 - popupWidth / 2;
    const clampedLeft = Math.max(12, Math.min(calculatedLeft, vpW - popupWidth - 12));

    const ttH = tooltipRef.current?.offsetHeight ?? 150;
    let top: number;

    if (position === "top") {
      if (rect.top - ttH - 8 < 12) {
        top = rect.bottom + 8;
      } else {
        top = rect.top - ttH - 8;
      }
    } else {
      if (rect.bottom + ttH + 8 > vpH - 12) {
        top = rect.top - ttH - 8;
      } else {
        top = rect.bottom + 8;
      }
    }

    // Hard clamp to keep within screen bounds
    top = Math.max(12, Math.min(top, vpH - ttH - 12));

    setCoords({ top, left: clampedLeft });
  }, [anchorEl, position]);

  useEffect(() => {
    computeCoords();
    // Catch scroll on window in capture phase to detect scrolling inside any container
    const handleScrollOrResize = () => computeCoords();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [computeCoords]);

  // Re-compute once mounted
  useEffect(() => {
    computeCoords();
  }, [computeCoords]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        anchorEl && !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorEl, onClose]);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
      className="bg-white text-slate-800 border border-slate-200/90 shadow-2xl rounded-2xl p-4 text-left max-h-[80vh] overflow-y-auto max-w-[calc(100vw-24px)] w-80 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
        <span className="font-extrabold text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
          {data.term}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar glosario"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-xs leading-relaxed text-slate-700 mb-2 font-normal">
        {data.definition}
      </p>
      <div className="text-[11px] leading-relaxed text-slate-500 bg-slate-50 border-l-2 border-indigo-500 pl-2.5 py-1 rounded-r-lg font-normal">
        <strong className="text-slate-700 font-semibold block mb-0.5">Relevancia Clínica:</strong>
        {data.significance}
      </div>
    </div>,
    document.body
  );
}

// ── Public GlossaryTooltip Component ─────────────────────────────────────────

interface GlossaryTooltipProps {
  term: keyof typeof GLOSSARY_TERMS | string;
  position?: "top" | "bottom";
  /** Optional explicit scope key — pass e.g. `muscle-${g.id}-mrv` in mapped lists.
   *  Falls back to the auto-generated React useId() instance id. */
  instanceId?: string;
}

export function GlossaryTooltip({ term, position = "top", instanceId }: GlossaryTooltipProps) {
  const { activeGlossaryId, setActiveGlossaryId } = useClinicalEngine();
  const btnRef = useRef<HTMLButtonElement>(null);
  const reactId = useId();

  const searchKey = String(term || "").toLowerCase().trim();
  const data = findGlossaryTerm(searchKey) || GLOSSARY_TERMS[searchKey];
  const uniqueInstanceId = instanceId ?? `${searchKey}-${reactId}`;

  if (!data) return null;

  const isOpen = activeGlossaryId === uniqueInstanceId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveGlossaryId(activeGlossaryId === uniqueInstanceId ? null : uniqueInstanceId);
  };

  const handleClose = () => setActiveGlossaryId(null);

  return (
    <span className="relative inline-flex items-center ml-0.5">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Definición clínica de ${term}`}
        aria-expanded={isOpen}
        className="min-w-[44px] min-h-[44px] p-2 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 active:bg-indigo-100 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        title={`Definición de ${term}`}
      >
        <Info size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <TooltipPortal
          data={data}
          anchorEl={btnRef.current}
          position={position}
          onClose={handleClose}
        />
      )}
    </span>
  );
}
