import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import api from '../../services/api';

const GroupsPage = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create group form
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Add member form
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Create meetup form
  const [meetupName, setMeetupName] = useState('');
  const [meetupDescription, setMeetupDescription] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [createMeetupOpen, setCreateMeetupOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchFriends();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/my-groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setSelectedGroup(response.data);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/groups/create', {
        name: groupName,
        description: groupDescription
      });
      setSuccess('Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setCreateGroupOpen(false);
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !selectedFriendId) return;
    
    setError('');
    setLoading(true);

    try {
      const selectedFriend = friends.find(f => f.id === selectedFriendId);
      await api.post(`/groups/${selectedGroup.id}/members`, {
        email: selectedFriend.friend.email
      });
      setSuccess('Member added successfully!');
      setSelectedFriendId('');
      setAddMemberOpen(false);
      fetchGroupDetails(selectedGroup.id);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!selectedGroup) return;
    
    const member = selectedGroup.members.find(m => m.userId === memberId);
    if (!window.confirm(`Remove ${member?.user.name || member?.user.email} from the group?`)) {
      return;
    }

    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${memberId}`);
      fetchGroupDetails(selectedGroup.id);
      setSuccess('Member removed successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const createMeetup = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    
    setError('');
    setLoading(true);

    try {
      await api.post(`/groups/${selectedGroup.id}/meetups`, {
        name: meetupName,
        description: meetupDescription,
        date: meetupDate,
        location: meetupLocation
      });
      setSuccess('Meetup created successfully!');
      setMeetupName('');
      setMeetupDescription('');
      setMeetupDate('');
      setMeetupLocation('');
      setCreateMeetupOpen(false);
      fetchGroupDetails(selectedGroup.id);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create meetup');
    } finally {
      setLoading(false);
    }
  };

  const suggestMeetupLocation = () => {
    if (!selectedGroup) return;
    
    // Get all member locations
    const memberLocations = selectedGroup.members
      .filter(m => m.user.location)
      .map(m => m.user.location);
    
    if (memberLocations.length === 0) {
      setError('No members have default locations. Members need to set their default location first.');
      return;
    }

    // For now, just use the first member's location as a suggestion
    // In a real app, you'd calculate a central point
    setMeetupLocation(memberLocations[0]);
    setSuccess(`Suggested location based on ${memberLocations.length} member location(s)`);
  };

  const isAdmin = (group) => {
    return group.members.some(m => m.userId === user?.id && m.role === 'admin');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button>Create Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={createGroup} className="space-y-4">
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <Input
                placeholder="Description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert className="mb-4">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-gray-500">No groups yet</p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => fetchGroupDetails(group.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-gray-500">{group._count.members} members</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Group Details */}
        <div className="md:col-span-2">
          {selectedGroup ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedGroup.name}</CardTitle>
                      {selectedGroup.description && (
                        <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                      )}
                    </div>
                    {isAdmin(selectedGroup) && (
                      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">Add Member</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Member to Group</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={addMember} className="space-y-4">
                            <Select
                              value={selectedFriendId}
                              onChange={(e) => setSelectedFriendId(e.target.value)}
                              required
                            >
                              <option value="" disabled>
                                Select a friend to add
                              </option>
                              {friends
                                .filter(friend => {
                                  // Filter out friends who are already members
                                  return !selectedGroup?.members?.some(member => 
                                    member.user.email === friend.friend.email
                                  );
                                })
                                .map((friend) => (
                                  <option key={friend.id} value={friend.id}>
                                    {friend.friend.name || friend.friend.email}
                                  </option>
                                ))
                              }
                            </Select>
                            {friends.filter(friend => 
                              !selectedGroup?.members?.some(member => 
                                member.user.email === friend.friend.email
                              )
                            ).length === 0 && (
                              <p className="text-sm text-gray-500">
                                All your friends are already members of this group.
                              </p>
                            )}
                            <Button 
                              type="submit" 
                              disabled={loading || !selectedFriendId} 
                              className="w-full"
                            >
                              {loading ? 'Adding...' : 'Add Member'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-3">Members ({selectedGroup.members.length})</h3>
                  <div className="space-y-2">
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">
                            {member.user.name || member.user.email}
                            {member.role === 'admin' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Admin</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                          {member.user.location && (
                            <p className="text-sm text-gray-600">📍 {member.user.location}</p>
                          )}
                        </div>
                        {isAdmin(selectedGroup) && member.userId !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMember(member.userId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Meetups</CardTitle>
                    <Dialog open={createMeetupOpen} onOpenChange={setCreateMeetupOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">Plan Meetup</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Plan New Meetup</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={createMeetup} className="space-y-4">
                          <Input
                            placeholder="Meetup name"
                            value={meetupName}
                            onChange={(e) => setMeetupName(e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Description (optional)"
                            value={meetupDescription}
                            onChange={(e) => setMeetupDescription(e.target.value)}
                          />
                          <Input
                            type="datetime-local"
                            value={meetupDate}
                            onChange={(e) => setMeetupDate(e.target.value)}
                            required
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Location"
                              value={meetupLocation}
                              onChange={(e) => setMeetupLocation(e.target.value)}
                              required
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={suggestMeetupLocation}
                            >
                              Suggest
                            </Button>
                          </div>
                          <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Creating...' : 'Create Meetup'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedGroup.meetups?.length === 0 ? (
                    <p className="text-gray-500">No meetups planned yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedGroup.meetups?.map((meetup) => (
                        <div key={meetup.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{meetup.name}</p>
                          {meetup.description && (
                            <p className="text-sm text-gray-600">{meetup.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            📅 {new Date(meetup.date).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            📍 {meetup.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select a group to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;