import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { committeeAPI, dashboardAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const CommitteeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [courtshipData, setCourtshipData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommitteeData();
  }, []);

  const fetchCommitteeData = async () => {
    try {
      const [statsRes, pendingRes, courtshipRes] = await Promise.all([
        committeeAPI.getStatistics(),
        committeeAPI.getPendingApplications(),
        dashboardAPI.getCourtshipCompletion().catch(() => ({ data: { courtship_data: [] } })),
      ]);

      setStats(statsRes.data);
      setPendingApplications(pendingRes.data.applications);
      setCourtshipData(courtshipRes.data.courtship_data || []);
    } catch (error) {
      console.error('Error fetching committee data:', error);
      toast.error('Failed to load committee data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      name: 'Total Applications',
      value: stats?.total || 0,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Review',
      value: stats?.pending || 0,
      icon: UsersIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Approved',
      value: stats?.approved || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'My Assigned',
      value: stats?.my_assigned || 0,
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">Committee Portal</h1>
        <p className="mt-2 text-primary-100">
          Manage and oversee marriage applications in your region
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Applications */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pending Applications
          </h2>
          {pendingApplications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending applications</p>
          ) : (
            <div className="space-y-4">
              {pendingApplications.slice(0, 5).map((application) => (
                <Link
                  key={application.id}
                  to={`/applications/${application.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.application_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {application.applicant?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {application.applicant?.local_church}
                      </p>
                    </div>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/applications?status=pending"
            className="block mt-4 text-center text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Pending →
          </Link>
        </div>

        {/* Courtship Progress */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Courtship Progress Tracking
          </h2>
          {courtshipData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No couples in courtship period
            </p>
          ) : (
            <div className="space-y-4">
              {courtshipData.slice(0, 5).map((item) => (
                <div
                  key={item.application_number}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.application_number}
                      </p>
                      <p className="text-sm text-gray-600">{item.applicant_name}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.completed_topics} / {item.total_topics} topics completed
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Applications by Stage */}
      {stats?.by_stage && Object.keys(stats.by_stage).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Applications by Stage
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.by_stage).map(([stage, count]) => (
              <div
                key={stage}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <p className="text-sm text-gray-600 capitalize">
                  {stage.replace(/_/g, ' ')}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/applications?status=pending"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <ClipboardDocumentCheckIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-gray-900">Review Applications</p>
          </Link>
          <Link
            to="/applications"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <UsersIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-gray-900">View All Applications</p>
          </Link>
          <Link
            to="/dashboard"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <ChartBarIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-gray-900">View Reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommitteeDashboard;

