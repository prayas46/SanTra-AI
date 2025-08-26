import { Doc } from "@workspace/backend/_generated/dataModel"
import { Hint } from "@workspace/ui/components/hint"
import { Button } from "@workspace/ui/components/button"
import { ArrowUp, ArrowUpIcon,ArrowRightIcon, CheckIcon } from "lucide-react";
export const ConversationStatusButton = ({
    status,
    onClick,
    disabled,
}: {
    status: Doc<"conversations">["status"];
    onClick: () => void;
    disabled?: boolean;

}) => {
    if(status === "resolved") {
        // Do something for resolved status
        return(
            <Hint text="Mark as unresolved">
                <Button disabled={disabled} onClick={onClick} size="sm" variant="tertiary">
                    <CheckIcon />
                    Resolved
                </Button>
            </Hint>
        );
    }

    if(status === "escalated") {
        // Do something for escalated status
        return(
            <Hint text="Mark as resolved">
                <Button disabled={disabled} onClick={onClick} size="sm" variant="warning">
                    <ArrowUpIcon />
                    Escalated
                </Button>
            </Hint>
        );
    }

    return(
        <Hint text="Mark as escalated">
                <Button disabled={disabled} onClick={onClick} size="sm" variant="destructive">
                    <ArrowRightIcon />
                    Unresolved
                </Button>
            </Hint>
    )
};
