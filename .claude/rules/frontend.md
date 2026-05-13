# フロントエンド規約（React + TypeScript + Vite）

## ディレクトリ構成（推奨）

```
frontend/src/
├── main.tsx
├── App.tsx
├── api/                 API クライアント（axios ラッパー）
│   └── records.ts
├── components/          再利用可能な UI 部品
│   ├── ImageUpload.tsx
│   ├── RecordList.tsx
│   └── ...
├── pages/               ルーティング先のページ
│   ├── Dashboard.tsx
│   └── AnalyticsDashboard.tsx
├── hooks/               カスタムフック
├── types/               API 型・ドメイン型
└── styles/              CSS / CSS Modules
```

## TypeScript 設定

- `strict: true`（`tsconfig.json`）
- `any` は原則禁止。やむを得ない場合は `// TODO(taberu): ...` コメントで残す
- API レスポンス型は `types/` に明示的に定義し、README.md の API 仕様と一致させる

## React 規約

- すべて関数コンポーネント + Hooks
- ファイル名：コンポーネントは `PascalCase.tsx`、ユーティリティは `camelCase.ts`
- 1 ファイル 1 コンポーネントが基本（密結合な小さなサブコンポーネントは同居可）
- props は型で明示。`React.FC` は使わず、関数の引数として型注釈

```tsx
type Props = { record: FoodRecord; onDelete: (id: number) => void };

export function RecordDetail({ record, onDelete }: Props) {
  // ...
}
```

## 状態管理

- コンポーネントローカル：`useState` / `useReducer`
- サーバー状態：必要になったら `@tanstack/react-query`（最初は `useEffect` + `axios` でも可）
- グローバル状態が必要になるまで Context / Redux は入れない（MVP では不要のはず）

## API 呼び出し

- すべて `api/` 配下のモジュールに集約（コンポーネントから直接 axios 呼ばない）
- ベース URL は `import.meta.env.VITE_API_BASE_URL`
- エラーは throw して呼び出し側でハンドル
- 型は `types/` の API 型を使う

## スタイリング

- 最初は CSS Modules または素の CSS（Tailwind 等は MVP 後）
- グラフは `recharts` 一本

## 画像表示

- 画像 URL は `${VITE_API_BASE_URL}/uploads/${record.image_path}` で構築
- バックエンドの静的ファイル配信ルートと一致させる
- `<img loading="lazy">` で遅延読み込みを基本に

## アクセシビリティ

- `<img>` は必ず `alt` を付ける
- フォームは `<label>` で関連付ける
- 色だけで情報を伝えない（アレルギー警告はテキスト + 色 + アイコン）

## テスト

- 重要なロジック（フォームバリデーション、データ変換）は `vitest` で
- E2E は `playwright`（Phase 3）

## やってはいけないこと

- フロントエンドから Claude API を直接呼ぶ（API キー漏洩）
- `localStorage` に機密情報を保存
- 巨大画像をそのまま `<img>` に貼る（必要ならサムネイル経由）
- グローバル CSS で広く影響する変更（CSS Modules で局所化）
