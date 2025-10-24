import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { discussionsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PinIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Communications = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    category: 'general',
    visibility: 'divisional',
  });

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await discussionsAPI.getAll();
      setDiscussions(response.data.discussions || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await discussionsAPI.create(newDiscussion);
      toast.success('Discussion created successfully');
      setShowNewDiscussion(false);
      setNewDiscussion({
        title: '',
        content: '',
        category: 'general',
        visibility: 'divisional',
      });
      fetchDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error(error.response?.data?.error || 'Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDiscussion = async (discussionId) => {
    try {
      const response = await discussionsAPI.getById(discussionId);
      setSelectedDiscussion(response.data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      toast.error('Failed to load discussion');
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await discussionsAPI.addReply(selectedDiscussion.id, { content: replyContent });
      toast.success('Reply added successfully');
      setReplyContent('');
      // Refresh the discussion
      handleViewDiscussion(selectedDiscussion.id);
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error(error.response?.data?.error || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Committee Communications</h1>
          <p className="text-gray-600 mt-2">
            Discussion board for marriage committee members
          </p>
        </div>
        <button
          onClick={() => setShowNewDiscussion(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Discussion
        </button>
      </div>

      {/* View: List of Discussions */}
      {!selectedDiscussion && !showNewDiscussion && (
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="card text-center py-12">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No discussions yet. Start a conversation!</p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <div
                key={discussion.id}
                onClick={() => handleViewDiscussion(discussion.id)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {discussion.is_pinned && (
                        <PinIcon className="h-4 w-4 text-primary-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {discussion.title}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
                        {discussion.category}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{discussion.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>👤 {discussion.created_by?.full_name}</span>
                      <span>💬 {discussion.reply_count} replies</span>
                      <span>📅 {new Date(discussion.created_at).toLocaleDateString()}</span>
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs capitalize">
                        {discussion.visibility.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {discussion.is_closed && (
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs">
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View: New Discussion Form */}
      {showNewDiscussion && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Discussion</h2>
          <form onSubmit={handleCreateDiscussion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                required
                className="input"
                placeholder="Discussion title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newDiscussion.category}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, category: e.target.value })}
                  className="input"
                >
                  <option value="general">General</option>
                  <option value="application_specific">Application Specific</option>
                  <option value="policy">Policy</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={newDiscussion.visibility}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, visibility: e.target.value })}
                  className="input"
                >
                  <option value="divisional">My Division</option>
                  <option value="regional">My Region</option>
                  <option value="all_committees">All Committees</option>
                  {(user?.role === 'central_committee' || user?.role === 'overseer') && (
                    <option value="central_only">Central Committee Only</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                required
                rows="6"
                className="input"
                placeholder="Share your thoughts or questions..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewDiscussion(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? 'Creating...' : 'Create Discussion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View: Discussion Detail */}
      {selectedDiscussion && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedDiscussion(null)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Discussions
          </button>

          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedDiscussion.is_pinned && (
                    <PinIcon className="h-5 w-5 text-primary-600" />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDiscussion.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>👤 {selectedDiscussion.created_by?.full_name}</span>
                  <span>📅 {new Date(selectedDiscussion.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                    {selectedDiscussion.category}
                  </span>
                </div>
              </div>
              {selectedDiscussion.is_closed && (
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs">
                  Closed
                </span>
              )}
            </div>

            <p className="text-gray-700 whitespace-pre-wrap">{selectedDiscussion.content}</p>
          </div>

          {/* Replies */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Replies ({selectedDiscussion.replies?.length || 0})
            </h3>

            <div className="space-y-4 mb-6">
              {selectedDiscussion.replies && selectedDiscussion.replies.length > 0 ? (
                selectedDiscussion.replies.map((reply) => (
                  <div key={reply.id} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {reply.created_by?.full_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No replies yet</p>
              )}
            </div>

            {/* Reply Form */}
            {!selectedDiscussion.is_closed && (
              <form onSubmit={handleAddReply} className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows="3"
                  className="input mb-3"
                  placeholder="Write your reply..."
                />
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="btn btn-primary"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Communications;

