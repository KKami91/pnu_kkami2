import React from 'react';

const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`}></div>
);

export const CombinedSkeletonLoader = () => (
  <div className="w-full h-[600px] bg-white p-4 rounded-lg shadow-lg">
    <SkeletonBox className="w-full h-full" />
  </div>
);

export const SeparateSkeletonLoader = ({ columns }: { columns: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
    {[...Array(6)].map((_, index) => (
      <div key={index} className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg">
        <SkeletonBox className="w-full h-full" />
      </div>
    ))}
  </div>
);

export const SkeletonLoader = ({ viewMode, columns }: { viewMode: string, columns: number }) => {
  if (viewMode === 'combined') {
    return <CombinedSkeletonLoader />;
  } else {
    return <SeparateSkeletonLoader columns={columns} />;
  }
};