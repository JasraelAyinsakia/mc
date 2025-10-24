import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UsersIcon,
  MapPinIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const RegionalStatistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRegion, setExpandedRegion] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await dashboardAPI.getRegionalStatistics();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching regional statistics:', error);
      toast.error('Failed to load regional statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="h-8 w-8 text-primary-600" />
          Regional Statistics
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of singles and marriage applications across regions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Singles</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {data.summary.total_singles}
              </p>
            </div>
            <UsersIcon className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Applications</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {data.summary.total_applications}
              </p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Regions</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {data.summary.total_regions}
              </p>
            </div>
            <MapPinIcon className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Regional Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Regional Breakdown</h2>

        {data.regional_data.length === 0 ? (
          <div className="card text-center py-12">
            <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No regional data available</p>
          </div>
        ) : (
          data.regional_data.map((region) => (
            <div key={region.region} className="card">
              <div
                className="cursor-pointer"
                onClick={() =>
                  setExpandedRegion(expandedRegion === region.region ? null : region.region)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-primary-600" />
                      {region.region}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Singles</p>
                        <p className="text-xl font-bold text-gray-900">
                          {region.total_singles}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Brothers</p>
                        <p className="text-xl font-bold text-blue-600">{region.brothers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sisters</p>
                        <p className="text-xl font-bold text-pink-600">{region.sisters}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Applications</p>
                        <p className="text-xl font-bold text-green-600">
                          {region.total_applications}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg
                      className={`h-6 w-6 transform transition-transform ${
                        expandedRegion === region.region ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedRegion === region.region && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    {/* Application Status Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Application Status Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-yellow-600 font-medium">Pending</p>
                          <p className="text-lg font-bold text-yellow-900">
                            {region.applications_by_status.pending}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Approved</p>
                          <p className="text-lg font-bold text-green-900">
                            {region.applications_by_status.approved}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs text-red-600 font-medium">Rejected</p>
                          <p className="text-lg font-bold text-red-900">
                            {region.applications_by_status.rejected}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 font-medium">On Hold</p>
                          <p className="text-lg font-bold text-gray-900">
                            {region.applications_by_status.on_hold}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Divisions Breakdown */}
                    {region.divisions && region.divisions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Singles by Division
                        </h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          {region.divisions.map((div) => (
                            <div
                              key={div.division}
                              className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-700">{div.division}</span>
                              <span className="text-lg font-bold text-primary-600">
                                {div.singles_count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border-2 border-blue-200 mt-8">
        <div className="flex gap-3">
          <ChartBarIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">About This Data</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Statistics are updated in real-time as singles register and apply</li>
              <li>• Brothers = Male singles, Sisters = Female singles</li>
              <li>
                • {user?.role === 'committee_member'
                  ? 'You can only see data for your region'
                  : 'Central committee can view all regions'}
              </li>
              <li>• Click on a region to see detailed breakdown by division and status</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalStatistics;

