import { useParams } from 'react-router-dom';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">Profile</h1>
      <p className="text-gray-500 mt-1">User ID: {id}</p>
    </div>
  );
}
