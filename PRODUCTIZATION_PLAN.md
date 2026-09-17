# KEY CRAFT 5000 商品化・成果物実装方針

- 本番 `main` は検証完了まで変更しない。
- 商品化・成果物機能は `agent/productization-v1` で実装する。
- 現行本番URLと本番D1は、B型利用者の確認中は変更しない。
- 成果物は外部AI画像生成に依存せず、進捗データから決定論的にSVGで生成する。
- 納品用成果物として、現在地の町MAPと現在地の街イラストをPNG/SVGで書き出せるようにする。
- CI（content validation / lint / typecheck / test / build / deploy dry-run / smoke）が全て通ったものだけを本番候補とする。
- `main` への反映は別途明示的に行う。
