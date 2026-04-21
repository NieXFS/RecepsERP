"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type SelectionContext = {
  selectedIds: Set<string>;
  selectedProfessionalId: string | null;
  toggle: (id: string, professionalId: string) => void;
  selectMany: (ids: string[], professionalId: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  size: number;
};

const Ctx = createContext<SelectionContext | null>(null);

export function CommissionSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    null
  );

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedProfessionalId(null);
  }, []);

  const toggle = useCallback(
    (id: string, professionalId: string) => {
      setSelectedIds((current) => {
        if (
          selectedProfessionalId &&
          selectedProfessionalId !== professionalId &&
          !current.has(id)
        ) {
          toast.error(
            "Só é possível fechar acerto de um profissional por vez. Desmarque as comissões atuais primeiro."
          );
          return current;
        }

        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        if (next.size === 0) {
          setSelectedProfessionalId(null);
        } else if (!selectedProfessionalId) {
          setSelectedProfessionalId(professionalId);
        }

        return next;
      });
    },
    [selectedProfessionalId]
  );

  const selectMany = useCallback(
    (ids: string[], professionalId: string) => {
      if (ids.length === 0) return;
      setSelectedIds((current) => {
        if (
          selectedProfessionalId &&
          selectedProfessionalId !== professionalId
        ) {
          toast.error(
            "Só é possível fechar acerto de um profissional por vez. Desmarque as comissões atuais primeiro."
          );
          return current;
        }
        const next = new Set(current);
        for (const id of ids) next.add(id);
        setSelectedProfessionalId(professionalId);
        return next;
      });
    },
    [selectedProfessionalId]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const value = useMemo<SelectionContext>(
    () => ({
      selectedIds,
      selectedProfessionalId,
      toggle,
      selectMany,
      clear,
      isSelected,
      size: selectedIds.size,
    }),
    [selectedIds, selectedProfessionalId, toggle, selectMany, clear, isSelected]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommissionSelection(): SelectionContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useCommissionSelection deve ser usado dentro de <CommissionSelectionProvider>."
    );
  }
  return ctx;
}
