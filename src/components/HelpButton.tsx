import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const HelpButton: React.FC = () => {
  return (
    <Button asChild variant="outline" className="fixed bottom-6 left-6 z-50 shadow-lg bg-card hover:bg-muted/50">
      <Link to="/faq">
        <HelpCircle className="h-5 w-5 mr-2" />
        Ajuda (FAQ)
      </Link>
    </Button>
  );
};

export default HelpButton;