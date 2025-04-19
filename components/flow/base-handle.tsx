import { cn } from "@/lib/utils";
import { Handle, type HandleProps } from "@xyflow/react";
import React, { forwardRef } from "react";

export const BaseHandle = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & HandleProps
>(({ className, ...props }, ref) => (
	<Handle ref={ref} className={cn("", className)} {...props} />
));

BaseHandle.displayName = "BaseHandle";
