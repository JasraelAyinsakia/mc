import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courtshipAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const CourtshipTopics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [id]);

  const fetchTopics = async () => {
    try {
      const response = await courtshipAPI.getTopics(id);
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load courtship topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setNotes(topic.couple_notes || '');
  };

  const handleUpdateTopic = async (status) => {
    if (!selectedTopic) return;

    setUpdating(true);
    try {
      await courtshipAPI.updateTopic(selectedTopic.id, {
        status,
        couple_notes: notes,
      });
      toast.success('Topic updated successfully');
      fetchTopics();
      setSelectedTopic(null);
      setNotes('');
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Failed to update topic');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const progress = (completedCount / topics.length) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/applications/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Courtship Manual</h1>
          <p className="text-gray-600 mt-1">24 Weekly Topics for Marriage Preparation</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-sm font-medium text-gray-700">
            {completedCount} / {topics.length} Topics Completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% Complete</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topics List */}
        <div className="lg:col-span-1 space-y-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleSelectTopic(topic)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedTopic?.id === topic.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {topic.status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Week {topic.week_number}</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {topic.topic_title}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Topic Details */}
        <div className="lg:col-span-2">
          {selectedTopic ? (
            <div className="card space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Week {selectedTopic.week_number}
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedTopic.topic_title}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTopic.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedTopic.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedTopic.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-700 mt-4">{selectedTopic.topic_description}</p>
              </div>

              {/* Couple's Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Notes & Reflections
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="6"
                  className="input"
                  placeholder="Share your thoughts, insights, and what you learned from this topic..."
                  disabled={selectedTopic.status === 'completed'}
                />
              </div>

              {/* Counselor Notes (if any) */}
              {selectedTopic.counselor_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Counselor's Feedback
                  </p>
                  <p className="text-sm text-blue-800">{selectedTopic.counselor_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedTopic.status !== 'completed' && (
                <div className="flex gap-4">
                  {selectedTopic.status === 'not_started' && (
                    <button
                      onClick={() => handleUpdateTopic('in_progress')}
                      disabled={updating}
                      className="btn btn-outline flex-1 disabled:opacity-50"
                    >
                      Start Topic
                    </button>
                  )}
                  {selectedTopic.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateTopic('completed')}
                      disabled={updating}
                      className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Mark as Completed'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <ClockIcon className="h-16 w-16 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">Select a topic to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtshipTopics;

