'use client';

import { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  try {
    return <>{children}</>;
  } catch (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <h2 className="font-bold text-red-900 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-red-700">
              {fallback || 'เกิดข้อผิดพลาดบางอย่างขณะแสดงหน้านี้'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}