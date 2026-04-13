import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { mockPasses } from '../../data/mockData';
import QRDisplay from '../../components/ui/QRDisplay';

const PassViewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pass = mockPasses.find(p => p.id === id);

  if (!pass) return <div>Pass not found</div>;

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col page-enter">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-ghost px-0 hover:bg-transparent hover:text-accent-primary"
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <QRDisplay
          value={pass.qrCode}
          passId={pass.id}
          studentName={pass.studentName}
          usn={pass.usn}
          validUntil={new Date(pass.expectedReturn).toLocaleString()}
        />
      </div>
    </div>
  );
};

export default PassViewPage;
