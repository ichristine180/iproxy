"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";

interface PlanPricing {
  id: string;
  plan_id: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price_usd: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  channel: 'mobile' | 'residential' | 'datacenter';
  rotation_api: boolean;
  description: string | null;
  features: any;
  is_active: boolean;
  pricing: PlanPricing[];
  created_at: string;
  updated_at: string;
}

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    channel: 'mobile' as 'mobile' | 'residential' | 'datacenter',
    rotation_api: false,
    description: '',
    is_active: true,
    pricing: [] as Array<{ duration: string; price_usd: string }>,
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.append('includeInactive', 'true');

      const response = await fetch(`/api/admin/plans?${params.toString()}`);
      const data = await response.json();

      console.log('API Response:', data);

      if (data.success) {
        console.log('Plans data:', data.plans);
        setPlans(data.plans);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [showInactive]);

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        channel: plan.channel,
        rotation_api: plan.rotation_api,
        description: plan.description || '',
        is_active: plan.is_active,
        pricing: plan.pricing?.map(p => ({
          duration: p.duration,
          price_usd: p.price_usd.toString(),
        })) || [],
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        channel: 'mobile',
        rotation_api: false,
        description: '',
        is_active: true,
        pricing: [{ duration: 'monthly', price_usd: '' }],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      channel: 'mobile',
      rotation_api: false,
      description: '',
      is_active: true,
      pricing: [{ duration: 'monthly', price_usd: '' }],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans';
      const method = editingPlan ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlans();
        handleCloseDialog();
      } else {
        setErrorMessage(data.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setErrorMessage('Failed to save plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (planId: string, planName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate Plan',
      message: `Are you sure you want to deactivate the plan "${planName}"? This will hide it from users but keep all data intact.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/plans/${planId}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            await fetchPlans();
          } else {
            setErrorMessage(data.error || 'Failed to deactivate plan');
          }
        } catch (error) {
          console.error('Error deleting plan:', error);
          setErrorMessage('Failed to deactivate plan. Please try again.');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      },
    });
  };

  const getChannelBadge = (channel: string) => {
    const channelStyles = {
      mobile: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      residential: "bg-green-500/10 text-green-400 border-green-500/20",
      datacenter: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-sm border capitalize ${
          channelStyles[channel as keyof typeof channelStyles] || channelStyles.mobile
        }`}
      >
        {channel}
      </span>
    );
  };

  if (isLoading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              Plan Management
              {plans.length > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[rgb(var(--brand-400))] text-white">
                  {plans.length}
                </span>
              )}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Create and manage subscription plans
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
            className="border-neutral-700"
          >
            {showInactive ? 'Hide' : 'Show'} Inactive
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800" style={{ borderWidth: '1px', borderColor: 'rgb(38, 38, 38)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No plans found</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="mt-4 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Plan Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Channel
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Pricing
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Rotation API
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b hover:bg-neutral-800/50 transition-colors"
                    style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-neutral-500 mt-1">
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">{getChannelBadge(plan.channel)}</td>
                    <td className="py-4 px-4">
                      {plan.pricing && plan.pricing.length > 0 ? (
                        <div className="space-y-1">
                          {plan.pricing.map((p) => (
                            <div key={p.id} className="text-white text-sm">
                              <span className="text-neutral-400 capitalize">{p.duration}:</span>{' '}
                              <span className="font-semibold">${Number(p.price_usd).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-sm">No pricing set</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {plan.rotation_api ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-neutral-600" />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {plan.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDialog(plan)}
                          className="p-2 text-neutral-400 hover:text-white transition-colors"
                          title="Edit Plan"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {plan.is_active && (
                          <button
                            onClick={() => handleDelete(plan.id, plan.name)}
                            className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                            title="Deactivate Plan"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgb(38, 38, 38)' }}>
            <div className="p-6 border-b" style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}>
              <h2 className="text-2xl font-bold text-white">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-neutral-800/50 rounded-lg text-white focus:outline-none"
                  style={{ border: '1px solid rgb(64, 64, 64)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(114, 150, 245)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgb(64, 64, 64)'}
                  placeholder="e.g., Premium Mobile"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Channel *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 bg-neutral-800/50 rounded-lg text-white focus:outline-none"
                  style={{ border: '1px solid rgb(64, 64, 64)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(114, 150, 245)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgb(64, 64, 64)'}
                >
                  <option value="mobile">Mobile</option>
                  <option value="residential">Residential</option>
                  <option value="datacenter">Datacenter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Pricing *
                </label>
                <div className="space-y-3">
                  {formData.pricing.map((price, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={price.duration}
                        onChange={(e) => {
                          const newPricing = [...formData.pricing];
                          if (newPricing[index]) {
                            newPricing[index].duration = e.target.value;
                            setFormData({ ...formData, pricing: newPricing });
                          }
                        }}
                        className="px-4 py-2 bg-neutral-800/50 rounded-lg text-white focus:outline-none"
                        style={{ border: '1px solid rgb(64, 64, 64)' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(114, 150, 245)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgb(64, 64, 64)'}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price.price_usd}
                        onChange={(e) => {
                          const newPricing = [...formData.pricing];
                          if (newPricing[index]) {
                            newPricing[index].price_usd = e.target.value;
                            setFormData({ ...formData, pricing: newPricing });
                          }
                        }}
                        required
                        className="flex-1 px-4 py-2 bg-neutral-800/50 rounded-lg text-white focus:outline-none"
                        style={{ border: '1px solid rgb(64, 64, 64)' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(114, 150, 245)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgb(64, 64, 64)'}
                        placeholder="Price (USD)"
                      />
                      {formData.pricing.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPricing = formData.pricing.filter((_, i) => i !== index);
                            setFormData({ ...formData, pricing: newPricing });
                          }}
                          className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        pricing: [...formData.pricing, { duration: 'monthly', price_usd: '' }],
                      });
                    }}
                    className="w-full px-4 py-2 bg-neutral-800/50 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors text-sm"
                    style={{ border: '1px solid rgb(64, 64, 64)' }}
                  >
                    + Add Pricing Tier
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-neutral-800/50 rounded-lg text-white focus:outline-none resize-none"
                  style={{ border: '1px solid rgb(64, 64, 64)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgb(114, 150, 245)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgb(64, 64, 64)'}
                  placeholder="Brief description of the plan"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rotation_api"
                  checked={formData.rotation_api}
                  onChange={(e) => setFormData({ ...formData, rotation_api: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800/50 text-[rgb(var(--brand-400))] focus:ring-[rgb(var(--brand-400))] focus:ring-offset-0"
                />
                <label htmlFor="rotation_api" className="text-sm text-neutral-300">
                  Enable Rotation API
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800/50 text-[rgb(var(--brand-400))] focus:ring-[rgb(var(--brand-400))] focus:ring-offset-0"
                />
                <label htmlFor="is_active" className="text-sm text-neutral-300">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                  className="flex-1 border-neutral-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingPlan ? (
                    'Update Plan'
                  ) : (
                    'Create Plan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl w-full max-w-md" style={{ border: '1px solid rgb(38, 38, 38)' }}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">
                {confirmDialog.title}
              </h2>
              <p className="text-neutral-300 text-sm mb-6">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                  className="flex-1 border-neutral-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Dialog */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl w-full max-w-md" style={{ border: '1px solid rgb(38, 38, 38)' }}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Error
              </h2>
              <p className="text-neutral-300 text-sm mb-6">
                {errorMessage}
              </p>
              <Button
                onClick={() => setErrorMessage('')}
                className="w-full bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
