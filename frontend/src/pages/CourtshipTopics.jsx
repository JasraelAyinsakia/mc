import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courtshipTrackingAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const CourtshipTopics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedContent, setExpandedContent] = useState({});

  useEffect(() => {
    fetchProgress();
  }, [id]);

  const fetchProgress = async () => {
    try {
      const response = await courtshipTrackingAPI.getProgress(id);
      
      // If no weeks data, initialize progress first
      if (!response.data.weeks || response.data.weeks.length === 0) {
        toast.info('Initializing your courtship manual...');
        await courtshipTrackingAPI.initializeProgress(id);
        // Fetch again after initialization
        const retryResponse = await courtshipTrackingAPI.getProgress(id);
        setWeeks(retryResponse.data.weeks);
        setStats(retryResponse.data.stats);
        
        // Auto-select week 1
        if (retryResponse.data.weeks && retryResponse.data.weeks.length > 0) {
          handleSelectWeek(retryResponse.data.weeks[0]);
        }
      } else {
        setWeeks(response.data.weeks);
        setStats(response.data.stats);
        
        // Auto-select current week
        const currentWeek = response.data.weeks.find(
          w => w.progress.status !== 'completed'
        );
        if (currentWeek) {
          handleSelectWeek(currentWeek);
        } else if (response.data.weeks.length > 0) {
          // If all completed, select first week
          handleSelectWeek(response.data.weeks[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load courtship topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWeek = (weekData) => {
    setSelectedWeek(weekData);
    setNotes(weekData.progress.notes || '');
    setExpandedContent({});
  };

  const handleUpdateProgress = async (status) => {
    if (!selectedWeek) return;

    setUpdating(true);
    try {
      await courtshipTrackingAPI.updateProgress(id, selectedWeek.week, {
        status,
        notes: notes.trim() || undefined,
      });
      toast.success(`Week ${selectedWeek.week} ${status === 'completed' ? 'completed' : 'started'}!`);
      fetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update progress';
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedWeek) return;

    setUpdating(true);
    try {
      await courtshipTrackingAPI.updateProgress(id, selectedWeek.week, {
        notes: notes.trim(),
      });
      toast.success('Notes saved successfully');
      fetchProgress();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const toggleContent = (section) => {
    setExpandedContent(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderDiscussionPoints = (points) => {
    if (!points) return null;
    if (typeof points === 'string') return <p className="text-gray-700">{points}</p>;
    if (Array.isArray(points)) {
      return (
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {points.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      );
    }
    return null;
  };

  const renderContent = (content) => {
    if (!content) return null;

    return (
      <div className="space-y-6">
        {content.main_topic && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Main Topic:</h4>
            <p className="text-gray-700">{content.main_topic}</p>
          </div>
        )}

        {content.scripture && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h4 className="font-semibold text-blue-900 mb-1">Scripture References:</h4>
            <p className="text-blue-800">{content.scripture}</p>
          </div>
        )}

        {content.discussion_points && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Discussion Points:</h4>
            {renderDiscussionPoints(content.discussion_points)}
          </div>
        )}

        {content.key_principles && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Key Principles:</h4>
            {renderDiscussionPoints(content.key_principles)}
          </div>
        )}

        {content.questions && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Questions for Reflection:</h4>
            {renderDiscussionPoints(content.questions)}
          </div>
        )}

        {content.practical_applications && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Practical Applications:</h4>
            {renderDiscussionPoints(content.practical_applications)}
          </div>
        )}

        {/* Handle complex nested structures */}
        {content.temperaments && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-3">Understanding Temperaments:</h4>
            {Object.entries(content.temperaments).map(([key, temp]) => (
              <div key={key} className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-semibold text-purple-900 mb-2">{temp.title}</h5>
                
                {temp.strengths && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {temp.strengths.slice(0, 5).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    {temp.strengths.length > 5 && (
                      <button
                        onClick={() => toggleContent(`${key}-strengths`)}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                      >
                        {expandedContent[`${key}-strengths`] ? 'Show less' : `Show all ${temp.strengths.length} strengths`}
                      </button>
                    )}
                    {expandedContent[`${key}-strengths`] && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mt-2">
                        {temp.strengths.slice(5).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {temp.weaknesses && (
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Weaknesses:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {temp.weaknesses.slice(0, 5).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                    {temp.weaknesses.length > 5 && (
                      <button
                        onClick={() => toggleContent(`${key}-weaknesses`)}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                      >
                        {expandedContent[`${key}-weaknesses`] ? 'Show less' : `Show all ${temp.weaknesses.length} weaknesses`}
                      </button>
                    )}
                    {expandedContent[`${key}-weaknesses`] && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mt-2">
                        {temp.weaknesses.slice(5).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const progress = stats ? stats.progress_percentage : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/applications/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">25-Week Courtship Manual</h1>
          <p className="text-gray-600 mt-1">DLBC Marriage Committee Guidelines</p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-green-700">{stats?.completed || 0}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-3xl font-bold text-blue-700">{stats?.in_progress || 0}</p>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600">Not Started</p>
          <p className="text-3xl font-bold text-gray-700">{stats?.not_started || 0}</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-gray-600">Overall Progress</p>
          <p className="text-3xl font-bold text-purple-700">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Weeks List */}
        <div className="lg:col-span-1 space-y-2 max-h-[800px] overflow-y-auto">
          {weeks.map((weekData) => (
            <button
              key={weekData.week}
              onClick={() => handleSelectWeek(weekData)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedWeek?.week === weekData.week
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  {weekData.progress.status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : weekData.progress.status === 'in_progress' ? (
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Week {weekData.week}</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {weekData.topic?.title}
                  </p>
                  {weekData.progress.notes && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <PencilSquareIcon className="h-3 w-3" />
                      <span>Has notes</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Topic Details */}
        <div className="lg:col-span-3">
          {selectedWeek ? (
            <div className="space-y-6">
              {/* Topic Header */}
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
                        Week {selectedWeek.week}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        {selectedWeek.topic?.duration}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedWeek.topic?.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      <strong>Leader:</strong> {selectedWeek.topic?.leader}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedWeek.progress.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedWeek.progress.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedWeek.progress.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Dates */}
                {(selectedWeek.progress.started_at || selectedWeek.progress.completed_at) && (
                  <div className="text-sm text-gray-600 space-y-1 border-t pt-3">
                    {selectedWeek.progress.started_at && (
                      <p>Started: {new Date(selectedWeek.progress.started_at).toLocaleDateString()}</p>
                    )}
                    {selectedWeek.progress.completed_at && (
                      <p>Completed: {new Date(selectedWeek.progress.completed_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Topic Content */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpenIcon className="h-6 w-6 text-primary-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Topic Content</h3>
                </div>
                {renderContent(selectedWeek.topic?.content)}
              </div>

              {/* Shared Notes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PencilSquareIcon className="h-6 w-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Shared Notes & Reflections</h3>
                  </div>
                  {selectedWeek.progress.last_updated_by_name && (
                    <p className="text-sm text-gray-500">
                      Last updated by: {selectedWeek.progress.last_updated_by_name}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Both partners can see and add to these notes. Share your thoughts, insights, and what you learned.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="8"
                  className="input mb-3"
                  placeholder="Write your reflections, questions, and insights here... Both you and your partner can see these notes."
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={updating}
                  className="btn btn-outline"
                >
                  {updating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Actions */}
              {selectedWeek.progress.status !== 'completed' && (
                <div className="card bg-gray-50">
                  <div className="flex gap-4">
                    {selectedWeek.progress.status === 'not_started' && (
                      <button
                        onClick={() => handleUpdateProgress('in_progress')}
                        disabled={updating}
                        className="btn btn-primary flex-1"
                      >
                        {updating ? 'Starting...' : 'Start This Week'}
                      </button>
                    )}
                    {selectedWeek.progress.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateProgress('completed')}
                        disabled={updating}
                        className="btn btn-primary flex-1"
                      >
                        {updating ? 'Completing...' : 'Mark as Completed'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    ⚠️ You can only complete one topic per week
                  </p>
                </div>
              )}

              {selectedWeek.progress.status === 'completed' && (
                <div className="card bg-green-50 border-2 border-green-200 text-center">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Week Completed! 🎉</p>
                  <p className="text-sm text-green-700 mt-1">
                    Great progress! Select another week to continue.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16">
              <BookOpenIcon className="h-20 w-20 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">Select a week to view the topic and content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtshipTopics;
