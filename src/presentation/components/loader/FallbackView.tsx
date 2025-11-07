import { Spinner } from '../ui/spinner';

interface FallbackViewProps {
  message?: string;
}

export const FallbackView = ({ message = 'Loading...' }: FallbackViewProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <Spinner className="size-8" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};
