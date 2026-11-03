import { COLUMN } from "@/components/controls";
import { PageHeader } from "@/components/shell/shell";
import { Bone } from "@/components/skeleton";

/** A chat's frame while its files load: header, intro, composer */
export default function Loading() {
  return (
    <>
      <PageHeader title={<Bone className="h-4 w-40" />} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <Bone className="h-9 w-72 max-w-[80%]" />
        <Bone className="h-4 w-80 max-w-[85%]" />
      </div>
      <div className={`${COLUMN} pb-3 md:pb-4`}>
        <Bone className="h-24 rounded-[22px]" />
      </div>
    </>
  );
}
