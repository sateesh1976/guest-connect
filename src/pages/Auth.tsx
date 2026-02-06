import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Lock, User, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(8, 'Please confirm your password').max(72),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    const { error } = await signIn(data.email.trim(), data.password);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setError(null);
    setIsSubmitting(true);
    const { error } = await signUp(data.email.trim(), data.password, data.displayName.trim());
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (error.message.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment before trying again.');
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
    }
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues('email')?.trim();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    const emailValidation = z.string().email();
    if (!emailValidation.safeParse(email).success) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    setIsSubmitting(false);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setIsForgotPassword(false);
    }
  };

  const switchMode = () => {
    setError(null);
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    // Reset forms after mode switch to ensure clean state
    setTimeout(() => {
      if (!isLogin) {
        loginForm.reset({ email: '', password: '' });
      } else {
        signupForm.reset({ displayName: '', email: '', password: '', confirmPassword: '' });
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">VisitorHub</h1>
          <p className="text-muted-foreground mt-2">
            {isForgotPassword 
              ? 'Reset your password' 
              : isLogin 
                ? 'Sign in to manage visitors' 
                : 'Create your staff account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated p-6 md:p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isForgotPassword ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input 
                  id="forgot-email"
                  type="email"
                  placeholder="admin@company.com" 
                  className="input-focus"
                  autoComplete="email"
                  {...loginForm.register('email')}
                />
              </div>

              <Button 
                type="button"
                className="w-full btn-primary h-12"
                disabled={isSubmitting}
                onClick={handleForgotPassword}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          ) : isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input 
                  id="login-email"
                  type="email"
                  placeholder="admin@company.com" 
                  className="input-focus"
                  autoComplete="email"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </Label>
                <Input 
                  id="login-password"
                  type="password"
                  placeholder="••••••••" 
                  className="input-focus"
                  autoComplete="current-password"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form 
              onSubmit={signupForm.handleSubmit(handleSignup)} 
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input 
                  id="signup-name"
                  type="text"
                  placeholder="John Smith" 
                  className="input-focus"
                  autoComplete="name"
                  {...signupForm.register('displayName')}
                />
                {signupForm.formState.errors.displayName && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input 
                  id="signup-email"
                  type="email"
                  placeholder="john@company.com" 
                  className="input-focus"
                  autoComplete="email"
                  {...signupForm.register('email')}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </Label>
                <Input 
                  id="signup-password"
                  type="password"
                  placeholder="••••••••" 
                  className="input-focus"
                  autoComplete="new-password"
                  {...signupForm.register('password')}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirm Password
                </Label>
                <Input 
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••••" 
                  className="input-focus"
                  autoComplete="new-password"
                  {...signupForm.register('confirmPassword')}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle */}
          {!isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-2 text-primary hover:underline font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}

          {/* Info for first user */}
          {!isLogin && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                The first user to sign up will automatically become an admin. 
                Subsequent users will be assigned the receptionist role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
