import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addHours } from 'date-fns';
import { ArrowRight, ArrowLeft, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { REASONS } from '../../data/mockData';
import StepperProgress from '../../components/ui/StepperProgress';
import { passApi } from '../../lib/api';

const NewRequestPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    parentMobile: '9845012345',
    reasonType: '',
    reasonDetail: '',
    outTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    expectedReturn: format(addHours(new Date(), 4), "yyyy-MM-dd'T'HH:mm"),
  });

  const STEPS = [
    { label: 'Details' },
    { label: 'Reason & Time' },
    { label: 'Review' },
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await passApi.create({
        reason: formData.reasonType,
        reasonDetail: formData.reasonDetail,
        outTime: formData.outTime,
        expectedReturn: formData.expectedReturn,
      });
      navigate('/student/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-sora text-text-primary">Request Gate Pass</h1>
        <p className="text-text-muted mt-1 text-sm">Fill in the details to generate a new gate pass request.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 mb-6">
        <div className="mb-8 hidden sm:block">
          <StepperProgress steps={STEPS} current={step} />
        </div>
        <div className="mb-6 sm:hidden text-sm font-semibold text-accent-primary">
          Step {step + 1} of 3: {STEPS[step].label}
        </div>

        {/* Step 0: Basic Details */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex gap-4">
              <ShieldCheck className="text-accent-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Auto-filled from your profile</p>
                <p className="text-xs text-blue-700/70 mt-1">Contact admin if these details are incorrect.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="float-label-group">
                <input type="text" value={user?.name} disabled className="bg-bg-muted" />
                <label>Student Name</label>
              </div>
              <div className="float-label-group">
                <input type="text" value={user?.usn ?? ''} disabled className="bg-bg-muted" />
                <label>USN</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="float-label-group">
                <input type="text" value={user?.room ?? ''} disabled className="bg-bg-muted" />
                <label>Room Number</label>
              </div>
              <div className="float-label-group">
                <input type="text" value={user?.hostel ?? ''} disabled className="bg-bg-muted" />
                <label>Hostel Block</label>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <div className="float-label-group">
                <input 
                  type="tel" 
                  value={formData.parentMobile}
                  onChange={e => setFormData({...formData, parentMobile: e.target.value})}
                />
                <label>Parent/Guardian Mobile Number</label>
              </div>
              <p className="text-xs text-text-muted mt-2 ml-1">An approval link will be sent via SMS to this number.</p>
            </div>
          </div>
        )}

        {/* Step 1: Reason and Time */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="float-label-group">
              <select 
                value={formData.reasonType}
                onChange={e => setFormData({...formData, reasonType: e.target.value})}
                className="appearance-none"
              >
                <option value="" disabled></option>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <label>Reason Category</label>
            </div>

            <div className="float-label-group">
              <textarea 
                value={formData.reasonDetail}
                onChange={e => setFormData({...formData, reasonDetail: e.target.value})}
                rows={3}
                className="resize-none pt-6"
                placeholder="Briefly detail your reason for going out..."
              />
              <label>Specific Reason / Destination</label>
            </div>

            <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100 flex gap-4">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
              <p className="text-xs text-amber-800 leading-relaxed">
                Passes requested between <strong>9:00 PM and 6:00 AM</strong> require immediate Warden approval. Parent approval is mandatory for all requests.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="float-label-group">
                <input 
                  type="datetime-local" 
                  value={formData.outTime}
                  onChange={e => setFormData({...formData, outTime: e.target.value})}
                />
                <label>Out Time</label>
              </div>
              <div className="float-label-group">
                <input 
                  type="datetime-local" 
                  value={formData.expectedReturn}
                  onChange={e => setFormData({...formData, expectedReturn: e.target.value})}
                />
                <label>Expected Return</label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-bg-muted rounded-xl p-6 border border-border space-y-4">
              <h3 className="font-semibold text-text-primary border-b border-border pb-2 mb-4">Request Summary</h3>
              
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs mb-1">Reason</p>
                  <p className="font-medium text-text-primary">{REASONS.find(r => r.value === formData.reasonType)?.label}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-1">Details</p>
                  <p className="font-medium text-text-primary truncate" title={formData.reasonDetail}>{formData.reasonDetail}</p>
                </div>
                
                <div>
                  <p className="text-text-muted text-xs mb-1">Out Time</p>
                  <p className="font-medium text-text-primary">{format(new Date(formData.outTime), 'MMM d, h:mm a')}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-1">Expected Return</p>
                  <p className="font-medium text-text-primary">{format(new Date(formData.expectedReturn), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-sm text-emerald-800 font-medium mb-2">Approval Flow:</p>
              <ol className="list-decimal list-inside text-xs text-emerald-700/80 space-y-1 ml-1">
                <li>SMS sent to Parent ({formData.parentMobile})</li>
                <li>Upon parent approval, Warden reviews request</li>
                <li>QR Code is generated upon final approval</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button 
          onClick={handleBack} 
          disabled={step === 0 || isSubmitting}
          className="btn btn-ghost disabled:opacity-0"
        >
          <ArrowLeft size={16} /> Back
        </button>
        
        {step < 2 ? (
          <button 
            onClick={handleNext} 
            disabled={step === 1 && (!formData.reasonType || !formData.reasonDetail)}
            className="btn btn-primary min-w-[120px]"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="btn btn-success min-w-[150px]"
          >
            {isSubmitting ? 'Submitting...' : <><Check size={16} /> Submit Request</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewRequestPage;
