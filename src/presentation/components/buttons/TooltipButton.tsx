import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TooltipButtonProps {
  tooltip: string;
  btnContent: React.ReactNode;
  btnVariant?: VariantProps<typeof buttonVariants>['variant'];
  btnSize?: VariantProps<typeof buttonVariants>['size'];
  props?: React.ComponentProps<typeof Button>;
  onClick?: () => void;
}

export const TooltipButton = ({
  tooltip,
  btnContent,
  btnVariant,
  btnSize,
  onClick,
  ...props
}: TooltipButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={btnVariant}
          size={btnSize}
          {...props}
          onClick={onClick}
        >
          {btnContent}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
