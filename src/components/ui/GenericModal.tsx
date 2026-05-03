"use client";

import { useEffect, useState } from "react";

type Props<T> = {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { name: keyof T; label: string; type: string }[];
  initialData?: T;
  onSubmit: (data: T) => Promise<void>;
};

export default function GenericModal<T extends Record<string, any>>({
  open,
  onClose,
  title,
  fields,
  initialData,
  onSubmit,
}: Props<T>) {
  const [data, setData] = useState<T>({} as T);

  useEffect(() => {
    if (open) {
      setData(initialData || ({} as T));
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name as string}>
            <label>{field.label}</label>
            <input
              type={field.type}
              value={data[field.name] || ""}
              onChange={(e) =>
                setData({ ...data, [field.name]: e.target.value })
              }
            />
          </div>
        ))}
        <button type="submit">Salvar</button>
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
      </form>
    </div>
  );
}
