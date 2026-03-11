import { useParams } from 'react-router-dom';

export default function Conversation() {
  const { userId } = useParams<{ userId: string }>();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">Conversation</h1>
      <p className="text-gray-500 mt-1">With user: {userId}</p>
    </div>
  );
}
