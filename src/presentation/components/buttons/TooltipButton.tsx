import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TooltipButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'variant' | 'size'
> {
  tooltip: string;
  btnContent: React.ReactNode;
  btnVariant?: VariantProps<typeof buttonVariants>['variant'];
  btnSize?: VariantProps<typeof buttonVariants>['size'];
}

export const TooltipButton = ({
  tooltip,
  btnContent,
  btnVariant,
  btnSize,
  ...props
}: TooltipButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={btnVariant} size={btnSize} {...props}>
          {btnContent}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
