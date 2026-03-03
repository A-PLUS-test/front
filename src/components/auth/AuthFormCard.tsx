import React from 'react';

interface AuthFormCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

const AuthFormCard: React.FC<AuthFormCardProps> = ({ header, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#22C7FB]/10 to-[#22C7FB]/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        {header}
        {children}
      </div>
    </div>
  );
};

export default AuthFormCard;
