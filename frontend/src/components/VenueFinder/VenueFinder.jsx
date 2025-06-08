import { useState } from 'react';
import { venueService } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, X, Plus, Loader2, Star, Navigation, Users, Lock } from 'lucide-react';
import SignUpModal from '../SignUpModal';
import LoginModal from '../LoginModal';
import ProfileDropdown from '../ProfileDropdown';
import ProfilePage from '../ProfilePage';
import { useUser } from '../../contexts/UserContext';

const VenueFinder = () => {
  const { isLoggedIn } = useUser();
  const [postcodes, setPostcodes] = useState(['', '']);
  const [venueType, setVenueType] = useState('pub');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  const handlePostcodeChange = (index, value) => {
    const newPostcodes = [...postcodes];
    newPostcodes[index] = value;
    setPostcodes(newPostcodes);
  };

  const addPostcode = () => {
    setPostcodes([...postcodes, '']);
  };

  const removePostcode = (index) => {
    if (postcodes.length > 2) {
      const newPostcodes = postcodes.filter((_, i) => i !== index);
      setPostcodes(newPostcodes);
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

  // Show profile page if requested
  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2 relative">
        {/* Profile dropdown in top right when logged in */}
        {isLoggedIn && (
          <div className="absolute top-0 right-0">
            <ProfileDropdown onProfileClick={() => setShowProfile(true)} />
          </div>
        )}
        
        <h1 className="text-4xl font-bold tracking-tight">MeetMe</h1>
        <p className="text-muted-foreground text-lg">Find the sweet spot between you and them.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search for Venues</CardTitle>
          <CardDescription>Enter at least two postcodes to find venues at the midpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold">{venue.name}</h4>
                      <span className="text-sm bg-secondary px-3 py-1 rounded-full">
                        {venue.distance} miles
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3">{venue.address}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{venue.rating}</span>
                      </div>
                      {venue.phone && (
                        <span className="text-muted-foreground">{venue.phone}</span>
                      )}
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