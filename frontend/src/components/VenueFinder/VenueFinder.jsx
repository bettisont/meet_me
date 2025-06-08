import { useState, useEffect } from 'react';
import { venueService } from '../../services/api';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, X, Plus, Loader2, Star, Navigation, Users, Lock, ExternalLink, Share2 } from 'lucide-react';
import SignUpModal from '../SignUpModal';
import LoginModal from '../LoginModal';
import { useUser } from '../../contexts/UserContext';

const VenueFinder = () => {
  const { isLoggedIn, user } = useUser();
  const [postcodes, setPostcodes] = useState(['', '']);
  const [postcodeLabels, setPostcodeLabels] = useState([]);
  const [venueType, setVenueType] = useState('pub');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [shareSuccess, setShareSuccess] = useState(null);

  const venueTypes = [
    { value: 'pub', label: 'Pub' },
    { value: 'cafe', label: 'Café' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'park', label: 'Park' },
    { value: 'museum', label: 'Museum' },
    { value: 'cinema', label: 'Cinema' },
    { value: 'shopping', label: 'Shopping' }
  ];

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchGroups();
    }
  }, [isLoggedIn, user]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/my-groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    // Reset form state when switching tabs
    if (tab === 'manual') {
      setSelectedGroup('');
      setPostcodes(['', '']);
      setPostcodeLabels([]);
    } else if (tab === 'group') {
      setPostcodes(['', '']);
      setPostcodeLabels([]);
    }
    setError(null);
  };

  const handleVisitWebsite = (website) => {
    if (website) {
      // Ensure website has protocol
      const url = website.startsWith('http') ? website : `https://${website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewOnMaps = (venue) => {
    const query = encodeURIComponent(`${venue.name}, ${venue.address}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareVenue = async (venue) => {
    const shareText = `Here's a venue I found with MeetMe:

${venue.name}
${venue.address}${venue.website ? `\n${venue.website}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(venue.id);
      setTimeout(() => setShareSuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: try to use the older API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShareSuccess(venue.id);
        setTimeout(() => setShareSuccess(null), 2000);
      } catch {
        setError('Failed to copy venue details to clipboard');
      }
    }
  };

  const handlePostcodeChange = (index, value) => {
    const newPostcodes = [...postcodes];
    newPostcodes[index] = value;
    setPostcodes(newPostcodes);
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    
    if (!groupId) {
      setPostcodes(['', '']);
      setPostcodeLabels([]);
      return;
    }

    try {
      const response = await api.get(`/groups/${groupId}`);
      const group = response.data;
      
      // Extract postcodes and names from group members
      const memberData = group.members
        .filter(member => member.user.location) // Only include members with locations
        .map(member => ({
          postcode: member.user.location,
          name: member.user.name || member.user.email.split('@')[0]
        }));
      
      // Set postcodes and labels
      const newPostcodes = memberData.map(member => member.postcode);
      const newLabels = memberData.map(member => member.name);
      
      // Ensure at least 2 empty slots if less than 2 members have locations
      while (newPostcodes.length < 2) {
        newPostcodes.push('');
        newLabels.push('');
      }
      
      setPostcodes(newPostcodes);
      setPostcodeLabels(newLabels);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Failed to load group member locations');
    }
  };

  const addPostcode = () => {
    setPostcodes([...postcodes, '']);
    setPostcodeLabels([...postcodeLabels, '']);
  };

  const removePostcode = (index) => {
    if (postcodes.length > 2) {
      const newPostcodes = postcodes.filter((_, i) => i !== index);
      const newLabels = postcodeLabels.filter((_, i) => i !== index);
      setPostcodes(newPostcodes);
      setPostcodeLabels(newLabels);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validPostcodes = postcodes.filter(pc => pc.trim() !== '');
    
    if (validPostcodes.length < 2) {
      setError('Please enter at least 2 postcodes');
      setLoading(false);
      return;
    }

    try {
      const results = await venueService.searchVenues(validPostcodes, venueType);
      setResults(results);
    } catch (err) {
      setError('Failed to find venues. Please try again.');
      console.error('Error finding venues:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Find a Venue</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Find the sweet spot between you and them.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search for Venues</CardTitle>
          <CardDescription>Find venues at the midpoint between locations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => switchTab('manual')}
                  className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors min-h-[44px] flex items-center ${
                    activeTab === 'manual'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  Manual Entry
                </button>
                {isLoggedIn && groups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => switchTab('group')}
                    className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors min-h-[44px] flex items-center ${
                      activeTab === 'group'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-1 inline" />
                    <span className="hidden sm:inline">Friendship Group</span>
                    <span className="sm:hidden">Group</span>
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="mt-4">
                {activeTab === 'manual' ? (
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Enter Postcodes</label>
                    {postcodes.map((postcode, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            value={postcode}
                            onChange={(e) => handlePostcodeChange(index, e.target.value)}
                            placeholder={`Postcode ${index + 1}`}
                            className="pl-10"
                            required
                          />
                        </div>
                        {postcodes.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => removePostcode(index)}
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addPostcode}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add another postcode
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Choose Friendship Group</label>
                    <Select
                      value={selectedGroup}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      className="w-full"
                    >
                      <option value="" disabled>
                        Select a friendship group
                      </option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group._count?.members || 0} members)
                        </option>
                      ))}
                    </Select>
                    
                    {selectedGroup && (
                      <div className="space-y-4 mt-4">
                        <label className="text-sm font-medium">Member Locations (editable)</label>
                        {postcodes.map((postcode, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="relative flex-1">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="text"
                                value={postcode}
                                onChange={(e) => handlePostcodeChange(index, e.target.value)}
                                placeholder={postcodeLabels[index] ? `${postcodeLabels[index]}'s postcode` : `Postcode ${index + 1}`}
                                className="pl-10"
                                required
                              />
                              {postcodeLabels[index] && (
                                <span className="absolute right-3 top-3 text-xs text-muted-foreground">
                                  ({postcodeLabels[index]})
                                </span>
                              )}
                            </div>
                            {postcodes.length > 2 && (
                              <Button
                                type="button"
                                onClick={() => removePostcode(index)}
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={addPostcode}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add another postcode
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="venue-type" className="text-sm font-medium">
                Choose Venue Type
              </label>
              <Select
                id="venue-type"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="w-full"
              >
                {venueTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding venues...
                </>
              ) : (
                'Find Venues'
              )}
            </Button>

            {/* Light-touch account prompt - only show when not logged in */}
            {!isLoggedIn && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 flex-wrap">
                  <Lock className="h-3 w-3" />
                  Want to save your locations or plan with friends?{' '}
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                    <span>or</span>
                    <button
                      type="button"
                      onClick={() => setShowSignUpModal(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      create account
                    </button>
                  </span>
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Midpoint Location
              </CardTitle>
              <CardDescription>
                We've found the perfect middle ground between all postcodes
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Nearby {venueTypes.find(t => t.value === venueType)?.label}s
            </h3>
            <div className="grid gap-4">
              {results.venues.map(venue => (
                <Card key={venue.id} className="transition-all hover:shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <h4 className="text-lg font-semibold">{venue.name}</h4>
                      <span className="text-sm bg-secondary px-3 py-1 rounded-full self-start sm:self-auto">
                        {venue.distance} miles
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm sm:text-base">{venue.address}</p>
                    
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{venue.rating}</span>
                        </div>
                        {venue.phone && (
                          <span className="text-muted-foreground truncate">{venue.phone}</span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {venue.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVisitWebsite(venue.website)}
                            className="text-xs h-8 px-3 flex-1 min-w-0"
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" />
                            Website
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnMaps(venue)}
                          className="text-xs h-8 px-3 flex-1 min-w-0"
                        >
                          <MapPin className="h-3 w-3 mr-1.5" />
                          Maps
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareVenue(venue)}
                          className="text-xs h-8 px-3 flex-1 min-w-0"
                        >
                          <Share2 className="h-3 w-3 mr-1.5" />
                          {shareSuccess === venue.id ? 'Copied!' : 'Share'}
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{venue.rating}</span>
                        </div>
                        {venue.phone && (
                          <span className="text-muted-foreground">{venue.phone}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {venue.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVisitWebsite(venue.website)}
                            className="text-xs h-8 px-3"
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" />
                            Website
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnMaps(venue)}
                          className="text-xs h-8 px-3"
                        >
                          <MapPin className="h-3 w-3 mr-1.5" />
                          Maps
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareVenue(venue)}
                          className="text-xs h-8 px-3"
                        >
                          <Share2 className="h-3 w-3 mr-1.5" />
                          {shareSuccess === venue.id ? 'Copied!' : 'Share'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distance from each postcode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.postcodeLocations.map((location, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="font-medium">{location.postcode}</span>
                    <span className="text-muted-foreground">
                      {location.distanceToMidpoint} miles to midpoint
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />

      {/* Sign Up Modal */}
      <SignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal}
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
};

export default VenueFinder;