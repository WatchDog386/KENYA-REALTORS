// src/components/portal/technician/CompletionReportForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceService } from '@/services/maintenanceService';
import { uploadImage } from '@/utils/supabaseStorage';

interface CompletionReportFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  propertyId: string;
  technicianId: string;
  onSuccess: () => void;
}

export const CompletionReportForm: React.FC<CompletionReportFormProps> = ({
  isOpen,
  onOpenChange,
  jobId,
  propertyId,
  technicianId,
  onSuccess
}) => {
  // Form state
  const [notes, setNotes] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [costEstimate, setCostEstimate] = useState('');

  // Image state
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);

  const [inProgressImage, setInProgressImage] = useState<File | null>(null);
  const [inProgressPreview, setInProgressPreview] = useState<string | null>(null);

  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'during' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const preview = URL.createObjectURL(file);

      if (type === 'before') {
        setBeforeImage(file);
        setBeforePreview(preview);
      } else if (type === 'during') {
        setInProgressImage(file);
        setInProgressPreview(preview);
      } else if (type === 'after') {
        setAfterImage(file);
        setAfterPreview(preview);
      }
    }
  };

  const removeImage = (type: 'before' | 'during' | 'after') => {
    if (type === 'before') {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      setBeforeImage(null);
      setBeforePreview(null);
    } else if (type === 'during') {
      if (inProgressPreview) URL.revokeObjectURL(inProgressPreview);
      setInProgressImage(null);
      setInProgressPreview(null);
    } else if (type === 'after') {
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      setAfterImage(null);
      setAfterPreview(null);
    }
  };

  const handleSubmit = async () => {
    // Validate that all images are uploaded
    if (!beforeImage || !inProgressImage || !afterImage) {
      toast.error('Please upload all three images (before, during, after)');
      return;
    }

    setSending(true);
    try {
      // Upload images to storage
      const folderPath = `${propertyId}/${jobId}`;

      const beforePath = await uploadImage('completion-reports', beforeImage, `${folderPath}/before`);
      const inProgressPath = await uploadImage('completion-reports', inProgressImage, `${folderPath}/during`);
      const afterPath = await uploadImage('completion-reports', afterImage, `${folderPath}/after`);

      // Create completion report
      await maintenanceService.createCompletionReport(
        jobId,
        technicianId,
        propertyId,
        {
          notes: notes || undefined,
          hours_spent: hoursSpent ? parseInt(hoursSpent) : undefined,
          materials_used: materialsUsed || undefined,
          cost_estimate: costEstimate ? parseFloat(costEstimate) : undefined,
          before_work_image_path: beforePath,
          in_progress_image_path: inProgressPath,
          after_repair_image_path: afterPath
        }
      );

      toast.success('Completion report submitted! Pending property manager approval.');
      onOpenChange(false);
      onSuccess();

      // Reset form
      setNotes('');
      setHoursSpent('');
      setMaterialsUsed('');
      setCostEstimate('');
      removeImage('before');
      removeImage('during');
      removeImage('after');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit completion report');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#154279]">
            Submit Completion Report
          </DialogTitle>
          <DialogDescription>
            Document your work with photos and details. All three images (before, during, after) are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">
                Hours Spent *
              </label>
              <Input
                type="number"
                placeholder="e.g., 2.5"
                min="0"
                step="0.5"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">
                Cost Estimate ($)
              </label>
              <Input
                type="number"
                placeholder="e.g., 150.00"
                min="0"
                step="0.01"
                value={costEstimate}
                onChange={(e) => setCostEstimate(e.target.value)}
                className="border-slate-200"
              />
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Materials Used
            </label>
            <Textarea
              placeholder="List materials/parts used (e.g., 1x copper pipe fitting, 2x washers)"
              value={materialsUsed}
              onChange={(e) => setMaterialsUsed(e.target.value)}
              rows={3}
              className="border-slate-200"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Work Notes
            </label>
            <Textarea
              placeholder="Describe the work performed, any issues encountered, recommendations for future maintenance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="border-slate-200"
            />
          </div>

          {/* Images */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Work Photos (Required)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Before Image */}
              <ImageUploadCard
                title="Before Work"
                preview={beforePreview}
                onUpload={(e) => handleImageChange(e, 'before')}
                onRemove={() => removeImage('before')}
              />

              {/* During Image */}
              <ImageUploadCard
                title="During Work"
                preview={inProgressPreview}
                onUpload={(e) => handleImageChange(e, 'during')}
                onRemove={() => removeImage('during')}
              />

              {/* After Image */}
              <ImageUploadCard
                title="After Repair"
                preview={afterPreview}
                onUpload={(e) => handleImageChange(e, 'after')}
                onRemove={() => removeImage('after')}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sending || !beforeImage || !inProgressImage || !afterImage}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for image upload
interface ImageUploadCardProps {
  title: string;
  preview: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const ImageUploadCard: React.FC<ImageUploadCardProps> = ({
  title,
  preview,
  onUpload,
  onRemove
}) => {
  return (
    <Card className="border-slate-200 overflow-hidden">
      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative group">
        {preview ? (
          <>
            <img
              src={preview}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={onRemove}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-bold text-sm"
              >
                Remove
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded">
              <Check className="w-4 h-4" />
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group-hover:bg-slate-100 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-600 text-center px-2">Click to upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
      <div className="p-3 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-700">{title}</h4>
      </div>
    </Card>
  );
};
