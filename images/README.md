# images フォルダ

スクリーンショットや画像はここに入れてください。

## 命名規則

```
article-001-ss-01.jpg   # 記事001のスクショ1枚目
article-001-ss-02.jpg   # 記事001のスクショ2枚目
article-002-ss-01.jpg   # 記事002のスクショ1枚目
member-kagero.png       # Kageroのキャラクター画像
member-nozomi.png       # Nozomi_GGのキャラクター画像
member-matsu.png        # Matsuのキャラクター画像
```

## 使い方

記事ページの `<div class="screenshot-placeholder">` を `<img>` に差し替えるだけです。

```html
<!-- 変更前 -->
<div class="screenshot-placeholder"><span>📸 スクショ 1</span></div>

<!-- 変更後 -->
<img src="images/article-001-ss-01.jpg" alt="黒い砂漠 夕暮れの草原">
```

グリッドのCSSはそのまま使えます。変更不要です。

## 推奨フォーマット

- スクショ: JPG または PNG（16:9 推奨）
- キャラクター画像: PNG（透過背景推奨）
