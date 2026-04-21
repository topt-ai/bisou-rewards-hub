import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarUploaderProps {
  userId: string;
  nombre: string;
  avatarUrl: string | null;
  size?: number;
  editable?: boolean;
  onUpdated?: (url: string) => void;
  className?: string;
}

export function AvatarUploader({
  userId,
  nombre,
  avatarUrl,
  size = 96,
  editable = true,
  onUpdated,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(avatarUrl);

  const handleSelect = () => {
    if (!editable || uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe pasar de 2 MB");
      return;
    }

    setUploading(true);
    try {
      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      setLocalUrl(publicUrl);
      onUpdated?.(publicUrl);
      toast.success("Foto actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const fontSize = Math.round(size / 2.8);

  return (
    <div
      className={cn(
        "relative inline-block shrink-0",
        editable && "cursor-pointer",
        className,
      )}
      style={{ width: size, height: size }}
      onClick={handleSelect}
    >
      {localUrl ? (
        <img
          src={localUrl}
          alt={nombre}
          className="h-full w-full rounded-full object-cover shadow-lg"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-primary font-display font-semibold text-primary-foreground shadow-lg"
          style={{ fontSize }}
        >
          {initials(nombre)}
        </div>
      )}

      {editable && (
        <>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow">
            <Camera className="h-3.5 w-3.5" />
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 text-xs font-medium text-foreground">
              Subiendo...
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
}
