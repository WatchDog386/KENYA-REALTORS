// src/components/database/MigrationRunner.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { runMigrations, checkDatabaseTables, setupDatabase } from '@/services/databaseSetup';
import { toast } from 'sonner';

export const MigrationRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [tableCheck, setTableCheck] = useState<any>(null);

  const handleRunMigrations = async () => {
    setIsRunning(true);
    try {
      const result = await runMigrations();
      setStatus(result);
      
      if (result.success) {
        toast.success('Migrations completed successfully!');
      } else {
        toast.warning('Migrations completed with warnings');
      }
    } catch (error) {
      toast.error('Failed to run migrations');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckTables = async () => {
    const result = await checkDatabaseTables();
    setTableCheck(result);
    
    if (result.allTablesExist) {
      toast.success('All database tables exist!');
    } else {
      toast.error('Some tables are missing');
    }
  };

  const handleSetupDatabase = async () => {
    setIsRunning(true);
    try {
      const result = await setupDatabase();
      
      if (result.success) {
        toast.success(result.action === 'created' ? 'Profile created!' : 'Profile exists!');
      } else {
        toast.error(result.error || 'Setup failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration Runner
        </CardTitle>
        <CardDescription>
          Run database migrations and check table status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleRunMigrations} 
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migrations...
                </>
              ) : (
                'Run Migrations'
              )}
            </Button>
            
            <Button 
              onClick={handleCheckTables} 
              variant="outline"
              disabled={isRunning}
            >
              Check Tables
            </Button>
            
            <Button 
              onClick={handleSetupDatabase} 
              variant="secondary"
              disabled={isRunning}
            >
              Setup Database
            </Button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg border ${status.success ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {status.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <h4 className="font-semibold">Migration Status</h4>
              </div>
              <p className="text-sm">{status.message}</p>
              {status.details && (
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(status.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {tableCheck && (
            <div className="space-y-3">
              <h4 className="font-semibold">Table Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(tableCheck).map(([table, exists]) => {
                  if (typeof exists !== 'boolean') return null;
                  
                  return (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{table}</span>
                      <Badge variant={exists ? "success" : "destructive"}>
                        {exists ? 'Exists' : 'Missing'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> If tables are missing, please run the SQL migrations in the Supabase SQL Editor.
                  Copy the SQL from <code>supabase/migrations/001_super_admin_system.sql</code> first, then run <code>002_sample_data.sql</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};