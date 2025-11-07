import React from 'react';
import { Outlet } from 'react-router-dom';

const DocumentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-foreground p-0 print:p-0">
      {/* O Outlet renderizará o documento (ex: StudentTranscript) */}
      <Outlet />
    </div>
  );
};

export default DocumentLayout;