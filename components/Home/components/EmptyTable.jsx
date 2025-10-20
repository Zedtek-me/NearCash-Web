import React from "react";
import { Inbox } from "lucide-react";

const EmptyTableState= ({
  title = "No Data Available",
  description = "There’s currently no data to display here.",
  icon,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          {icon || <Inbox size={32} className="text-gray-500" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyTableState;
