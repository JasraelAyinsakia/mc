import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../utils/api';
import { toast } from 'react-toastify';

const AUTOSAVE_KEY = 'marriage_application_draft';
const AUTOSAVE_INTERVAL = 5000; // Auto-save every 5 seconds

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);
  
  // Initialize form data from localStorage if available
  const getInitialFormData = () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        toast.info('Previous draft restored. Continue where you left off!', {
          autoClose: 3000,
        });
        return parsed;
      }
    } catch (error) {
      console.error('Error loading saved draft:', error);
    }
    
    return {
      age: '',
      occupation: '',
      church_role: '',
      partner_name: '',
      partner_location: '',
      partner_region: '',
      partner_division: '',
      partner_informed: false,
      is_born_again: true,
      salvation_date: '',
      salvation_experience: '',
      previously_married: false,
      number_of_children: 0,
      previous_marriage_details: '',
      knows_partner: false,
      relationship_description: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Auto-save effect
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set up new timer to save after user stops typing
    autoSaveTimerRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, AUTOSAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await applicationsAPI.create(formData);
      clearDraft(); // Clear the saved draft after successful submission
      toast.success('Application submitted successfully!');
      navigate(`/applications/${response.data.application.id}`);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marriage Application Form</h1>
            <p className="text-gray-600 mt-2">
              Please fill out this form completely and honestly. All information will be kept confidential.
            </p>
          </div>
          {lastSaved && (
            <div className="text-right">
              <span className="text-xs text-green-600 font-medium">
                ✓ Draft auto-saved
              </span>
              <p className="text-xs text-gray-500">
                {lastSaved.toLocaleTimeString()}
              </p>
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Clear Draft
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="18"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation *
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                required
                className="input"
                placeholder="Your current occupation"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you do in the church?
              </label>
              <textarea
                name="church_role"
                value={formData.church_role}
                onChange={handleChange}
                rows="2"
                className="input"
                placeholder="e.g., Usher, Choir member, Sunday school teacher"
              />
            </div>
          </div>
        </div>

        {/* Salvation Experience */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Salvation Experience</h2>
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_born_again"
                checked={formData.is_born_again}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                I am born again *
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When were you born again? *
              </label>
              <input
                type="date"
                name="salvation_date"
                value={formData.salvation_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your salvation experience *
              </label>
              <textarea
                name="salvation_experience"
                value={formData.salvation_experience}
                onChange={handleChange}
                required
                rows="4"
                className="input"
                placeholder="Share your testimony of how you came to Christ"
              />
            </div>
          </div>
        </div>

        {/* Partner Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Partner Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Full Name *
              </label>
              <input
                type="text"
                name="partner_name"
                value={formData.partner_name}
                onChange={handleChange}
                required
                className="input"
                placeholder="Full name of the person you wish to marry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Region
              </label>
              <input
                type="text"
                name="partner_region"
                value={formData.partner_region}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Greater Accra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Division
              </label>
              <input
                type="text"
                name="partner_division"
                value={formData.partner_division}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Accra Central"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Church Location
              </label>
              <input
                type="text"
                name="partner_location"
                value={formData.partner_location}
                onChange={handleChange}
                className="input"
                placeholder="Local church or assembly"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="partner_informed"
                  checked={formData.partner_informed}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  I have informed my partner about this application
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="knows_partner"
                  checked={formData.knows_partner}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  I know this person well
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your relationship
              </label>
              <textarea
                name="relationship_description"
                value={formData.relationship_description}
                onChange={handleChange}
                rows="3"
                className="input"
                placeholder="How did you meet? How long have you known each other?"
              />
            </div>
          </div>
        </div>

        {/* Previous Marriage */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Marriage History</h2>
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="previously_married"
                checked={formData.previously_married}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                I have been married before
              </label>
            </div>

            {formData.previously_married && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of children
                  </label>
                  <input
                    type="number"
                    name="number_of_children"
                    value={formData.number_of_children}
                    onChange={handleChange}
                    min="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please provide details about your previous marriage
                  </label>
                  <textarea
                    name="previous_marriage_details"
                    value={formData.previous_marriage_details}
                    onChange={handleChange}
                    rows="4"
                    className="input"
                    placeholder="When were you married? What happened? Are you legally divorced?"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;

