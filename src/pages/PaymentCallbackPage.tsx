import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import apiClient, { extractData, ApiResponse } from '../lib/api-client';
import toast from 'react-hot-toast';

interface PaymentCallbackPageProps {
}

export function PaymentCallbackPage({}: PaymentCallbackPageProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  // Get reference and status from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const paymentStatus = searchParams.get('status'); // 'success', 'failed', or 'error'
  const errorMessage = searchParams.get('message');
  
  useEffect(() => {
    if (paymentStatus === 'success' && reference) {
      // Payment was already verified by backend, just fetch the updated data
      handleSuccessfulPayment(reference);
    } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
      // Payment failed
      setStatus('error');
      setMessage(errorMessage || 'Payment verification failed. Please contact support.');
      toast.error(errorMessage || 'Payment verification failed');
    } else if (reference) {
      // Fallback: verify payment via API (shouldn't happen if backend works correctly)
      verifyPayment(reference);
    } else {
      setStatus('error');
      setMessage('No payment reference found');
    }
  }, []);
  
  const handleSuccessfulPayment = async (paymentReference: string) => {
    try {
      setStatus('verifying');
      
      // Fetch the payment details to determine redirect path
      const response = await apiClient.post<ApiResponse<any>>('/payments/verify', {
        reference: paymentReference,
      });
      
      const data = extractData(response.data);
      
      // Determine redirect path from response
      let consultationId = null;
      let milestoneId = null;
      let projectId = null;
      
      if (data.consultation_id || (data.consultation && data.consultation.id)) {
        consultationId = data.consultation_id || data.consultation?.id;
      } else if (data.milestone_id || (data.milestone && data.milestone.id)) {
        milestoneId = data.milestone_id || data.milestone?.id;
        projectId = data.project_id || data.milestone?.project_id || data.project?.id;
      } else if (data.metadata) {
        consultationId = data.metadata.consultation_id;
        milestoneId = data.metadata.milestone_id;
        projectId = data.metadata.project_id;
      }
      
      // Set redirect path and message
      let finalRedirectPath = '/dashboard';
      if (consultationId) {
        finalRedirectPath = `/consultations/${consultationId}`;
        setMessage('Consultation payment successful!');
      } else if (milestoneId) {
        finalRedirectPath = `/milestones/${milestoneId}`;
        setMessage('Escrow funded successfully!');
      } else if (projectId) {
        finalRedirectPath = `/projects/${projectId}`;
        setMessage('Escrow funded successfully!');
      } else {
        setMessage('Payment verified successfully!');
      }
      
      setRedirectPath(finalRedirectPath);
      setStatus('success');
      toast.success(response.data.message || 'Payment verified successfully!');
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate(finalRedirectPath);
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to fetch payment details:', error);
      // Even if fetch fails, payment was successful, so show success
      setStatus('success');
      setMessage('Payment successful!');
      setRedirectPath('/dashboard');
      toast.success('Payment successful!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  };
  
  const verifyPayment = async (paymentReference: string) => {
    try {
      setStatus('verifying');
      
      const response = await apiClient.post<ApiResponse<any>>('/payments/verify', {
        reference: paymentReference,
      });
      
      const data = extractData(response.data);
      
      // Check the response data structure
      let consultationId = null;
      let milestoneId = null;
      let projectId = null;
      
      // Try to determine payment type from response
      if (data.consultation_id || (data.consultation && data.consultation.id)) {
        consultationId = data.consultation_id || data.consultation?.id;
        setRedirectPath(`/consultations/${consultationId}`);
        setMessage('Consultation payment successful!');
      } else if (data.milestone_id || (data.milestone && data.milestone.id)) {
        milestoneId = data.milestone_id || data.milestone?.id;
        projectId = data.project_id || data.milestone?.project_id || data.project?.id;
        if (milestoneId) {
          setRedirectPath(`/milestones/${milestoneId}`);
        } else if (projectId) {
          setRedirectPath(`/projects/${projectId}`);
        } else {
          setRedirectPath('/projects');
        }
        setMessage('Escrow funded successfully!');
      } else {
        setRedirectPath('/dashboard');
        setMessage('Payment verified successfully!');
      }
      
      setStatus('success');
      toast.success(response.data.message || 'Payment verified successfully!');
      
      // Auto-redirect after 3 seconds
      const finalRedirectPath = consultationId 
        ? `/consultations/${consultationId}`
        : milestoneId 
          ? `/milestones/${milestoneId}`
          : projectId
            ? `/projects/${projectId}`
            : '/dashboard';
      
      setTimeout(() => {
        navigate(finalRedirectPath);
      }, 3000);
      
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support.');
      toast.error(error.response?.data?.message || 'Payment verification failed');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <Loader2 className="w-16 h-16 text-[#1E3A8A] animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#334155] mb-2">
                  Verifying Payment
                </h2>
                <p className="text-sm text-[#64748B]">
                  Please wait while we verify your payment...
                </p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-[#16A34A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#334155] mb-2">
                  Payment Successful!
                </h2>
                <p className="text-sm text-[#64748B] mb-6">
                  {message}
                </p>
                {redirectPath && (
                  <Button
                    onClick={() => navigate(redirectPath)}
                    className="w-full"
                  >
                    Continue
                  </Button>
                )}
                <p className="text-xs text-[#64748B] mt-4">
                  Redirecting automatically...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-[#DC2626]" />
                </div>
                <h2 className="text-xl font-semibold text-[#334155] mb-2">
                  Payment Verification Failed
                </h2>
                <p className="text-sm text-[#64748B] mb-6">
                  {message}
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

