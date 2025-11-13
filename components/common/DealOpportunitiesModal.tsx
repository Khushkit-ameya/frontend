import React, { useState } from 'react';
import {
  useGetDealOpportunitiesQuery,
  useLinkOpportunityToDealMutation,
  useUnlinkOpportunityFromDealMutation,
} from '@/store/api_query/deals.api';
import { useGetOpportunitiesQuery } from '@/store/api_query/opportunities.api';
import { X, Link2, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

interface DealOpportunitiesModalProps {
  dealId: string;
  dealName: string;
  onClose: () => void;
}

type MinimalOpportunity = {
  id: string;
  name?: string;
  title?: string;
  recordId?: string;
  isPrimary?: boolean;
  relationshipType?: string;
  opportunityStatus?: string;
  stage?: string;
  opportunityStage?: string;
  linkedAt?: string;
};

const DealOpportunitiesModal: React.FC<DealOpportunitiesModalProps> = ({ dealId, dealName, onClose }) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'link'>('existing');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const [selectedOpportunityName, setSelectedOpportunityName] = useState('');
  const [opportunitySearchQuery, setOpportunitySearchQuery] = useState('');
  const [showOpportunityDropdown, setShowOpportunityDropdown] = useState(false);
  const [linkData, setLinkData] = useState({ relationshipType: 'related_to', isPrimary: false });

  // Queries
  const { data: opportunities, isLoading, refetch } = useGetDealOpportunitiesQuery(dealId);
  const { data: allOpportunitiesData } = useGetOpportunitiesQuery({ 
    page: 1, 
    limit: 100,
    search: opportunitySearchQuery 
  });
  
  const availableOpportunities = ((allOpportunitiesData as { items?: MinimalOpportunity[] } | undefined)?.items) ?? [];
  const linkedOpportunities: MinimalOpportunity[] = (opportunities as MinimalOpportunity[] | undefined) ?? [];

  // Mutations
  const [linkOpportunity, { isLoading: isLinking }] = useLinkOpportunityToDealMutation();
  const [unlinkOpportunity, { isLoading: isUnlinking }] = useUnlinkOpportunityFromDealMutation();

  const handleSelectOpportunity = (opportunity: MinimalOpportunity) => {
    setSelectedOpportunityId(opportunity.id);
    const display = opportunity.name || opportunity.title || 'Untitled Opportunity';
    setSelectedOpportunityName(display);
    setOpportunitySearchQuery(display);
    setShowOpportunityDropdown(false);
  };

  const handleLinkOpportunity = async () => {
    if (!selectedOpportunityId) {
      alert('Please select an opportunity to link');
      return;
    }
    try {
      await linkOpportunity({ dealId, opportunityId: selectedOpportunityId, data: linkData }).unwrap();
      setSelectedOpportunityId('');
      setSelectedOpportunityName('');
      setOpportunitySearchQuery('');
      setActiveTab('existing');
      refetch();
    } catch (error: unknown) {
      console.error('Failed to link opportunity:', error);
      const msg = (error as { data?: { message?: string } })?.data?.message || 'Failed to link opportunity.';
      alert(msg);
    }
  };

  const handleUnlinkOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to unlink this opportunity?')) return;
    try {
      await unlinkOpportunity({ dealId, opportunityId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to unlink opportunity:', error);
      alert('Failed to unlink opportunity. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Opportunities</h2>
            <p className="text-sm text-gray-600 mt-1">Deal: {dealName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'existing'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Linked Opportunities ({linkedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'link'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Link Existing Opportunity
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'existing' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading opportunities...</div>
              ) : linkedOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No opportunities linked to this deal yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Link an existing opportunity to get started.</p>
                </div>
              ) : (
                linkedOpportunities.map((op: MinimalOpportunity) => (
                  <div key={op.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {op.name || op.title || op.recordId || 'Untitled Opportunity'}
                          </h3>
                          {op.isPrimary && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Primary</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Opportunity ID:</span>
                            <span className="ml-2 text-gray-900">{op.recordId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Relationship:</span>
                            <span className="ml-2 text-gray-900 capitalize">{op.relationshipType?.replace(/_/g, ' ') || 'Related'}</span>
                          </div>
                          {(op.opportunityStatus || op.stage || op.opportunityStage) && (
                            <div>
                              <span className="text-gray-600">Stage:</span>
                              <span className="ml-2 text-gray-900 capitalize">{String(op.opportunityStatus || op.stage || op.opportunityStage).replace(/_/g, ' ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">Linked on: {op.linkedAt ? new Date(op.linkedAt).toLocaleDateString() : '-'}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => window.open(`/opportunities/${op.id}`, '_blank')}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="View Opportunity"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUnlinkOpportunity(op.id)}
                          disabled={isUnlinking}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Unlink Opportunity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">Link an existing opportunity to this deal. You can specify the relationship type.</p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={opportunitySearchQuery}
                  onChange={(e) => {
                    setOpportunitySearchQuery(e.target.value);
                    setShowOpportunityDropdown(true);
                  }}
                  onFocus={() => setShowOpportunityDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Search for an opportunity by name"
                />
                {showOpportunityDropdown && availableOpportunities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableOpportunities
                      .filter((opp: MinimalOpportunity) => 
                        (opp.name || opp.title || '').toLowerCase().includes(opportunitySearchQuery.toLowerCase())
                      )
                      .map((opp: MinimalOpportunity) => (
                        <div
                          key={opp.id}
                          onClick={() => handleSelectOpportunity(opp)}
                          className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{opp.name || opp.title || 'Untitled Opportunity'}</div>
                          <div className="text-xs text-gray-500">ID: {opp.recordId || opp.id}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Search and select an existing opportunity to link to this deal</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                <select
                  value={linkData.relationshipType}
                  onChange={(e) => setLinkData({ ...linkData, relationshipType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="related_to">Related To</option>
                  <option value="originated_from">Originated From</option>
                  <option value="merged_from">Merged From</option>
                  <option value="split_from">Split From</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={linkData.isPrimary}
                  onChange={(e) => setLinkData({ ...linkData, isPrimary: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">Set as primary opportunity for this deal</label>
              </div>

              <button
                onClick={handleLinkOpportunity}
                disabled={!selectedOpportunityId || isLinking}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Link2 className="w-5 h-5" />
                {isLinking ? 'Linking Opportunity...' : 'Link Opportunity'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealOpportunitiesModal;
