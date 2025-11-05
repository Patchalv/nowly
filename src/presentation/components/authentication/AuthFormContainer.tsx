import Image from 'next/image';

interface AuthFormContainerProps {
  form: React.ReactNode;
}

export function AuthFormContainer({ form }: AuthFormContainerProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center w-full max-w-md gap-4">
          <div className="relative h-16 w-full">
            <Image
              src="/images/logo/nowly-text-grey.png"
              alt="Nowly Text"
              fill
              className="object-contain"
              priority
            />
          </div>
          {form}
        </div>
      </div>

      {/* Right Column - Owl Image (hidden on tablet and below) */}
      <div
        className="hidden items-center justify-center md:flex"
        style={{ backgroundColor: '#f6f9f9' }}
      >
        <div className="relative h-64 w-64">
          <Image
            src="/images/logo/nowly-icon-bg.png"
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
