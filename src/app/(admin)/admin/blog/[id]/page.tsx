"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setPost(d.post);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-[#7A8BA8]">Carregando post...</div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="py-24 text-center text-sm text-[#7A8BA8]">Post não encontrado.</div>
    );
  }

  return (
    <PostForm
      mode="editar"
      initialData={{ ...post, id } as Parameters<typeof PostForm>[0]["initialData"]}
    />
  );
}
