import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { createRecord } from '../api/records';
import type { EntryMode, FoodRecord } from '../types';

type Props = {
  entryMode: Extract<EntryMode, 'dish_photo' | 'nutrition_label'>;
  onUploaded: (record: FoodRecord) => void;
};

// バックエンドのハンドラ側チェック（10MB）と揃える
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const HINT: Record<Props['entryMode'], string> = {
  dish_photo: '料理写真をドラッグ＆ドロップ、またはクリックして選択',
  nutrition_label: '栄養成分ラベルの写真をドラッグ＆ドロップ、またはクリックして選択',
};

// react-dropzone の却下理由をユーザー向けメッセージに変換する
function rejectionMessage(rejections: FileRejection[]): string {
  const code = rejections[0]?.errors[0]?.code;
  switch (code) {
    case 'file-too-large':
      return '画像サイズが大きすぎます（最大 10MB まで）。';
    case 'file-invalid-type':
      return 'JPEG または PNG 画像を選択してください。';
    default:
      return 'この画像は読み込めませんでした。';
  }
}

export function ImageUpload({ entryMode, onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      setError(rejectionMessage(rejections));
      return;
    }
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
    maxSize: MAX_IMAGE_BYTES,
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
