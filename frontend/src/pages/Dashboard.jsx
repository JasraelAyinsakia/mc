import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, applicationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingCheckIns, setUpcomingCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, checkInsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity(5),
        dashboardAPI.getUpcomingCheckIns(),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data.activity);
      setUpcomingCheckIns(checkInsRes.data.upcoming_checkins);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = user?.role === 'single'
    ? [
        {
          name: 'My Applications',
          value: stats?.total_applications || 0,
          icon: DocumentTextIcon,
          color: 'bg-blue-500',
        },
        {
          name: 'In Progress',
          value: stats?.pending || 0,
          icon: ClockIcon,
          color: 'bg-yellow-500',
        },
        {
          name: 'Approved',
          value: stats?.approved || 0,
          icon: CheckCircleIcon,
          color: 'bg-green-500',
        },
      ]
    : [
        {
          name: 'Total Applications',
          value: stats?.total_applications || 0,
          icon: DocumentTextIcon,
          color: 'bg-blue-500',
        },
        {
          name: 'Pending',
          value: stats?.pending || 0,
          icon: ClockIcon,
          color: 'bg-yellow-500',
        },
        {
          name: 'Approved',
          value: stats?.approved || 0,
          icon: CheckCircleIcon,
          color: 'bg-green-500',
        },
        {
          name: 'This Month',
          value: stats?.this_month || 0,
          icon: DocumentTextIcon,
          color: 'bg-purple-500',
        },
      ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-pending',
      approved: 'badge badge-approved',
      rejected: 'badge badge-rejected',
      on_hold: 'badge bg-gray-100 text-gray-800',
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome, {user?.full_name}!</h1>
        <p className="mt-2 text-primary-100">
          {user?.role === 'single'
            ? 'Manage your marriage application journey'
            : 'Manage marriage applications and guide couples'}
        </p>
        {user?.role === 'single' && stats?.total_applications === 0 && (
          <Link
            to="/applications/new"
            className="inline-flex items-center mt-4 px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Start Your Application
          </Link>
        )}
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
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Link
                  key={activity.application_id}
                  to={`/applications/${activity.application_id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{activity.application_number}</p>
                      <p className="text-sm text-gray-600">{activity.applicant_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stage: {activity.current_stage?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className={getStatusBadge(activity.status)}>
                      {activity.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/applications"
            className="block mt-4 text-center text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Applications →
          </Link>
        </div>

        {/* Upcoming Check-ins */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Check-ins</h2>
          {upcomingCheckIns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming check-ins</p>
          ) : (
            <div className="space-y-4">
              {upcomingCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{checkIn.application_number}</p>
                      <p className="text-sm text-gray-600">{checkIn.applicant_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(checkIn.scheduled_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="badge bg-blue-100 text-blue-800">
                      {checkIn.days_until} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {user?.role === 'single' && (
            <Link
              to="/applications/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <PlusIcon className="h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 font-medium text-gray-900">New Application</p>
            </Link>
          )}
          <Link
            to="/applications"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-gray-900">View Applications</p>
          </Link>
          <Link
            to="/profile"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <CheckCircleIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-gray-900">Update Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

