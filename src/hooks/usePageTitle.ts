import { useEffect } from 'react';

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | Davi EDU`;
  }, [title]);
};

export default usePageTitle;