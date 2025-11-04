import Image from 'next/image';

interface AuthFormContainerProps {
  form: React.ReactNode;
}

export function AuthFormContainer({ form }: AuthFormContainerProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{form}</div>
      </div>

      {/* Right Column - Owl Image (hidden on tablet and below) */}
      <div
        className="hidden items-center justify-center md:flex"
        style={{ backgroundColor: '#f6f9f9' }}
      >
        <div className="relative h-64 w-64">
          <Image
            src="/images/owl-flat.png"
            alt="Nowly Owl"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
