import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadRecord } from '../api/records';
import type { FoodRecord } from '../types';

type Props = {
  onUploaded: (record: FoodRecord) => void;
};

export function ImageUpload({ onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const record = await uploadRecord(file);
      onUploaded(record);
    } catch {
      setError('アップロードに失敗しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  }, [onUploaded]);

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
        {loading
          ? '分析中...'
          : isDragActive
          ? 'ここにドロップ'
          : '写真をドラッグ＆ドロップ、またはクリックして選択'}
      </div>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
}
