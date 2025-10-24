import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, meetingsAPI } from '../utils/api';
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
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [stageData, setStageData] = useState({ status: 'completed', next_stage: '', notes: '' });
  const [notes, setNotes] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 60,
    location: '',
    meeting_type: 'interview',
    meeting_format: 'in_person',
    attendees: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplication();
    fetchMeetings();
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

  const fetchMeetings = async () => {
    try {
      const response = await meetingsAPI.getByApplication(id);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleUpdateStage = async () => {
    setUpdating(true);
    try {
      await applicationsAPI.updateStage(id, stageData);
      toast.success('Stage updated successfully');
      setShowStageModal(false);
      fetchApplication();
      setStageData({ status: 'completed', next_stage: '', notes: '' });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error(error.response?.data?.error || 'Failed to update stage');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    setUpdating(true);
    try {
      await applicationsAPI.updateStage(id, { notes, status: 'in_progress' });
      toast.success('Notes added successfully');
      setShowNotesModal(false);
      fetchApplication();
      setNotes('');
    } catch (error) {
      console.error('Error adding notes:', error);
      toast.error(error.response?.data?.error || 'Failed to add notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleScheduleMeeting = async () => {
    setUpdating(true);
    try {
      await meetingsAPI.schedule(id, meetingData);
      toast.success('Meeting scheduled successfully');
      setShowMeetingModal(false);
      fetchMeetings();
      setMeetingData({
        title: '',
        description: '',
        scheduled_date: '',
        duration_minutes: 60,
        location: '',
        meeting_type: 'interview',
        meeting_format: 'in_person',
        attendees: '',
      });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setUpdating(false);
    }
  };

  const stages = [
    'application_submitted',
    'form_review',
    'initial_interview',
    'medical_tests',
    'partner_interview',
    'family_introduction',
    'courtship',
    'central_committee_review',
    'approved'
  ];

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

      {/* Scheduled Meetings */}
      {meetings && meetings.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Meetings</h2>
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border-l-4 border-primary-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        📅 {new Date(meeting.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(meeting.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>⏱️ {meeting.duration_minutes} min</span>
                      <span className="capitalize">📍 {meeting.meeting_format.replace('_', ' ')}</span>
                    </div>
                    {meeting.location && (
                      <p className="text-sm text-gray-500 mt-1">Location: {meeting.location}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : meeting.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {meeting.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isCommittee && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Committee Actions</h2>
          <div className="flex gap-4">
            <button onClick={() => setShowStageModal(true)} className="btn btn-primary">
              Update Stage
            </button>
            <button onClick={() => setShowNotesModal(true)} className="btn btn-outline">
              Add Notes
            </button>
            <button
              onClick={() => setShowMeetingModal(true)}
              className="btn btn-outline"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Update Application Stage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stage Status
                </label>
                <select
                  value={stageData.status}
                  onChange={(e) => setStageData({ ...stageData, status: e.target.value })}
                  className="input"
                >
                  <option value="completed">Complete Current Stage</option>
                  <option value="in_progress">Keep In Progress</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              {stageData.status === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Stage
                  </label>
                  <select
                    value={stageData.next_stage}
                    onChange={(e) => setStageData({ ...stageData, next_stage: e.target.value })}
                    className="input"
                  >
                    <option value="">Select next stage</option>
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={stageData.notes}
                  onChange={(e) => setStageData({ ...stageData, notes: e.target.value })}
                  rows="4"
                  className="input"
                  placeholder="Add any notes or comments..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStageModal(false)}
                  className="btn btn-outline flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStage}
                  className="btn btn-primary flex-1"
                  disabled={updating || (stageData.status === 'completed' && !stageData.next_stage)}
                >
                  {updating ? 'Updating...' : 'Update Stage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="6"
                  className="input"
                  placeholder="Add notes about this application..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="btn btn-outline flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNotes}
                  className="btn btn-primary flex-1"
                  disabled={updating || !notes.trim()}
                >
                  {updating ? 'Adding...' : 'Add Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Schedule Meeting</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={meetingData.title}
                    onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Initial Interview"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type *
                  </label>
                  <select
                    value={meetingData.meeting_type}
                    onChange={(e) => setMeetingData({ ...meetingData, meeting_type: e.target.value })}
                    className="input"
                  >
                    <option value="interview">Interview</option>
                    <option value="review">Review</option>
                    <option value="introduction">Family Introduction</option>
                    <option value="check_in">Check-In</option>
                    <option value="final_approval">Final Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Format *
                  </label>
                  <select
                    value={meetingData.meeting_format}
                    onChange={(e) => setMeetingData({ ...meetingData, meeting_format: e.target.value })}
                    className="input"
                  >
                    <option value="in_person">In Person</option>
                    <option value="phone">Phone Call</option>
                    <option value="video">Video Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingData.scheduled_date}
                    onChange={(e) => setMeetingData({ ...meetingData, scheduled_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={meetingData.duration_minutes}
                    onChange={(e) => setMeetingData({ ...meetingData, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="input"
                    min="15"
                    step="15"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={meetingData.location}
                    onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                    className="input"
                    placeholder="e.g., Church Office, Zoom Link, Phone Number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees
                  </label>
                  <input
                    type="text"
                    value={meetingData.attendees}
                    onChange={(e) => setMeetingData({ ...meetingData, attendees: e.target.value })}
                    className="input"
                    placeholder="e.g., Applicant, Partner, Committee Members"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={meetingData.description}
                    onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                    rows="3"
                    className="input"
                    placeholder="Additional details about the meeting..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="btn btn-outline flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  className="btn btn-primary flex-1"
                  disabled={updating || !meetingData.title || !meetingData.scheduled_date}
                >
                  {updating ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;

