export default function Skeleton() {
  return (
    <div className='
      aspect-[5/7]
      bg-black bg-opacity-50 p-2 rounded-lg border border-gray-700
      bg-gradient-to-r
      from-transparent
      via-black/10
      relative 
      before:absolute before:inset-0
      before:-translate-x-full
      before:animate-[shimmer_2s_infinite_ease-in-out]
      before:bg-gradient-to-r
      before:from-transparent before:via-[#ddf]/5 before:to-transparent
      isolate
      overflow-hidden
      shadow-xl shadow-black/5
      before:border-t before:border-gray-50/20
      flex flex-col gap-2 w-full h-full'>
      <div className='rounded-lg bg-[#101416]/50 h-2/3 w-full'></div>
      <div className='rounded-lg bg-[#101416]/75 h-1/3 w-6/12'></div>
    </div>
  );
}
