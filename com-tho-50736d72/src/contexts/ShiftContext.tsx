import React, { createContext, useContext, useState, useCallback } from 'react';
import { Shift, Invoice, Bill } from '@/types';
import { AuthContext } from './AuthContext';
import { shiftsApi } from '@/lib/api';
import { formatDateTimeVN } from '@/lib/datetime';
import { clearOrderDraft } from '@/lib/order-draft-storage';

interface ShiftContextType {
  currentShift: Shift | null;
  invoices: Bill[];
  openShift: (openingAmount: number) => void;
  closeShift: () => void;
  addInvoice: (invoice: Bill) => void;
  updateEndCash: (amount: number) => void;
  getShiftSummary: () => {
    totalCash: number;
    totalBank: number;
    totalRevenue: number;
    invoiceCount: number;
  };
  hasUnpaidOrders: () => boolean;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const [currentShift, setCurrentShift] = useState<Shift | null>(() => {
    const stored = localStorage.getItem('pos_shift');
    return stored ? JSON.parse(stored) : null;
  });
  const [invoices, setInvoices] = useState<Bill[]>(() => {
    const stored = localStorage.getItem('pos_invoices');
    return stored ? JSON.parse(stored) : [];
  });

  const getCurrentShift = useCallback(async () => {
    if(!user) return;

    const {data, error} = await shiftsApi.getCurrent();
    if(data && !error) {
      setCurrentShift(data);
      localStorage.setItem('pos_shift', JSON.stringify(data));
    }
  }, [user])

  const openShift = useCallback(async (startCash: number) => {
    if (!user) return;

    const shift: Shift = {
      userId: user.id,
      startCash,
      startTime: new Date(formatDateTimeVN(new Date())),
      status: 'open',
    };

    const { data, error } = await shiftsApi.open(startCash);

    if (data && !error) {
      setCurrentShift(data);
      setInvoices([]);
      localStorage.setItem('pos_shift', JSON.stringify(data));
      localStorage.setItem('pos_invoices', JSON.stringify([]));
      clearOrderDraft();
    }

  }, [user]);

  const closeShift = useCallback(async () => {
    if (!currentShift) return;

    const { data, error } = await shiftsApi.close(currentShift.id, currentShift.endCash);

    if (data && !error) {
      // Clear all shift-related data from state and localStorage
      localStorage.removeItem('pos_shift');
      localStorage.removeItem('pos_invoices');
      clearOrderDraft();
      setCurrentShift(null);
      setInvoices([]);
    }
  }, [currentShift]);

  const addInvoice = useCallback((invoice: Bill) => {
    setInvoices(prev => {
      const updated = [...prev, invoice];
      localStorage.setItem('pos_invoices', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateEndCash = useCallback((amount: number) => {
    if (!currentShift) return;

    const newEndCash = (currentShift.endCash || currentShift.startCash) + amount;
    const updatedShift = { ...currentShift, endCash: newEndCash };
    setCurrentShift(updatedShift);
    localStorage.setItem('pos_shift', JSON.stringify(updatedShift));
  }, [currentShift]);

  const getShiftSummary = useCallback(() => {
    const totalCash = invoices
      .filter(inv => inv.paymentMethod === 'CASH')
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalBank = invoices
      .filter(inv => inv.paymentMethod === 'CARD')
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalCash,
      totalBank,
      totalRevenue: totalCash + totalBank,
      invoiceCount: invoices.length,
    };
  }, [invoices]);

  const hasUnpaidOrders = useCallback(() => {
    // This will be checked from OrderContext
    return false;
  }, []);

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        invoices,
        openShift,
        closeShift,
        addInvoice,
        updateEndCash,
        getShiftSummary,
        hasUnpaidOrders,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
