import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Applications = () => {
  const { user, isSingle } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    stage: '',
    search: '',
  });

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll(filters);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-pending',
      approved: 'badge badge-approved',
      rejected: 'badge badge-rejected',
      on_hold: 'badge bg-gray-100 text-gray-800',
    };
    return badges[status] || 'badge';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">Manage marriage applications</p>
        </div>
        {isSingle && (
          <Link to="/applications/new" className="btn btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Application
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stage
            </label>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className="input"
            >
              <option value="">All Stages</option>
              <option value="application_submitted">Application Submitted</option>
              <option value="interview">Interview</option>
              <option value="medical_tests_requested">Medical Tests</option>
              <option value="courtship">Courtship</option>
              <option value="central_committee_review">Central Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search..."
                className="input pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No applications found</p>
          {isSingle && (
            <Link to="/applications/new" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
              Create your first application →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Link
              key={application.id}
              to={`/applications/${application.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.application_number}
                    </h3>
                    <span className={getStatusBadge(application.status)}>
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Applicant:</span> {application.applicant?.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Partner:</span> {application.partner_name || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Current Stage:</span>{' '}
                      {application.current_stage?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <button className="btn btn-outline text-sm">
                    View Details →
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;

