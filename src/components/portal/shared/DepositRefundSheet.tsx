import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatCurrency';
import { Plus, Trash2 } from 'lucide-react';

interface ManualDeductionItem {
  id: string;
  item: string;
  unitCost: number;
  quantity: number;
  labourCost: number;
}

interface DepositItem {
  id: string;
  label: string;
  amount: number;
}

interface FlatDeductionItem {
  id: string;
  label: string;
  amount: number;
}

interface DamageCostMemory {
  unitCost: number;
  labourCost: number;
}

export interface DepositRefundCase {
  id: string;
  unitNumber: string;
  tenantName: string;
  propertyName: string;
  noticeDate?: string;
  moveOutDate?: string;
  status?: string;
  securityDeposit: number;
  waterDeposit?: number;
  rentArrears: number;
  billNameArrears: number;
  autoChecklistDamages: number;
}

interface DepositRefundSheetProps {
  cases: DepositRefundCase[];
  title?: string;
  description?: string;
}

const createManualItem = (): ManualDeductionItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  item: '',
  unitCost: 0,
  quantity: 1,
  labourCost: 0,
});

const createDepositItem = (): DepositItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  amount: 0,
});

const createFlatDeductionItem = (): FlatDeductionItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  amount: 0,
});

const getDefaultDepositItems = (entry: DepositRefundCase): DepositItem[] => {
  const defaults: DepositItem[] = [
    {
      id: `${entry.id}-rent-deposit`,
      label: 'Rent Deposit',
      amount: Number(entry.securityDeposit || 0),
    },
  ];

  if (Number(entry.waterDeposit || 0) > 0) {
    defaults.push({
      id: `${entry.id}-water-deposit`,
      label: 'Water Deposit',
      amount: Number(entry.waterDeposit || 0),
    });
  }

  return defaults;
};

const getDefaultFlatDeductions = (entry: DepositRefundCase): FlatDeductionItem[] => {
  const defaults: FlatDeductionItem[] = [];

  if (Number(entry.rentArrears || 0) > 0) {
    defaults.push({
      id: `${entry.id}-penalty-arrears`,
      label: 'Penalty / Rent Arrears',
      amount: Number(entry.rentArrears || 0),
    });
  }

  if (Number(entry.billNameArrears || 0) > 0) {
    defaults.push({
      id: `${entry.id}-water-bill-deduction`,
      label: 'Water/Bill Arrears (Vacation Month)',
      amount: Number(entry.billNameArrears || 0),
    });
  }

  return defaults;
};

