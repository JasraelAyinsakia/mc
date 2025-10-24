import React, { useState } from 'react';
import { complaintsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
  ExclamationTriangleIcon,
  MegaphoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    complaint_type: 'delay',
    severity: 'medium',
    subject: '',
    description: '',
    send_to: 'central_committee',
    anonymous: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await complaintsAPI.submit(formData);
      toast.success('Your feedback has been submitted successfully. Thank you for your input.');
      setSubmitted(true);
      // Reset form
      setFormData({
        complaint_type: 'delay',
        severity: 'medium',
        subject: '',
        description: '',
        send_to: 'central_committee',
        anonymous: false,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been received and will be reviewed by the appropriate authority.
            {formData.anonymous
              ? ' Your submission is anonymous.'
              : ' You will be notified of any updates.'}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn btn-primary"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MegaphoneIcon className="h-8 w-8 text-primary-600" />
          Submit Feedback or Complaint
        </h1>
        <p className="text-gray-600 mt-2">
          If you're experiencing delays, bias, or any process issues, you can report them here.
          Your feedback will be sent directly to the appropriate authority.
        </p>
      </div>

      {/* Important Notice */}
      <div className="card bg-amber-50 border-2 border-amber-200 mb-6">
        <div className="flex gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">Important Information</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Your feedback will be reviewed confidentially</li>
              <li>• You can choose to submit anonymously</li>
              <li>• False complaints may affect your application</li>
              <li>• Use this for genuine concerns only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Concern *
              </label>
              <select
                name="complaint_type"
                value={formData.complaint_type}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="delay">Process Delay</option>
                <option value="bias">Bias or Unfair Treatment</option>
                <option value="process_issue">Process or Procedural Issue</option>
                <option value="other">Other Concern</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="low">Low - Minor Concern</option>
                <option value="medium">Medium - Moderate Issue</option>
                <option value="high">High - Significant Problem</option>
                <option value="urgent">Urgent - Immediate Attention Needed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To *
              </label>
              <select
                name="send_to"
                value={formData.send_to}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="central_committee">Central Marriage Committee</option>
                <option value="regional_pastor">Regional Pastor</option>
                <option value="national_overseer">National Overseer</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose who should review your feedback based on the nature of your concern
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="input"
              placeholder="Brief summary of your concern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              className="input"
              placeholder="Please provide details about your concern. Include dates, names (if relevant), and specific incidents..."
            />
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Submit anonymously (your identity will not be shared with committee members)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-6">
              Note: If anonymous, you won't receive updates on your feedback
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      {/* FAQ Section */}
      <div className="card mt-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-900">What happens after I submit?</p>
            <p className="text-gray-600">
              Your feedback is sent directly to the authority you selected. They will review and take
              appropriate action.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Will my feedback affect my application?</p>
            <p className="text-gray-600">
              Genuine feedback will not negatively affect your application. We encourage honest communication.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Can I track my feedback?</p>
            <p className="text-gray-600">
              If you don't submit anonymously, you'll receive updates when your feedback is reviewed or resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

