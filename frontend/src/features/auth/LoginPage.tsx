import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('inst.admin@demo.local');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/institution');
    }, 500);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-gov-navy">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gov-navy/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-gov-navy" />
          </div>
          <CardTitle className="text-xl">Sign in to EduVerify</CardTitle>
          <CardDescription>
            National APAAR Student Verification & Repository System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional / Official Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" variant="default" className="w-full mt-2" disabled={isLoading}>
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
            <div className="text-center text-xs text-slate-500 pt-2">
              Protected by Argon2id & rotating JWT with reuse detection.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
