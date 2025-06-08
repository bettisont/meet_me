import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert } from '../ui/alert';
import api from '../../services/api';

const FriendsPage = () => {
  const { user } = useUser();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends/list');
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/friends/requests/pending');
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/friends/request', { email });
      setSuccess('Friend request sent successfully!');
      setEmail('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (requestId, status) => {
    try {
      await api.put(`/friends/request/${requestId}`, { status });
      fetchPendingRequests();
      if (status === 'accepted') {
        fetchFriends();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update friend request');
    }
  };

  const removeFriend = async (friendshipId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await api.delete(`/friends/${friendshipId}`);
      fetchFriends();
      setSuccess('Friend removed successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove friend');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Add Friend Section */}
        <Card>
          <CardHeader>
            <CardTitle>Add Friend</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendFriendRequest} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter friend's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send Friend Request'}
              </Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-4">
                {error}
              </Alert>
            )}
            {success && (
              <Alert className="mt-4">
                {success}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500">No pending friend requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{request.sender.name || request.sender.email}</p>
                      <p className="text-sm text-gray-500">{request.sender.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFriendRequest(request.id, 'accepted')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFriendRequest(request.id, 'rejected')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle>My Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-gray-500">You haven't added any friends yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friendship) => (
                <div key={friendship.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{friendship.friend.name || friendship.friend.email}</p>
                      <p className="text-sm text-gray-500">{friendship.friend.email}</p>
                      {friendship.friend.location && (
                        <p className="text-sm text-gray-600 mt-1">📍 {friendship.friend.location}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFriend(friendship.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsPage;