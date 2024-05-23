import React, { useState, type MouseEvent } from "react";
import Button from "../../fundamentals/button";
import HelpCircleIcon from "../../fundamentals/icons/help-circle";
import SearchBar from "../../molecules/search-bar";
import MailDialog from "../help-dialog";

const Topbar: React.FC = () => {
  const [showSupportform, setShowSupportForm] = useState(false);

  return (
    <div className="min-h-topbar max-h-topbar pr-xlarge pl-base bg-grey-0 border-grey-20 flex w-full items-center justify-between border-b">
      <SearchBar />
      <div className="flex items-center">
        <Button
          size="small"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setShowSupportForm(!showSupportform)}
        >
          <HelpCircleIcon size={24} />
        </Button>
      </div>
      {showSupportform && (
        <MailDialog
          open={showSupportform}
          onClose={() => setShowSupportForm(false)}
        />
      )}
    </div>
  );
};

export default Topbar;
