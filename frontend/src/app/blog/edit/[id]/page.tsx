import { Suspense } from "react";
import EditBlogForm from "./EditBlogForm";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="py-16 text-center text-slate-500">
          Loading editor…
        </main>
      }
    >
      <EditBlogRoute params={params} />
    </Suspense>
  );
}

async function EditBlogRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditBlogForm id={id} />;
}
