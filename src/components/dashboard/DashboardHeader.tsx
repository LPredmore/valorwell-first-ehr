
import React from "react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  heading,
  text,
  children,
}) => {
  return (
    <div className="flex items-center justify-between py-4 mb-4 border-b">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default DashboardHeader;
