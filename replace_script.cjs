const fs = require('fs');
const file = 'src/pages/portal/tenant/Payments.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\s*\{\/\* Utility Readings Alerts \*\/\}.*?(?=<Tabs defaultValue="all" className="w-full")/s;
const match = content.match(regex);
if (match) {
    const replacement = `
      {/* Current Statement detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
        <div className="bg-[#154279] p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Total Current Statement</h2>
            <p className="text-blue-100 mt-1">Itemized breakdown of your pending rent and utilities</p>
          </div>
          <div className="mt-4 sm:mt-0 text-center flex gap-4 items-center sm:text-right">
            <div className="text-right">
               <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold mb-1">Total Due Balance</p>
               <p className="text-3xl font-extrabold text-[#F96302]">
                 {formatCurrency(totalArrears)}
               </p>
            </div>
            {totalArrears > 0 && (
               <Button 
                 onClick={() => navigate(\`/portal/tenant/payments/make?type=all&amount=\${totalArrears}\`)}
                 className="bg-[#F96302] hover:bg-[#d85501] text-white h-12 px-6 shadow-md shadow-orange-900/20 transition-all font-bold tracking-wide"
               >
                 <DollarSign className="mr-2" size={18} />
                 PAY LUMPSUM ({formatCurrency(totalArrears)})
               </Button>
            )}
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-800">Charge Details</TableHead>
                <TableHead className="font-bold text-slate-800">Due Date</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Amount</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Paid</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Balance</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {(() => {
                  const pendingRentPayments = rentPayments.filter(p => !['paid', 'completed'].includes(p.status));
                  const pendingUtilityBills = utilityBills.filter(p => !['paid', 'completed'].includes(p.status));
                  const allPending = [...pendingRentPayments, ...pendingUtilityBills].sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
                  
                  if (allPending.length === 0 && globalUtilityFee === 0) {
                     return (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-base">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            Good job! You have no outstanding balances.
                            <br />
                            <span className="text-sm">All caught up down to the last coin.</span>
                         </TableCell>
                       </TableRow>
                     )
                  }

                  return (
                     <>
                        {globalUtilityFee > 0 && (
                          <TableRow className="border-b border-slate-100 bg-white hover:bg-slate-50/50">
                             <TableCell>
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield size={18} /></div>
                                   <div>
                                     <p className="font-bold text-slate-900">Fixed Monthly Services</p>
                                     <p className="text-xs text-slate-500">Security, Garbage, Services</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell className="text-slate-600 font-medium text-sm">Monthly Recurrent</TableCell>
                             <TableCell className="text-right font-medium">{formatCurrency(globalUtilityFee)}</TableCell>
                             <TableCell className="text-right text-green-600 font-medium">{formatCurrency(0)}</TableCell>
                             <TableCell className="text-right font-bold text-red-600">{formatCurrency(globalUtilityFee)}</TableCell>
                             <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-purple-200 text-purple-700 hover:bg-purple-50 h-8 text-[11px] font-bold uppercase tracking-wider"
                                  onClick={() => navigate(\`/portal/tenant/payments/make?type=utilities&amount=\${globalUtilityFee}\`)}
                                >
                                  Pay Fee
                                </Button>
                             </TableCell>
                          </TableRow>
                        )}
                        {allPending.map(item => {
                           const isUtilityItem = (item.bill_type && item.bill_type !== 'rent') || (item.remarks && item.remarks.toLowerCase().includes('utility'));
                           const remainingAmount = Math.max(0, item.amount - (item.amount_paid || 0));
                           const icon = isUtilityItem ? <Droplets size={18}/> : <DollarSign size={18}/>;
                           const iconBg = isUtilityItem ? "bg-cyan-50 text-cyan-600" : "bg-blue-50 text-blue-600";
                           const title = isUtilityItem ? "Monthly Utility Bill" : "Rent Payment";
                           
                           // Try matching the reading
                           let readingDetails = null;
                           if (isUtilityItem) {
                               const match = utilityReadings.find(r => {
                                  const rMonthStr = new Date(r.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                  const rawMonth = r.reading_month.substring(0,7);
                                  return item.remarks?.includes(rMonthStr) || item.due_date?.includes(rawMonth);
                               });
                               if (match) readingDetails = match;
                           }

                           return (
                             <React.Fragment key={item.id}>
                               <TableRow className={\`border-slate-100 bg-white hover:bg-slate-50/50 \${readingDetails ? 'border-b-0' : 'border-b'}\`}>
                                  <TableCell>
                                     <div className="flex items-center gap-3">
                                        <div className={\`p-2 rounded-lg \${iconBg}\`}>{icon}</div>
                                        <div>
                                          <p className="font-bold text-slate-900">{title}</p>
                                          <p className="text-xs text-slate-500 max-w-[200px] truncate" title={item.remarks}>{item.remarks || 'Standard charge'}</p>
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-slate-600 font-medium text-sm">
                                     <div className="flex flex-col">
                                        <span>{formatDate(item.due_date)}</span>
                                        <Badge variant="outline" className={cn("mt-1 w-fit text-[9px] uppercase tracking-wider", getStatusColor(item.status))}>
                                           {item.status}
                                        </Badge>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                  <TableCell className="text-right text-green-600 font-medium">{formatCurrency(item.amount_paid || 0)}</TableCell>
                                  <TableCell className="text-right font-bold text-red-600">{formatCurrency(remainingAmount)}</TableCell>
                                  <TableCell className="text-right">
                                     <Button 
                                       size="sm" 
                                       className="bg-[#154279] hover:bg-[#103058] text-white h-8 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                                       onClick={() => {
                                          const type = isUtilityItem ? 'water' : 'rent';
                                          navigate(\`/portal/tenant/payments/make?type=\${type}&id=\${item.id}&amount=\${remainingAmount}\`);
                                       }}
                                     >
                                       Pay Bill
                                     </Button>
                                  </TableCell>
                               </TableRow>
                               
                               {readingDetails && (
                                  <TableRow className="border-b border-slate-100">
                                     <TableCell colSpan={6} className="p-0 border-0">
                                        <div className="pl-14 pr-6 py-4 border-l-4 border-cyan-400 ml-5 my-0.5 mb-4 bg-slate-50 shadow-inner rounded-r-xl border-y border-r border-[#e2e8f0]">
                                           <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><Bell size={12}/> Itemized Breakdown</p>
                                              <p className="text-xs font-semibold text-slate-500">{new Date(readingDetails.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                           </div>
                                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                              <div>
                                                 <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Electricity</span>
                                                 <span className="font-bold text-slate-800">{formatCurrency((readingDetails.current_reading - readingDetails.previous_reading) * readingDetails.electricity_rate)}</span>
                                              </div>
                                              <div>
                                                 <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Water</span>
                                                 <span className="font-bold text-slate-800">{formatCurrency(((readingDetails.water_current_reading || 0) - (readingDetails.water_previous_reading || 0)) * (readingDetails.water_rate || 0))}</span>
                                              </div>
                                              {(readingDetails.garbage_fee > 0 || readingDetails.security_fee > 0 || (readingDetails.service_fee && readingDetails.service_fee > 0)) && (
                                                 <div>
                                                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Fixed Fees</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(readingDetails.garbage_fee + readingDetails.security_fee + (readingDetails.service_fee || 0))}</span>
                                                 </div>
                                              )}
                                              {readingDetails.other_charges > 0 && (
                                                 <div>
                                                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Other Charges</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(readingDetails.other_charges)}</span>
                                                 </div>
                                              )}
                                           </div>
                                        </div>
                                     </TableCell>
                                  </TableRow>
                               )}
                             </React.Fragment>
                           );
                        })}
                     </>
                  );
               })()}
            </TableBody>
          </Table>
        </div>
      </div>

      `;
    content = content.replace(regex, replacement + '\n      <Tabs defaultValue="all" className="w-full"');
    fs.writeFileSync(file, content);
    console.log("Replaced successfully!");
} else {
    console.log("No match found!");
}
