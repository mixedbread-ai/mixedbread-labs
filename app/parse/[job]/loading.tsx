import { PageHeader } from "@/components/shell/shell";
import { Bone } from "@/components/skeleton";

/** The parse view's frame while its result loads: header, pages, inspector */
export default function Loading() {
  return (
    <>
      <PageHeader title={<Bone className="h-4 w-48" />} />
      <div className="grid min-h-0 flex-1 gap-3 px-2 pb-2 md:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] md:px-3 md:pb-3 xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="flex min-h-0 justify-center overflow-hidden rounded-xl bg-background px-4 pt-6 sm:px-10">
          <Bone className="aspect-[8.5/11] w-full max-w-[820px] rounded-[3px]" />
        </div>
        <div className="flex min-h-0 flex-col gap-3 max-md:hidden">
          <Bone className="h-9 rounded-full" />
          <Bone className="h-8 rounded-lg" />
          {Array.from({ length: 12 }, (_, index) => (
            <Bone key={index} className="h-5" />
          ))}
        </div>
      </div>
    </>
  );
}
