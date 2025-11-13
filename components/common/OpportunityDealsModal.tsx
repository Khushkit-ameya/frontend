import React, { useState, useEffect } from 'react';
import { 
  useGetOpportunityDealsQuery,
  useCreateDealFromOpportunityMutation,
  useLinkDealToOpportunityMutation,
  useUnlinkDealFromOpportunityMutation,
} from '../../store/api_query/opportunities.api';
import { useGetDealsQuery } from '../../store/api_query/deals.api';
import { X, Plus, Link2, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

interface OpportunityDealsModalProps {
  opportunityId: string;
  opportunityName: string;
  onClose: () => void;
}

// Interface for linked deals
interface LinkedDeal {
  id: string;
  recordId?: string;
  dealName?: string;
  name?: string;
  dealDescription?: string;
  dealValue?: string | number;
  dealStage?: string;
  relationshipType?: string;
  isPrimary?: boolean;
  linkedAt: string;
}

// Interface for deal objects from the deals API
interface Deal {
  id: string;
  recordId?: string;
  dealName?: string;
  name?: string;
  dealDescription?: string;
  dealValue?: string | number;
  dealStage?: string;
}

// Interface for deals API response
interface DealsResponse {
  items: Deal[];
  total?: number;
  page?: number;
  limit?: number;
}

const OpportunityDealsModal: React.FC<OpportunityDealsModalProps> = ({
  opportunityId,
  opportunityName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'create' | 'link'>('existing');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedDealName, setSelectedDealName] = useState('');
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [newDealData, setNewDealData] = useState({
    dealName: '',
    dealDescription: '',
    dealValue: '',
    closeProbability: '',
    closeDate: '',
  });
  const [linkData, setLinkData] = useState({
    relationshipType: 'related_to',
    isPrimary: false,
  });

  // Queries with proper typing
  const { data: deals, isLoading, refetch } = useGetOpportunityDealsQuery(opportunityId);
  const { data: allDealsData } = useGetDealsQuery({ 
    page: 1, 
    limit: 100,
    search: dealSearchQuery 
  });
  
  // Properly type the API response
  const availableDeals = (allDealsData as DealsResponse)?.items || [];

  // Mutations
  const [createDeal, { isLoading: isCreating }] = useCreateDealFromOpportunityMutation();
  const [linkDeal, { isLoading: isLinking }] = useLinkDealToOpportunityMutation();
  const [unlinkDeal, { isLoading: isUnlinking }] = useUnlinkDealFromOpportunityMutation();

  const handleCreateDeal = async () => {
    try {
      await createDeal({
        opportunityId,
        data: {
          dealName: newDealData.dealName,
          dealDescription: newDealData.dealDescription,
          dealValue: parseFloat(newDealData.dealValue) || 0,
          closeProbability: parseFloat(newDealData.closeProbability) || 0,
          closeDate: newDealData.closeDate || new Date().toISOString(),
        },
      }).unwrap();
      
      setNewDealData({
        dealName: '',
        dealDescription: '',
        dealValue: '',
        closeProbability: '',
        closeDate: '',
      });
      setActiveTab('existing');
      refetch();
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert('Failed to create deal. Please try again.');
    }
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setSelectedDealName(deal.dealName || deal.name || 'Untitled Deal');
    setDealSearchQuery(deal.dealName || deal.name || '');
    setShowDealDropdown(false);
  };

  const handleLinkDeal = async () => {
    if (!selectedDealId) {
      alert('Please select a deal to link');
      return;
    }

    try {
      await linkDeal({
        opportunityId,
        dealId: selectedDealId,
        data: linkData,
      }).unwrap();
      
      setSelectedDealId('');
      setSelectedDealName('');
      setDealSearchQuery('');
      setActiveTab('existing');
      refetch();
    } catch (error) {
      console.error('Failed to link deal:', error);
      alert('Failed to link deal. Please try again.');
    }
  };

  const handleUnlinkDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to unlink this deal?')) return;

    try {
      await unlinkDeal({ opportunityId, dealId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to unlink deal:', error);
      alert('Failed to unlink deal. Please try again.');
    }
  };

  // Type guard to check if deals is an array
  const linkedDeals: LinkedDeal[] = Array.isArray(deals) ? deals : [];

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Deals</h2>
            <p className="text-sm text-gray-600 mt-1">Opportunity: {opportunityName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
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
              Linked Deals ({linkedDeals.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create New Deal
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'link'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Link Existing Deal
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'existing' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading deals...</div>
              ) : linkedDeals.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No deals linked to this opportunity yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Create a new deal or link an existing one to get started.
                  </p>
                </div>
              ) : (
                linkedDeals.map((deal: LinkedDeal) => (
                  <div
                    key={deal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {deal.dealName || deal.name || 'Untitled Deal'}
                          </h3>
                          {deal.isPrimary && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Deal ID:</span>
                            <span className="ml-2 text-gray-900">{deal.recordId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Relationship:</span>
                            <span className="ml-2 text-gray-900 capitalize">
                              {deal.relationshipType?.replace(/_/g, ' ') || 'Related'}
                            </span>
                          </div>
                          {deal.dealValue && (
                            <div>
                              <span className="text-gray-600">Value:</span>
                              <span className="ml-2 text-gray-900 font-medium">
                                ${parseFloat(deal.dealValue.toString()).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {deal.dealStage && (
                            <div>
                              <span className="text-gray-600">Stage:</span>
                              <span className="ml-2 text-gray-900 capitalize">
                                {String(deal.dealStage).replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {deal.dealDescription && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {deal.dealDescription.length > 100 ? `${deal.dealDescription.slice(0, 100)}...` : deal.dealDescription}
                          </p>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Linked on: {new Date(deal.linkedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => window.open(`/deals/${deal.id}`, '_blank')}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="View Deal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUnlinkDeal(deal.id)}
                          disabled={isUnlinking}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Unlink Deal"
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

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  Create a new deal directly from this opportunity. The deal will be automatically linked.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDealData.dealName}
                  onChange={(e) => setNewDealData({ ...newDealData, dealName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter deal name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Description
                </label>
                <textarea
                  value={newDealData.dealDescription}
                  onChange={(e) => setNewDealData({ ...newDealData, dealDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Describe the deal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value ($)
                  </label>
                  <input
                    type="number"
                    value={newDealData.dealValue}
                    onChange={(e) => setNewDealData({ ...newDealData, dealValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Close Probability (%)
                  </label>
                  <input
                    type="number"
                    value={newDealData.closeProbability}
                    onChange={(e) => setNewDealData({ ...newDealData, closeProbability: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={newDealData.closeDate}
                  onChange={(e) => setNewDealData({ ...newDealData, closeDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                onClick={handleCreateDeal}
                disabled={!newDealData.dealName || isCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5" />
                {isCreating ? 'Creating Deal...' : 'Create Deal'}
              </button>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  Link an existing deal to this opportunity. You can specify the relationship type.
                </p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dealSearchQuery}
                  onChange={(e) => {
                    setDealSearchQuery(e.target.value);
                    setShowDealDropdown(true);
                  }}
                  onFocus={() => setShowDealDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Search for a deal by name"
                />
                {showDealDropdown && availableDeals.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableDeals
                      .filter((deal: Deal) => 
                        (deal.dealName || deal.name || '').toLowerCase().includes(dealSearchQuery.toLowerCase())
                      )
                      .map((deal: Deal) => (
                        <div
                          key={deal.id}
                          onClick={() => handleSelectDeal(deal)}
                          className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{deal.dealName || deal.name || 'Untitled Deal'}</div>
                          <div className="text-xs text-gray-500">ID: {deal.recordId || deal.id}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Search and select an existing deal to link to this opportunity
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type
                </label>
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
                <label htmlFor="isPrimary" className="text-sm text-gray-700">
                  Set as primary deal for this opportunity
                </label>
              </div>

              <button
                onClick={handleLinkDeal}
                disabled={!selectedDealId || isLinking}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Link2 className="w-5 h-5" />
                {isLinking ? 'Linking Deal...' : 'Link Deal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDealsModal;