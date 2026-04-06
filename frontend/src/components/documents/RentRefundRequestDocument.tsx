import React from 'react';

type RefundLineItem = {
  label: string;
  amount: number;
};

interface RentRefundRequestDocumentProps {
  propertyName: string;
  unitNumber: string;
  requestDate: string;
  addItems: RefundLineItem[];
  deductItems: RefundLineItem[];
}

const formatKes = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toDisplayDate = (rawDate: string) => {
  if (!rawDate) return 'N/A';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate;
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  return `${day}-${month}-${parsed.getFullYear()}`;
};

const RentRefundRequestDocument: React.FC<RentRefundRequestDocumentProps> = ({
  propertyName,
  unitNumber,
  requestDate,
  addItems,
  deductItems,
}) => {
  const addSubtotal = addItems.reduce((sum, item) => sum + item.amount, 0);
  const deductSubtotal = deductItems.reduce((sum, item) => sum + item.amount, 0);
  const refundableTotal = addSubtotal - deductSubtotal;

  return (
    <div className="w-full rounded-md border border-gray-300 bg-white p-3 sm:p-5 text-[11px] sm:text-xs text-gray-900">
      <div className="border border-gray-700">
        <div className="border-b border-gray-700 px-2 py-2 sm:px-3">
          <h3 className="text-sm sm:text-lg font-bold tracking-wide">AYDEN HOMES RENT REFUND REQUEST</h3>
        </div>

        <div className="border-b border-gray-700 px-2 py-2 sm:px-3 leading-6">
          <p><span className="font-semibold">PROPERTY:</span> {propertyName}</p>
          <p><span className="font-semibold">UNIT No.</span> {unitNumber}</p>
          <p><span className="font-semibold">REFUND REQUEST DATE:</span> {toDisplayDate(requestDate)}</p>
        </div>

        <div className="grid grid-cols-[1fr_150px] sm:grid-cols-[1fr_180px] border-b border-gray-700">
          <div className="border-r border-gray-700 px-2 py-1 sm:px-3 font-semibold">PAYMENT DETAILS</div>
          <div className="px-2 py-1 sm:px-3 font-semibold">AMOUNT</div>
        </div>

        <div className="grid grid-cols-[1fr_150px] sm:grid-cols-[1fr_180px] border-b border-gray-700 min-h-[135px] sm:min-h-[160px]">
          <div className="border-r border-gray-700 px-2 py-2 sm:px-3">
            <p className="font-bold text-base sm:text-lg mb-1">ADD</p>
            <div className="space-y-1">
              {addItems.map((item, index) => (
                <p key={`${item.label}-${index}`} className="uppercase">{item.label}</p>
              ))}
            </div>
          </div>
          <div className="px-2 py-2 sm:px-3 flex flex-col justify-end">
            <div className="space-y-1">
              {addItems.map((item, index) => (
                <p key={`${item.label}-amount-${index}`} className="text-right">{formatKes(item.amount)}</p>
              ))}
            </div>
            <div className="mt-2 border-t border-gray-700 pt-1 font-semibold flex items-center justify-between gap-2">
              <span>SUB-TOTAL</span>
              <span>{formatKes(addSubtotal)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_150px] sm:grid-cols-[1fr_180px] border-b border-gray-700 min-h-[135px] sm:min-h-[160px]">
          <div className="border-r border-gray-700 px-2 py-2 sm:px-3">
            <p className="font-bold text-base sm:text-lg mb-1">DEDUCT</p>
            <div className="space-y-1">
              {deductItems.map((item, index) => (
                <p key={`${item.label}-${index}`} className="uppercase">{item.label}</p>
              ))}
            </div>
          </div>
          <div className="px-2 py-2 sm:px-3 flex flex-col justify-end">
            <div className="space-y-1">
              {deductItems.map((item, index) => (
                <p key={`${item.label}-amount-${index}`} className="text-right">{formatKes(item.amount)}</p>
              ))}
            </div>
            <div className="mt-2 border-t border-gray-700 pt-1 font-semibold flex items-center justify-between gap-2">
              <span>SUB-TOTAL</span>
              <span>{formatKes(deductSubtotal)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_150px] sm:grid-cols-[1fr_180px]">
          <div className="border-r border-gray-700 px-2 py-2 sm:px-3 font-bold text-center text-sm sm:text-base">TOTAL REFUNDABLE DEPOSIT</div>
          <div className="px-2 py-2 sm:px-3 font-bold text-right text-sm sm:text-base">{formatKes(refundableTotal)}</div>
        </div>
      </div>
    </div>
  );
};

export default RentRefundRequestDocument;