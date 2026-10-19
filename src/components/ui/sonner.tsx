import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-3.5 group-[.toaster]:!pr-10 group-[.toaster]:border group-[.toaster]:!relative",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[12.5px] group-[.toast]:mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-2.5 !top-2.5 !bottom-auto !transform-none !size-5 !rounded-md !border !border-border !bg-surface/80 hover:!bg-secondary !text-muted-foreground hover:!text-foreground !opacity-80 hover:!opacity-100 transition-all !flex !items-center !justify-center",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
