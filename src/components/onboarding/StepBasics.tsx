import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

const BIO_MAX = 280;

export interface StepBasicsData {
  name: string;
  company: string;
  role: string;
  bio: string;
  linkedinUrl: string;
  avatarFile: File | null;
  avatarPreviewUrl: string | null;
}

interface StepBasicsProps {
  data: StepBasicsData;
  onChange: (data: StepBasicsData) => void;
  errors: Partial<Record<keyof StepBasicsData, string>>;
}

export default function StepBasics({ data, onChange, errors }: StepBasicsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function set(field: keyof StepBasicsData, value: string) {
    onChange({ ...data, [field]: value });
  }

  function handleAvatarFile(file: File) {
    const previewUrl = URL.createObjectURL(file);
    onChange({ ...data, avatarFile: file, avatarPreviewUrl: previewUrl });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleAvatarFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleAvatarFile(file);
  }

  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="h-20 w-20 ring-2 ring-[#F59E0B] ring-offset-2">
          {data.avatarPreviewUrl ? (
            <AvatarImage src={data.avatarPreviewUrl} alt="Avatar preview" />
          ) : (
            <AvatarFallback className="bg-[#1E293B] text-white text-xl">
              {initials || '?'}
            </AvatarFallback>
          )}
        </Avatar>

        <div
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-6 py-4 transition-colors ${
            dragOver
              ? 'border-[#F59E0B] bg-amber-50'
              : 'border-gray-300 hover:border-[#F59E0B] hover:bg-amber-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {data.avatarFile ? data.avatarFile.name : 'Upload photo (JPG, PNG, WebP)'}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-[#1E293B] font-medium" htmlFor="ob-name">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="ob-name"
          placeholder="Jane Smith"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          className={errors.name ? 'border-red-400' : ''}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <Label className="text-[#1E293B] font-medium" htmlFor="ob-company">
          Company / Organization <span className="text-red-500">*</span>
        </Label>
        <Input
          id="ob-company"
          placeholder="Acme Corp"
          value={data.company}
          onChange={(e) => set('company', e.target.value)}
          className={errors.company ? 'border-red-400' : ''}
        />
        {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label className="text-[#1E293B] font-medium" htmlFor="ob-role">
          Role / Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="ob-role"
          placeholder="Product Manager"
          value={data.role}
          onChange={(e) => set('role', e.target.value)}
          className={errors.role ? 'border-red-400' : ''}
        />
        {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label className="text-[#1E293B] font-medium" htmlFor="ob-bio">
          Bio
        </Label>
        <Textarea
          id="ob-bio"
          placeholder="Tell your cohort a bit about yourself..."
          value={data.bio}
          maxLength={BIO_MAX}
          rows={4}
          onChange={(e) => set('bio', e.target.value)}
        />
        <p className={`text-right text-xs ${data.bio.length >= BIO_MAX ? 'text-red-500' : 'text-gray-400'}`}>
          {data.bio.length}/{BIO_MAX}
        </p>
      </div>

      {/* LinkedIn */}
      <div className="space-y-1.5">
        <Label className="text-[#1E293B] font-medium" htmlFor="ob-linkedin">
          LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <Input
          id="ob-linkedin"
          type="url"
          placeholder="https://linkedin.com/in/yourname"
          value={data.linkedinUrl}
          onChange={(e) => set('linkedinUrl', e.target.value)}
        />
      </div>
    </div>
  );
}
