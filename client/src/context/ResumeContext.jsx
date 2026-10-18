import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import ResumeViewer from "../components/ResumeViewer";

const ResumeContext = createContext({ openResume: () => {} });

/**
 * Owns the resume viewer's open/closed state so any component (navbar,
 * hero, footer…) can open it with `useResume().openResume()` without
 * prop-drilling. The viewer itself is mounted once, here.
 */
export function ResumeProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openResume = useCallback(() => setOpen(true), []);
  const closeResume = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openResume }), [openResume]);

  return (
    <ResumeContext.Provider value={value}>
      {children}
      <AnimatePresence>{open && <ResumeViewer onClose={closeResume} />}</AnimatePresence>
    </ResumeContext.Provider>
  );
}

export const useResume = () => useContext(ResumeContext);
