import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-purple-200 font-medium animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
