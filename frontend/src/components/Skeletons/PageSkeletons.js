import React from 'react';

const SkeletonLine = ({ className = '' }) => (
  <div className={`skeleton-block rounded ${className}`.trim()} />
);

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="cyber-card p-8">
        <SkeletonLine className="h-4 w-40 mb-5" />
        <SkeletonLine className="h-10 w-64 mb-4" />
        <SkeletonLine className="h-4 w-full mb-2" />
        <SkeletonLine className="h-4 w-3/4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="cyber-card p-6 lg:col-span-1 space-y-4">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
        </div>
        <div className="cyber-card p-6 lg:col-span-2">
          <SkeletonLine className="h-5 w-44 mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`member-skeleton-${idx}`} className="rounded-lg border border-white/10 p-4 space-y-3">
                <SkeletonLine className="h-4 w-2/3" />
                <SkeletonLine className="h-3 w-4/5" />
                <SkeletonLine className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChallengesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonLine key={`category-skeleton-${idx}`} className="h-10 w-full sm:w-28" />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:flex gap-3">
        <SkeletonLine className="h-10 w-full sm:w-32" />
        <SkeletonLine className="h-10 w-full sm:w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`challenge-skeleton-${idx}`} className="cyber-card p-6 space-y-5">
            <div className="flex justify-between items-center">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-5 w-16" />
            </div>
            <SkeletonLine className="h-7 w-11/12" />
            <SkeletonLine className="h-7 w-2/3" />
            <div className="pt-4 flex justify-between items-end">
              <SkeletonLine className="h-8 w-14" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="cyber-card p-6 space-y-5">
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="h-52 w-full" />
      </div>

      <div className="cyber-glass rounded-xl p-4 border border-white/10">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-16" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={`leaderboard-row-skeleton-${idx}`} className="grid grid-cols-4 gap-4 rounded border border-white/5 p-3">
              <SkeletonLine className="h-4 w-10" />
              <SkeletonLine className="h-4 w-full" />
              <SkeletonLine className="h-4 w-16" />
              <SkeletonLine className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
