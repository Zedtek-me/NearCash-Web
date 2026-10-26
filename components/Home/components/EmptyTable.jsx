import React from "react";
import { Inbox } from "lucide-react";

const EmptyTableState= ({
  title = "No Data Available",
  description = "There’s currently no data to display here.",
  icon,
}) => {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
          {icon || <Inbox size={23} className="text-slate-500" />}
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyTableState;
