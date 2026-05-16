import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createRecord } from '../api/records';
import type { EntryMode, FoodRecord } from '../types';

type Props = {
  entryMode: Extract<EntryMode, 'dish_photo' | 'nutrition_label'>;
  onUploaded: (record: FoodRecord) => void;
};

const HINT: Record<Props['entryMode'], string> = {
  dish_photo: '料理写真をドラッグ＆ドロップ、またはクリックして選択',
  nutrition_label: '栄養成分ラベルの写真をドラッグ＆ドロップ、またはクリックして選択',
};

export function ImageUpload({ entryMode, onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('entry_mode', entryMode);
      form.append('image', file);
      const record = await createRecord(form);
      onUploaded(record);
    } catch {
      setError('アップロードに失敗しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  }, [entryMode, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: loading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#4f8ef7' : '#ccc'}`,
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: isDragActive ? '#f0f6ff' : '#fafafa',
        }}
      >
        <input {...getInputProps()} />
        {loading ? '分析中...' : isDragActive ? 'ここにドロップ' : HINT[entryMode]}
      </div>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
}
