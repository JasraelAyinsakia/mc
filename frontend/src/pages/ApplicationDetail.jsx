import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCommittee } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await applicationsAPI.getById(id);
      setApplication(response.data);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
      navigate('/applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!application) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      in_progress: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      rejected: 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: CheckCircleIcon,
      in_progress: ClockIcon,
      pending: ClockIcon,
      rejected: XCircleIcon,
    };
    const Icon = icons[status] || ClockIcon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/applications')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {application.application_number}
          </h1>
          <p className="text-gray-600 mt-1">Application Details</p>
        </div>
        <div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              application.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : application.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {application.status}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Timeline</h2>
        <div className="space-y-4">
          {application.stages?.map((stage, index) => (
            <div key={stage.id} className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${getStatusColor(stage.status)}`}>
                {getStatusIcon(stage.status)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{stage.stage_name}</h3>
                    {stage.notes && (
                      <p className="text-sm text-gray-600 mt-1">{stage.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {stage.completed_at
                        ? `Completed: ${new Date(stage.completed_at).toLocaleDateString()}`
                        : `Started: ${new Date(stage.started_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      stage.status
                    )}`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Applicant Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900">{application.applicant?.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="text-sm text-gray-900">{application.age}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Occupation</dt>
              <dd className="text-sm text-gray-900">{application.occupation}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Church Role</dt>
              <dd className="text-sm text-gray-900">{application.church_role || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900">
                {application.applicant?.local_church}, {application.applicant?.region}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Partner Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Partner Name</dt>
              <dd className="text-sm text-gray-900">{application.partner_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900">
                {application.partner_location || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Region</dt>
              <dd className="text-sm text-gray-900">
                {application.partner_region || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Partner Informed</dt>
              <dd className="text-sm text-gray-900">
                {application.partner_informed ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Salvation Experience */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Salvation Experience</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Born Again</dt>
            <dd className="text-sm text-gray-900">
              {application.is_born_again ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Salvation Date</dt>
            <dd className="text-sm text-gray-900">
              {application.salvation_date
                ? new Date(application.salvation_date).toLocaleDateString()
                : 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Experience</dt>
            <dd className="text-sm text-gray-900 whitespace-pre-wrap">
              {application.salvation_experience}
            </dd>
          </div>
        </dl>
      </div>

      {/* Medical Tests */}
      {application.medical_tests && application.medical_tests.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Tests</h2>
          <div className="space-y-4">
            {application.medical_tests.map((test) => (
              <div key={test.id} className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-900 capitalize">
                  {test.person_type}'s Tests
                </h3>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-gray-500">HIV Test</dt>
                    <dd className="text-gray-900">{test.hiv_test || 'Pending'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Hepatitis Test</dt>
                    <dd className="text-gray-900">{test.hepatitis_test || 'Pending'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Sickle Cell</dt>
                    <dd className="text-gray-900">{test.sickle_cell_test || 'Pending'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Hospital</dt>
                    <dd className="text-gray-900">{test.hospital_name || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courtship Progress */}
      {application.current_stage === 'courtship' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Courtship Progress</h2>
            <Link
              to={`/applications/${id}/courtship`}
              className="btn btn-outline text-sm"
            >
              View Topics →
            </Link>
          </div>
          {application.courtship_progress && application.courtship_progress.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all"
                  style={{
                    width: `${
                      (application.courtship_progress.filter((t) => t.status === 'completed')
                        .length /
                        application.courtship_progress.length) *
                      100
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {
                  application.courtship_progress.filter((t) => t.status === 'completed')
                    .length
                }{' '}
                / {application.courtship_progress.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isCommittee && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Committee Actions</h2>
          <div className="flex gap-4">
            <button className="btn btn-primary">Update Stage</button>
            <button className="btn btn-outline">Add Notes</button>
            <button className="btn btn-outline">Schedule Meeting</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;