const toMoney = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const DepositRefundSheet = ({
  cases,
  title = 'Deposit Refund Sheet',
  description = 'Automatic vacancy-triggered refund computation with checklist damages and manual repair deductions.',
}: DepositRefundSheetProps) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [depositItemsByCase, setDepositItemsByCase] = useState<Record<string, DepositItem[]>>({});
  const [flatDeductionsByCase, setFlatDeductionsByCase] = useState<Record<string, FlatDeductionItem[]>>({});
  const [manualItemsByCase, setManualItemsByCase] = useState<Record<string, ManualDeductionItem[]>>({});
  const [damageCostMemory, setDamageCostMemory] = useState<Record<string, DamageCostMemory>>({});
  const storageKey = useMemo(
    () => `deposit-refund-sheet:${cases.map((entry) => entry.id).sort().join('|')}`,
    [cases]
  );
  const damageMemoryKey = 'damage-cost-memory:v1';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(damageMemoryKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, DamageCostMemory>;
      setDamageCostMemory(parsed || {});
    } catch {
      window.localStorage.removeItem(damageMemoryKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(damageMemoryKey, JSON.stringify(damageCostMemory));
  }, [damageCostMemory]);

  useEffect(() => {
    if (typeof window === 'undefined' || cases.length === 0) return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        selectedCaseId?: string;
        depositItemsByCase?: Record<string, DepositItem[]>;
        flatDeductionsByCase?: Record<string, FlatDeductionItem[]>;
        manualItemsByCase?: Record<string, ManualDeductionItem[]>;
        depositByCase?: Record<string, number>;
      };

      if (parsed.selectedCaseId) setSelectedCaseId(parsed.selectedCaseId);
      if (parsed.depositItemsByCase) setDepositItemsByCase(parsed.depositItemsByCase);
      if (parsed.flatDeductionsByCase) setFlatDeductionsByCase(parsed.flatDeductionsByCase);
      if (parsed.manualItemsByCase) setManualItemsByCase(parsed.manualItemsByCase);

      // Backward compatibility for old payload with single deposit amount
      if (parsed.depositByCase && !parsed.depositItemsByCase) {
        const migrated: Record<string, DepositItem[]> = {};
        Object.entries(parsed.depositByCase).forEach(([caseId, amount]) => {
          migrated[caseId] = [{
            id: `${caseId}-security-deposit`,
            label: 'Security Deposit',
            amount: Number(amount || 0),
          }];
        });
        setDepositItemsByCase(migrated);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, cases]);

  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases, selectedCaseId]);

  useEffect(() => {
    if (cases.length === 0) return;

    setDepositItemsByCase((prev) => {
      const next = { ...prev };
      for (const entry of cases) {
        if (!next[entry.id] || next[entry.id].length === 0) {
          next[entry.id] = getDefaultDepositItems(entry);
        }
      }
      return next;
    });

    setFlatDeductionsByCase((prev) => {
      const next = { ...prev };
      for (const entry of cases) {
        if (!next[entry.id]) {
          next[entry.id] = getDefaultFlatDeductions(entry);
        }
      }
      return next;
    });

    setManualItemsByCase((prev) => {
      const next = { ...prev };
      for (const entry of cases) {
        if (!next[entry.id]) {
          next[entry.id] = [];
        }
      }
      return next;
    });
  }, [cases]);

  useEffect(() => {
    if (typeof window === 'undefined' || cases.length === 0) return;

    const payload = {
      selectedCaseId,
      depositItemsByCase,
      flatDeductionsByCase,
      manualItemsByCase,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [cases.length, selectedCaseId, depositItemsByCase, flatDeductionsByCase, manualItemsByCase, storageKey]);

  const selectedCase = useMemo(
    () => cases.find((entry) => entry.id === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  const selectedDepositItems = selectedCase ? (depositItemsByCase[selectedCase.id] || []) : [];
  const selectedFlatDeductions = selectedCase ? (flatDeductionsByCase[selectedCase.id] || []) : [];
  const selectedManualItems = selectedCase ? (manualItemsByCase[selectedCase.id] || []) : [];

  const totalDeposits = selectedDepositItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const flatDeductionsTotal = selectedFlatDeductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const autoChecklistDamagesTotal = selectedCase ? Number(selectedCase.autoChecklistDamages || 0) : 0;

  const manualDeductionTotal = selectedManualItems.reduce((sum, item) => {
    return sum + (item.unitCost * item.quantity) + item.labourCost;
  }, 0);

  const totalDeductions = flatDeductionsTotal + autoChecklistDamagesTotal + manualDeductionTotal;
  const expectedRefund = Math.max(0, totalDeposits - totalDeductions);

  const updateDepositItem = (caseId: string, itemId: string, updates: Partial<DepositItem>) => {
    setDepositItemsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).map((item) => item.id === itemId ? { ...item, ...updates } : item),
    }));
  };

  const addDepositItem = (caseId: string) => {
    setDepositItemsByCase((prev) => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), createDepositItem()],
    }));
  };

  const removeDepositItem = (caseId: string, itemId: string) => {
    setDepositItemsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).filter((item) => item.id !== itemId),
    }));
  };

  const updateFlatDeduction = (caseId: string, itemId: string, updates: Partial<FlatDeductionItem>) => {
    setFlatDeductionsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).map((item) => item.id === itemId ? { ...item, ...updates } : item),
    }));
  };

  const addFlatDeduction = (caseId: string) => {
    setFlatDeductionsByCase((prev) => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), createFlatDeductionItem()],
    }));
  };

  const removeFlatDeduction = (caseId: string, itemId: string) => {
    setFlatDeductionsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).filter((item) => item.id !== itemId),
    }));
  };

  const updateManualItem = (caseId: string, itemId: string, updates: Partial<ManualDeductionItem>) => {
    setManualItemsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).map((item) => item.id === itemId ? { ...item, ...updates } : item),
    }));
  };

  const addManualItem = (caseId: string) => {
    setManualItemsByCase((prev) => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), createManualItem()],
    }));
  };

  const applyMemoryForItem = (caseId: string, itemId: string, itemLabel: string) => {
    const key = itemLabel.trim().toLowerCase();
    if (!key) return;
    const remembered = damageCostMemory[key];
    if (!remembered) return;

    updateManualItem(caseId, itemId, {
      unitCost: remembered.unitCost,
      labourCost: remembered.labourCost,
    });
  };

  const rememberItemCosts = (itemLabel: string, unitCost: number, labourCost: number) => {
    const key = itemLabel.trim().toLowerCase();
    if (!key) return;
    setDamageCostMemory((prev) => ({
      ...prev,
      [key]: {
        unitCost,
        labourCost,
      },
    }));
  };

  const removeManualItem = (caseId: string, itemId: string) => {
    setManualItemsByCase((prev) => ({
      ...prev,
      [caseId]: (prev[caseId] || []).filter((item) => item.id !== itemId),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cases.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-gray-600">
            No vacancy notices are currently available for deposit refund processing.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs font-semibold text-gray-700">Select Vacancy Notice</Label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  {cases.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.propertyName} - Unit {entry.unitNumber} - {entry.tenantName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-md border p-3 bg-slate-50">
                <p className="text-xs text-gray-500">Formula</p>
                <p className="text-sm font-semibold mt-1">
                  Total Deposits - (Water/Paint/Penalty/Other Deductions + Repair Cost Deductions)
                </p>
              </div>
            </div>

            {selectedCase && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">Tenant</p>
                    <p className="font-semibold text-sm">{selectedCase.tenantName}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">Unit</p>
                    <p className="font-semibold text-sm">{selectedCase.unitNumber}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">Notice Date</p>
                    <p className="font-semibold text-sm">{selectedCase.noticeDate ? new Date(selectedCase.noticeDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge variant="outline" className="capitalize mt-1">{selectedCase.status || 'pending'}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Fixed Deposits (Property Specific)</p>
                    <Button type="button" size="sm" onClick={() => addDepositItem(selectedCase.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Deposit
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Deposit Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDepositItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-5">
                              No deposit items. Add rent deposit, water deposit, and any other fixed deposits.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedDepositItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  value={item.label}
                                  onChange={(e) => updateDepositItem(selectedCase.id, item.id, { label: e.target.value })}
                                  placeholder="e.g. Rent Deposit"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="text-right"
                                  value={item.amount}
                                  onChange={(e) => updateDepositItem(selectedCase.id, item.id, { amount: toMoney(e.target.value) })}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeDepositItem(selectedCase.id, item.id)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Water/Paint/Penalty/Other Deductions</p>
                    <Button type="button" size="sm" onClick={() => addFlatDeduction(selectedCase.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Deduction
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Deduction Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFlatDeductions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-5">
                              No items yet. Add water consumed, paint deduction, penalty arrears, and any other deductions.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedFlatDeductions.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  value={item.label}
                                  onChange={(e) => updateFlatDeduction(selectedCase.id, item.id, { label: e.target.value })}
                                  placeholder="e.g. Paint Deduction"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="text-right"
                                  value={item.amount}
                                  onChange={(e) => updateFlatDeduction(selectedCase.id, item.id, { amount: toMoney(e.target.value) })}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFlatDeduction(selectedCase.id, item.id)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2 bg-red-50/40">
                  <p className="text-sm font-semibold text-gray-900">Auto Checklist Damages</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Manager Checklist Damages (Auto)</span>
                    <span className="font-semibold text-red-700">-{formatCurrency(autoChecklistDamagesTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Repair Cost Deductions (Manager Added)</p>
                    <Button type="button" size="sm" onClick={() => addManualItem(selectedCase.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Labour</TableHead>
                          <TableHead className="text-right">Line Total</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedManualItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-5">
                              No manual deductions yet. Add items to calculate: (unit cost x quantity) + labour cost.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedManualItems.map((item) => {
                            const lineTotal = (item.unitCost * item.quantity) + item.labourCost;
                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Input
                                    value={item.item}
                                    list="damage-item-memory-list"
                                    onChange={(e) => {
                                      const itemValue = e.target.value;
                                      updateManualItem(selectedCase.id, item.id, { item: itemValue });
                                      applyMemoryForItem(selectedCase.id, item.id, itemValue);
                                    }}
                                    placeholder="e.g. Broken lock"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="text-right"
                                    value={item.unitCost}
                                    onChange={(e) => {
                                      const unitCost = toMoney(e.target.value);
                                      updateManualItem(selectedCase.id, item.id, { unitCost });
                                      rememberItemCosts(item.item, unitCost, item.labourCost);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="text-right"
                                    value={item.quantity}
                                    onChange={(e) => updateManualItem(selectedCase.id, item.id, { quantity: Math.max(1, Math.floor(toMoney(e.target.value))) })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="text-right"
                                    value={item.labourCost}
                                    onChange={(e) => {
                                      const labourCost = toMoney(e.target.value);
                                      updateManualItem(selectedCase.id, item.id, { labourCost });
                                      rememberItemCosts(item.item, item.unitCost, labourCost);
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(lineTotal)}</TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeManualItem(selectedCase.id, item.id)}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <datalist id="damage-item-memory-list">
                  {Object.keys(damageCostMemory)
                    .filter((label) => label.trim().length > 0)
                    .sort((a, b) => a.localeCompare(b))
                    .map((label) => (
                      <option key={label} value={label} />
                    ))}
                </datalist>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-md border p-3 bg-slate-50">
                    <p className="text-xs text-gray-500">Total Deposits</p>
                    <p className="text-lg font-bold">{formatCurrency(totalDeposits)}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-red-50">
                    <p className="text-xs text-gray-500">Water/Paint/Penalty/Other</p>
                    <p className="text-lg font-bold text-red-700">-{formatCurrency(flatDeductionsTotal)}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-red-50">
                    <p className="text-xs text-gray-500">Repair Cost Deductions</p>
                    <p className="text-lg font-bold text-red-700">-{formatCurrency(manualDeductionTotal)}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-red-100">
                    <p className="text-xs text-gray-500">Total Deductions</p>
                    <p className="text-lg font-bold text-red-800">-{formatCurrency(totalDeductions)}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-emerald-50 md:col-span-4">
                    <p className="text-xs text-gray-500">Expected Refund (Deposits - Deductions)</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(expectedRefund)}</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositRefundSheet;
