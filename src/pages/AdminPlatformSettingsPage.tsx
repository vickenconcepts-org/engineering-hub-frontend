import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Settings, DollarSign, Info } from 'lucide-react';

export function AdminPlatformSettingsPage() {
  const navigate = useNavigate();
  const [platformFee, setPlatformFee] = useState<number>(6.5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feeInput, setFeeInput] = useState<string>('6.5');

  useEffect(() => {
    loadPlatformFee();
  }, []);

  const loadPlatformFee = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getPlatformFee();
      setPlatformFee(data.percentage);
      setFeeInput(data.percentage.toString());
    } catch (error) {
      console.error('Failed to load platform fee:', error);
      toast.error('Failed to load platform fee settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const percentage = parseFloat(feeInput);
    
    if (isNaN(percentage) || percentage < 5 || percentage > 8) {
      toast.error('Platform fee must be between 5% and 8%');
      return;
    }

    try {
      setIsSaving(true);
      const data = await adminService.updatePlatformFee(percentage);
      setPlatformFee(data.percentage);
      setFeeInput(data.percentage.toString());
      toast.success('Platform fee updated successfully');
    } catch (error: any) {
      console.error('Failed to update platform fee:', error);
      toast.error(error.response?.data?.message || 'Failed to update platform fee');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#334155] mb-2">Platform Settings</h1>
        <p className="text-sm text-[#64748B]">Manage platform fee percentage and other settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#F97316]" />
            <CardTitle>Platform Fee</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#64748B]">Loading platform fee settings...</p>
            </div>
          ) : (
            <>
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#64748B]" />
                  <p className="text-sm font-medium text-[#334155]">Current Platform Fee</p>
                </div>
                <p className="text-2xl font-bold text-[#F97316]">{platformFee}%</p>
                <p className="text-xs text-[#64748B] mt-1">
                  This percentage is deducted from escrow amounts when funds are released to companies.
                  The fee must be between 5% and 8% as per PRD requirements.
                </p>
              </div>

              <div>
                <Input
                  label="Platform Fee Percentage (%)"
                  type="number"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  min={5}
                  max={8}
                  step={0.1}
                  helperText="Enter a value between 5% and 8%"
                />
              </div>

              <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
                <p className="text-sm text-[#92400E]">
                  <strong>Note:</strong> Changing the platform fee will only affect new escrow deposits.
                  Existing escrows will use the fee percentage that was set when they were created.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/dashboard')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || parseFloat(feeInput) === platformFee}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fee Calculation Example */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fee Calculation Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#64748B]">Escrow Amount</span>
              <span className="font-medium text-[#334155]">₦100,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#64748B]">Platform Fee ({platformFee}%)</span>
              <span className="font-medium text-[#F97316]">
                ₦{(100000 * platformFee / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-[#334155]">Amount to Company</span>
              <span className="text-lg font-bold text-[#334155]">
                ₦{(100000 * (1 - platformFee / 100)).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

