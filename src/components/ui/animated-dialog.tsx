"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

const TriggerRefContext = React.createContext<React.MutableRefObject<HTMLElement | null> | null>(
  null
);

function AnimatedDialog({ children, ...props }: DialogPrimitive.Root.Props) {
  const triggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <TriggerRefContext.Provider value={triggerRef}>
      <DialogPrimitive.Root data-slot="animated-dialog" {...props}>
        {children}
      </DialogPrimitive.Root>
    </TriggerRefContext.Provider>
  );
}

function AnimatedDialogTrigger({
  children,
  className,
  render,
  ...props
}: DialogPrimitive.Trigger.Props) {
  const triggerRef = React.useContext(TriggerRefContext);

  return (
    <DialogPrimitive.Trigger
      data-slot="animated-dialog-trigger"
      className={className}
      render={render}
      ref={(node: Element | null) => {
        if (triggerRef) {
          triggerRef.current = node as HTMLElement | null;
        }
      }}
      {...props}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

function AnimatedDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  const triggerRef = React.useContext(TriggerRefContext);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const trigger = triggerRef?.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;

    const triggerRect = trigger.getBoundingClientRect();
    const centerX = triggerRect.left + triggerRect.width / 2;
    const centerY = triggerRect.top + triggerRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const originX = 50 + ((centerX - viewportCenterX) / popup.offsetWidth) * 100;
    const originY = 50 + ((centerY - viewportCenterY) / popup.offsetHeight) * 100;

    popup.style.transformOrigin = `${Math.round(originX)}% ${Math.round(originY)}%`;
  });

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="animated-dialog-overlay"
        className={cn(
          "fixed inset-0 isolate z-50 bg-black/25 backdrop-blur-sm",
          "data-open:animate-in data-open:fade-in-0 data-open:duration-250",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200"
        )}
      />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="animated-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-75 data-open:duration-350",
          "data-open:[animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-90 data-closed:duration-200",
          "data-closed:[animation-timing-function:cubic-bezier(0.4,0,1,1)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="animated-dialog-close"
          render={
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            />
          }
        >
          <XIcon aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function AnimatedDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function AnimatedDialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function AnimatedDialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function AnimatedDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogFooter,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
};
