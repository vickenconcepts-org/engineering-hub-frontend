import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { projectService, Project } from '../services/project.service';

interface MilestoneFormData {
  title: string;
  description: string;
  amount: string;
  sequence_order: number;
}

interface CreateMilestonesPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function CreateMilestonesPage({ userRole }: CreateMilestonesPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id || '';
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([
    {
      title: '',
      description: '',
      amount: '',
      sequence_order: 1,
    },
  ]);
  
  useEffect(() => {
    if (projectId && userRole === 'company') {
      loadProject();
    } else if (userRole !== 'company') {
      toast.error('Only companies can create milestones');
      navigate('/projects');
    }
  }, [projectId, userRole]);
  
  const loadProject = async () => {
    try {
      setIsLoading(true);
      const fetchedProject = await projectService.getForCompany(projectId);
      
      if (fetchedProject.status !== 'draft') {
        toast.error('Can only create milestones for draft projects');
        navigate(`/projects/${projectId}`);
        return;
      }
      
      setProject(fetchedProject);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: '',
        description: '',
        amount: '',
        sequence_order: milestones.length + 1,
      },
    ]);
  };
  
  const removeMilestone = (index: number) => {
    if (milestones.length === 1) {
      toast.error('At least one milestone is required');
      return;
    }
    
    const updated = milestones.filter((_, i) => i !== index);
    // Reorder sequence numbers
    updated.forEach((milestone, i) => {
      milestone.sequence_order = i + 1;
    });
    setMilestones(updated);
  };
  
  const updateMilestone = (index: number, field: keyof MilestoneFormData, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    
    // If sequence_order changed, update it
    if (field === 'sequence_order') {
      updated[index].sequence_order = value as number;
    }
    
    setMilestones(updated);
  };
  
  const calculateTotal = () => {
    return milestones.reduce((total, milestone) => {
      const amount = parseFloat(milestone.amount) || 0;
      return total + amount;
    }, 0);
  };
  
  const validateMilestones = (): boolean => {
    // Check for empty required fields
    for (const milestone of milestones) {
      if (!milestone.title.trim()) {
        toast.error('All milestones must have a title');
        return false;
      }
      if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
        toast.error('All milestones must have a valid amount');
        return false;
      }
    }
    
    // Check for unique sequence orders
    const sequenceOrders = milestones.map(m => m.sequence_order);
    const uniqueOrders = new Set(sequenceOrders);
    if (uniqueOrders.size !== sequenceOrders.length) {
      toast.error('Sequence orders must be unique');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMilestones()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const milestonesData = milestones.map(m => ({
        title: m.title.trim(),
        description: m.description.trim() || undefined,
        amount: parseFloat(m.amount),
        sequence_order: m.sequence_order,
      }));
      
      await projectService.createMilestones(projectId, milestonesData);
      toast.success('Milestones created successfully! The project will become active once the client verifies all milestones.');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to create milestones:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading project...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Project not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
          <h1 className="text-2xl font-semibold text-[#334155]">Create Milestones</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Define project milestones for {project.title}. The project will become active once the client verifies all milestones.
          </p>
        </div>
      </div>
      
      {/* Project Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#334155]">{project.title}</p>
              <p className="text-xs text-[#64748B] mt-1">{project.location}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#64748B]">Total Milestones</p>
              <p className="text-lg font-semibold text-[#334155]">{milestones.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Milestones Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Milestones</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F8FAFC]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-sm font-medium">
                        {milestone.sequence_order}
                      </div>
                      <h3 className="text-sm font-medium text-[#334155]">
                        Milestone {index + 1}
                      </h3>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Milestone Title"
                        placeholder="e.g., Foundation, Roofing, Finishing"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Input
                        label="Amount (₦)"
                        type="number"
                        placeholder="0.00"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <Input
                        label="Sequence Order"
                        type="number"
                        value={milestone.sequence_order.toString()}
                        onChange={(e) => {
                          const order = parseInt(e.target.value) || 1;
                          updateMilestone(index, 'sequence_order', order);
                        }}
                        min="1"
                        required
                      />
                      <p className="text-xs text-[#64748B] mt-1">
                        Order in which this milestone should be completed
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Textarea
                        label="Description (Optional)"
                        placeholder="Describe what work will be completed in this milestone..."
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Summary */}
            <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[#334155]">Total Project Value</span>
                <span className="text-2xl font-bold text-[#1E3A8A]">
                  ₦{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <div className="mt-6 flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#1E3A8A] text-white"
          >
            {isSaving ? 'Creating...' : 'Create Milestones'}
          </Button>
        </div>
      </form>
    </div>
  );
}

