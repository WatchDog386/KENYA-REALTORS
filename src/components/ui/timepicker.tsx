import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import clsx from "clsx";

export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [hour, minute] = value ? value.split(":") : ["", ""];

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  const handleSelect = (newHour: string, newMinute: string) => {
    onChange(`${newHour}:${newMinute}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between w-full">
          <span>{value ? value : "Select time"}</span>
          <Clock className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="glass w-64 p-2">
        <div className="flex justify-between text-center">
          <div className="w-1/2">
            <Label className="text-xs text-muted-foreground">Hour</Label>
            <ScrollArea className="h-40 mt-1 rounded-md border">
              <div className="flex flex-col">
                {hours.map((h) => (
                  <button
                    key={h}
                    className={clsx(
                      "py-1 hover:bg-muted dark:hover:bg-primary/50 text-sm rounded-sm",
                      h === hour &&
                        "bg-primary text-primary-foreground dark:hover:text-white hover:text-black rounded-sm"
                    )}
                    onClick={() => handleSelect(h, minute || "00")}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="w-1/2">
            <Label className="text-xs text-muted-foreground">Minute</Label>
            <ScrollArea className="h-40 mt-1 rounded-md border">
              <div className="flex flex-col">
                {minutes.map((m) => (
                  <button
                    key={m}
                    className={clsx(
                      "py-1 hover:bg-muted dark:hover:bg-primary/50 text-sm rounded-sm",
                      m === minute &&
                        "bg-primary text-primary-foreground dark:hover:text-white hover:text-black rounded-sm"
                    )}
                    onClick={() => handleSelect(hour || "00", m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
