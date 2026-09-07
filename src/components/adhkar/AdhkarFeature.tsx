import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AdhkarCategory, AdhkarItem, AdhkarView } from '../../types';
import { useAdhkar } from '../../hooks/useAdhkar';
import { useApp } from '../../context/AppContext';
import { AdhkarHome } from './AdhkarHome';
import { AdhkarReader } from './AdhkarReader';
import { AdhkarSourceSheet } from './AdhkarSourceSheet';

export const AdhkarFeature: React.FC = () => {
  const adhkar = useAdhkar();
  const { adhkarFocus, setAdhkarFocus } = useApp();
  const [view, setView] = useState<AdhkarView>('home');
  const [activeCategory, setActiveCategory] = useState<AdhkarCategory>('morning');
  const [initialItemId, setInitialItemId] = useState<string | undefined>(undefined);
  const [sourceItem, setSourceItem] = useState<AdhkarItem | null>(null);

  // Deep-link from the dashboard quick access card ("الأذكار اليومية")
  useEffect(() => {
    if (adhkarFocus) {
      setActiveCategory(adhkarFocus);
      setInitialItemId(undefined);
      setView('reader');
      setAdhkarFocus(null);
    }
  }, [adhkarFocus, setAdhkarFocus]);

  const handleOpenCategory = useCallback((category: AdhkarCategory, opts?: { initialItemId?: string }) => {
    setActiveCategory(category);
    setInitialItemId(opts?.initialItemId);
    setView('reader');
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
    setInitialItemId(undefined);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === 'home' ? (
            <AdhkarHome
              adhkar={adhkar}
              onOpenCategory={handleOpenCategory}
              onOpenSource={setSourceItem}
            />
          ) : (
            <AdhkarReader
              key={`${activeCategory}-${initialItemId || ''}`}
              category={activeCategory}
              adhkar={adhkar}
              onBack={handleBack}
              onOpenSource={setSourceItem}
              initialItemId={initialItemId}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AdhkarSourceSheet item={sourceItem} onClose={() => setSourceItem(null)} />
    </>
  );
};