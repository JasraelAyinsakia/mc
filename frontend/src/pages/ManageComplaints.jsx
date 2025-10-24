import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const ManageComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [response, setResponse] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    search: '',
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getAll({
        status: filters.status !== 'all' ? filters.status : undefined,
        severity: filters.severity !== 'all' ? filters.severity : undefined,
      });
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = async (complaintId) => {
    try {
      const response = await complaintsAPI.getById(complaintId);
      setSelectedComplaint(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      toast.error('Failed to load complaint details');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      await complaintsAPI.update(selectedComplaint.id, {
        status,
        response: response.trim() || undefined,
      });
      toast.success(`Complaint marked as ${status}`);
      setShowModal(false);
      setResponse('');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error(error.response?.data?.error || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const searchLower = filters.search.toLowerCase();
    return (
      complaint.subject.toLowerCase().includes(searchLower) ||
      complaint.description.toLowerCase().includes(searchLower) ||
      complaint.complaint_type.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Complaints</h1>
        <p className="text-gray-600 mt-2">
          Review and respond to feedback and complaints from singles
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search complaints..."
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="input"
            >
              <option value="all">All Severity</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {complaints.filter((c) => c.status === 'pending').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-blue-900">
                {complaints.filter((c) => c.status === 'under_review').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-900">
                {complaints.filter((c) => c.status === 'resolved').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-red-900">
                {complaints.filter((c) => c.severity === 'urgent').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="card text-center py-12">
            <FunnelIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No complaints found</p>
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              onClick={() => handleViewComplaint(complaint.id)}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(complaint.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {complaint.subject}
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full border ${getSeverityColor(complaint.severity)}`}>
                      {complaint.severity} priority
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                      {complaint.complaint_type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">
                      📅 {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                    {complaint.submitted_by && (
                      <span className="text-gray-500">
                        👤 {complaint.submitted_by.full_name}
                      </span>
                    )}
                    {!complaint.submitted_by && (
                      <span className="text-gray-500 italic">
                        🔒 Anonymous
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complaint Detail Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedComplaint.status)}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedComplaint.subject}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getSeverityColor(selectedComplaint.severity)}`}>
                      {selectedComplaint.severity} priority
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm capitalize">
                      {selectedComplaint.complaint_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted By:</label>
                  <p className="text-gray-900">
                    {selectedComplaint.submitted_by?.full_name || 'Anonymous'}
                    {selectedComplaint.submitted_by && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({selectedComplaint.submitted_by.email})
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sent To:</label>
                  <p className="text-gray-900 capitalize">
                    {selectedComplaint.send_to.replace('_', ' ')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted On:</label>
                  <p className="text-gray-900">
                    {new Date(selectedComplaint.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description:</label>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.response && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-blue-900">Response:</label>
                    <p className="text-blue-800 whitespace-pre-wrap mt-1">
                      {selectedComplaint.response}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Updated: {new Date(selectedComplaint.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Response Form */}
              {selectedComplaint.status !== 'resolved' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Response or Notes
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows="4"
                      className="input"
                      placeholder="Provide feedback, action taken, or resolution details..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {selectedComplaint.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus('under_review')}
                        disabled={updating}
                        className="btn btn-primary flex-1"
                      >
                        {updating ? 'Updating...' : 'Mark as Under Review'}
                      </button>
                    )}
                    {selectedComplaint.status === 'under_review' && (
                      <button
                        onClick={() => handleUpdateStatus('resolved')}
                        disabled={updating}
                        className="btn btn-primary flex-1"
                      >
                        {updating ? 'Updating...' : 'Mark as Resolved'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn btn-outline flex-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {selectedComplaint.status === 'resolved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">This complaint has been resolved</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;

