import fs from 'fs';

const file = 'src/pages/portal/manager/Properties.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [stats, setStats] = useState({",
  const [viewType, setViewType] = useState<'properties' | 'units'>('properties');
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [allUnitsLoading, setAllUnitsLoading] = useState(false);
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterUnitType, setFilterUnitType] = useState('');
  const [filterUnitNumber, setFilterUnitNumber] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [unitsViewMode, setUnitsViewMode] = useState<'grid' | 'list'>('grid');

  const [stats, setStats] = useState({
);

content = content.replace(
  "const fetchMaintenanceCount = async () => {",
  const fetchAllUnits = async (propertyIds: string[]) => {
    try {
      setAllUnitsLoading(true);
      const { data, error } = await supabase
        .from('property_units')
        .select(\
          id,
          unit_number,
          status,
          floor_number,
          price,
          description,
          property_id,
          properties(name),
          property_unit_types(unit_type_name, price_per_unit)
        \)
        .in('property_id', propertyIds)
        .order('unit_number', { ascending: true });
        
      if (error) throw error;
      setAllUnits(data || []);
    } catch (err) {
      console.error('Error fetching all units:', err);
    } finally {
      setAllUnitsLoading(false);
    }
  };

  const fetchMaintenanceCount = async () => {
);

content = content.replace(
  "setProperties(data || []);\n\n      // Calculate stats",
  setProperties(data || []);
      
      if (data && data.length > 0) {
        fetchAllUnits(data.map((p: any) => p.id));
      }

      // Calculate stats
);

content = content.replace(
  "{/* Search, View Toggle & Property Listing */}\n      <Card>",
  {/* View Type Toggle */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setViewType('properties')}
          className={\pb-2 px-1 text-sm font-medium transition-colors border-b-2 \\}
        >
          Properties View
        </button>
        <button
          onClick={() => setViewType('units')}
          className={\pb-2 px-1 text-sm font-medium transition-colors border-b-2 \\}
        >
          All Units View
        </button>
      </div>

      {viewType === 'properties' ? (
        <Card>
);


const unitsViewRaw = \
      ) : (
        /* ── ALL UNITS VIEW ── */
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Units</CardTitle>
                <CardDescription>
                  Filter and manage units across all your assigned properties
                </CardDescription>
              </div>
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setUnitsViewMode('grid')}
                  className={\\\px-3 py-2 flex items-center gap-1 text-sm transition-colors \\\\\\}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUnitsViewMode('list')}
                  className={\\\px-3 py-2 flex items-center gap-1 text-sm transition-colors border-l \\\\\\}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Property</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                >
                  <option value="all">All Properties</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Unit Type</label>
                <Input 
                  placeholder="e.g. 1 Bedroom" 
                  value={filterUnitType} 
                  onChange={(e) => setFilterUnitType(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Unit Number</label>
                <Input 
                  placeholder="e.g. A1" 
                  value={filterUnitNumber} 
                  onChange={(e) => setFilterUnitNumber(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Price</label>
                <Input 
                  type="number"
                  placeholder="e.g. 15000" 
                  value={filterPrice} 
                  onChange={(e) => setFilterPrice(e.target.value)} 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allUnitsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
              </div>
            ) : (
              (() => {
                const filteredAllUnits = allUnits.filter(u => {
                  const typeName = (u.property_unit_types as any)?.unit_type_name || '';
                  const unitPrice = u.price || (u.property_unit_types as any)?.price_per_unit || 0;
                  
                  if (filterProperty !== 'all' && u.property_id !== filterProperty) return false;
                  if (filterUnitType && !typeName.toLowerCase().includes(filterUnitType.toLowerCase())) return false;
                  if (filterUnitNumber && !u.unit_number?.toLowerCase().includes(filterUnitNumber.toLowerCase())) return false;
                  if (filterPrice && unitPrice > Number(filterPrice)) return false;
                  return true;
                });

                if (filteredAllUnits.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <Home className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>No units found matching your filters.</p>
                    </div>
                  );
                }

                if (unitsViewMode === 'grid') {
                  const getUnitBadge = (status: string) => {
                    switch (status) {
                      case 'occupied':
                        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Occupied</Badge>;
                      case 'available':
                        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><KeyRound className="w-3 h-3 mr-1" />Available</Badge>;
                      case 'maintenance':
                        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
                      default:
                        return <Badge variant="outline">{status}</Badge>;
                    }
                  };
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredAllUnits.map((unit) => {
                        const typeName = (unit.property_unit_types as any)?.unit_type_name || 'Unit';
                        const price = unit.price || (unit.property_unit_types as any)?.price_per_unit || 0;
                        return (
                          <div key={unit.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <BedDouble className="w-5 h-5 text-[#00356B]" />
                              </div>
                              {getUnitBadge(unit.status)}
                            </div>
                            <h3 className="font-bold text-gray-900 text-base mb-0.5">
                              Unit {unit.unit_number} <span className="text-xs text-gray-500 font-normal">・ {unit.properties?.name}</span>
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">{typeName}</p>
                            {price > 0 && (
                              <p className="text-sm font-semibold text-[#00356B]">
                                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price)}<span className="text-xs font-normal text-gray-400">/mo</span>
                              </p>
                            )}
                            <div className="mt-3 pt-3 border-t">
                              <Button size="sm" variant="outline" asChild className="w-full text-xs h-7">
                                <Link to={\/portal/manager/properties/\/units/\\}>
                                  <Eye className="w-3 h-3 mr-1" />View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Units List View
                return (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Unit Number</TableHead>
                          <TableHead>Unit Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllUnits.map((unit) => {
                          const typeName = (unit.property_unit_types as any)?.unit_type_name || 'Unit';
                          const price = unit.price || (unit.property_unit_types as any)?.price_per_unit || 0;
                          return (
                            <TableRow key={unit.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{unit.properties?.name}</TableCell>
                              <TableCell>{unit.unit_number}</TableCell>
                              <TableCell>{typeName}</TableCell>
                              <TableCell>{price > 0 ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES'}).format(price) : 'N/A'}</TableCell>
                              <TableCell>
                                {unit.status === 'occupied' ? <Badge className="bg-green-100 text-green-800">Occupied</Badge> : <Badge className="bg-blue-100 text-blue-800">Available</Badge>}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 px-2" asChild>
                                  <Link to={\/portal/manager/properties/\/units/\\}>
                                    <Eye className="w-4 h-4 mr-1" /> View
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialogs */}
\;

const lines = content.split('\\n');
const insertIndex = lines.findIndex(l => l.includes('{/* Assignment Dialogs */}'));
if(insertIndex !== -1) {
  lines.splice(insertIndex - 1, 1, unitsViewRaw);
  fs.writeFileSync(file, lines.join('\\n'), 'utf8');
}
