import { cn } from "cn";
import { COLUMN } from "@/components/controls";
import { PageHeader } from "@/components/shell/shell";
import { Bone } from "@/components/skeleton";

/**
 * A chat while its files load, laid out as the room is: the title and its
 * actions, the intro in the middle, and the composer's card at the bottom
 */
export default function Loading() {
  return (
    <>
      <PageHeader
        title={<Bone className="h-3.5 w-64" />}
        actions={
          <>
            <Bone className="h-8 w-[4.875rem] rounded-full max-sm:hidden" />
            <Bone className="h-8 w-[5.25rem] rounded-lg" />
          </>
        }
      />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 pb-3 md:pb-4">
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              COLUMN,
              "my-auto flex flex-col items-center gap-5 py-6"
            )}
          >
            {/* The same line boxes as the room's intro, so nothing moves when it arrives */}
            <div className="flex h-[1.925rem] items-center sm:h-[2.475rem]">
              <Bone className="h-7 w-72 sm:h-8 sm:w-[27rem]" />
            </div>
            <div className="flex w-full max-w-md flex-col items-center">
              <div className="flex h-6 w-full items-center">
                <Bone className="h-3.5 w-full" />
              </div>
              <div className="flex h-6 w-3/4 items-center">
                <Bone className="h-3.5 w-full" />
              </div>
            </div>
            {/* The suggestions' row, which the room holds even in a mode without any */}
            <div aria-hidden="true" className="invisible mt-3 max-md:py-1">
              <span className="block py-1.5 text-[13px]">&nbsp;</span>
            </div>
          </div>
        </div>
        <div className={COLUMN}>
          <div className="flex flex-col rounded-[22px] bg-card shadow-composer ring-1 ring-soft">
            <div className="flex min-h-13 items-start px-4.5 pt-5 pb-1">
              <Bone className="h-3.5 w-40" />
            </div>
            <div className="flex items-center gap-2 px-2.5 pb-2.5">
              <Bone className="h-[1.875rem] w-[10.75rem] rounded-full" />
              <Bone className="ml-auto size-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
