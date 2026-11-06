export function NewsCardSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden border bg-white animate-pulse">
            <div className="aspect-video bg-gray-200" />
            <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-5 bg-gray-200 rounded w-5/6" />
                <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
            </div>
        </div>
    );
}