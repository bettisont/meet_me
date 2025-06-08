import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, User, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

const SignUpModal = ({ open, onOpenChange, onSwitchToLogin }) => {
  const { login } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        location: formData.location
      });
      console.log('User created:', response.data);
      
      // Auto-login the user after successful signup
      login(response.data.user, response.data.token);
      setSuccess(true);
      
      // Reset form
      setFormData({ name: '', email: '', password: '', confirmPassword: '', location: '' });
      
      // Close modal after a brief delay
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setFormData({ name: '', email: '', password: '', confirmPassword: '', location: '' });
        setError(null);
        setSuccess(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>
            Save your favorite locations and plan meetups with friends more easily.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-lg font-semibold mb-2">
              Account created successfully! 🎉
            </div>
            <p className="text-muted-foreground">
              Welcome to MeetMe. You can now save locations and plan with friends.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Default Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be used as your location when planning meetups with friendship groups.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex-col gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              {onSwitchToLogin && (
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onSwitchToLogin();
                    }}
                    className="text-primary hover:underline font-medium"
                    disabled={loading}
                  >
                    Sign in here
                  </button>
                </div>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;