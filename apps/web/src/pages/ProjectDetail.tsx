import { useParams } from 'react-router-dom';
export default function ProjectDetail() {
  const { id } = useParams();
  return <div className="p-8"><h1>Project Detail {id}</h1><p className="text-text-secondary mt-2">Coming soon</p></div>;
}
