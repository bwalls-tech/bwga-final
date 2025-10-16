
import React from 'react';
import Card from './common/Card.tsx';
import type { UserProfile as UserProfileType } from '../types.ts';

interface UserProfileProps {
  profile: UserProfileType | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ profile }) => {
  if (!profile) {
    return (
      <Card>
        <p className="text-nexus-text-secondary">No user profile set. Please generate a report to set your profile.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-xl font-bold text-nexus-accent-gold mb-4">Current Operator Profile</h3>
      <div className="space-y-2 text-nexus-text-secondary">
        <p><strong>Name:</strong> <span className="text-nexus-text-primary">{profile.userName}</span></p>
        <p><strong>Department:</strong> <span className="text-nexus-text-primary">{profile.userDepartment}</span></p>
        <p><strong>Country:</strong> <span className="text-nexus-text-primary">{profile.userCountry}</span></p>
      </div>
    </Card>
  );
};

export default UserProfile;
