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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-3.5 group-[.toaster]:border",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[12.5px] group-[.toast]:mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!bg-surface group-[.toast]:!border group-[.toast]:!border-border group-[.toast]:!text-muted-foreground hover:group-[.toast]:!text-foreground hover:group-[.toast]:!bg-secondary transition-colors !top-2.5 !right-2.5 !size-6 !rounded-md",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
