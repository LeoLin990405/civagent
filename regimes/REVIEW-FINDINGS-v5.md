# L-Stage Review Findings (Codex)

Codex audit of 5 sample regimes after PR #6 auto-generation. Actionable items for v5.1.

## Fixed in this commit

- **china/tang**: 司礼监 (Ming-Qing eunuch agency) was misplaced in Tang architecture. Replaced with 中书舍人 (Zhongshu Sheren, Tang drafter). "运行超过 1300 年" overclaim clarified — only the three-省 framework persisted, not the specific Tang configuration.

## Deferred to v5.1

- **global/byzantine**: Patriarch depicted as routine ethics veto — overstated. `theokrator` is literary, not a standard office title.
- **global/roman-republic**: Chart too linear. Assemblies (Comitia) should sit more prominently above consuls and senate. Censor placed too actively in day-to-day flow (role was periodic, not continuous).
- **global/prussia**: Compresses 1701-1918 into one snapshot. `Ober-Kriegsrat` may be invented. `Kammerdirektor` is too generic. Recommend splitting into `prussia-frederick` (18c) and `prussia-bismarck` (19c).
- **global/ottoman**: `Nişancı` miscast as 大法官 (should be pen-bearer/tuğra authenticator). Janissary Aga's direct-to-Sultan reporting path overcentralized — ignores parallel ulema channel. One source citation (`Patrick Balfour`) format nonstandard.

## Not yet reviewed (other sampling rounds failed)

- A second-round review (originally attempted on a now-removed provider) did not complete.
- cc-mimo third-round review hit `--max-turns 1` limit mid-output; re-run needed.

v5.1 plan: complete the second/third review rounds via Codex + opencode + Mimo on a dedicated branch, fix Byzantine/Roman/Prussian/Ottoman per above. (gemini is no longer used — see CHANGELOG v5.1.0.)

---

## Resolved — 2026-06 corpus accuracy audit

A full historical-accuracy audit of all 57 regimes (web-verified against standard
scholarship) was completed and the findings fixed. This closes the v5.1 plan above.

### Deferred-from-v5.1 items — now fixed
- **byzantine**: dropped the literary "Theokrator" (→ Basileus/Autokrator); reframed
  the Patriarch from a routine veto to doctrinal + coronation-legitimacy authority
  under *symphonia* (not caesaropapism); fixed a mislabeled citation (《秘史》 =
  Procopius's *Secret History*, distinct from *De Administrando Imperio*).
- **roman-republic**: already conformed (assemblies above consuls/senate; censor
  noted as periodic) — no change needed.
- **prussia**: replaced the invented "Ober-Kriegsrat" with the real
  Generaldirektorium (1723); narrowed the 1701–1918 blend to a coherent
  Frederician 18th-c. snapshot.
- **ottoman**: Nişancı corrected from "chief justice" to chancellor / kanun-keeper;
  added the missing Şeyhülislam (ulema/fetva) channel; Kazasker set as chief judge.

### Additional findings fixed this round
- **Citations** (fabricated/misattributed): carthage (Aristophanes, Plutarch
  *Life of Hannibal*), sparta (Hansen→Cartledge), safavid (Qian Mu→Newman), meiji
  (Jansen/Hall conflation + dup title), zulu (Knight not "Greaves"; Wright
  fabrication→Morris), venice (Curtis→Lane/Norwich), zhou (《西周史论》→《西周史》),
  five-dynasties (新五代史/五代史记 dedup→Wang Gungwu), swiss (Riker 1962),
  viking (Snorri fabrication→Heimskringla), caliphate (Kennedy title align).
- **Structure/anachronism**: liao (林牙 civil not military; 敌烈麻都→夷离毕),
  joseon ("Three Censors"→"Three Offices/Samsa"), jin-jurchen (un-pin the founder
  from post-1125 organs), yuan (中书令→右丞相; 理问所 moved under 行省), russian
  (narrowed the impossible 1547–1917 blend to a Muscovite Tsardom snapshot),
  aztec (Tlacochcalcatl under the Tlatoani, not Tlacopan), roman-empire (Magister
  Militum independent, not under the finance ministry), ming (批红 = 秉笔太监,
  sealed by 掌印太监), eu (eurozone now 21 after Bulgaria, Jan 2026).

### Deliberately left (interpretive — not errors)
Traditional Chinese historiography legitimately retrojects later office names onto
earlier dynasties; these are kept as the conventional reconstruction rather than
"corrected": shang 太师, xia 司空/司徒/司马, jin (Sima) 中正 placement, north-south
六官 generalization, three-kingdoms 都督 apex, zhou 三公 (太宰 carries the real
冢宰 administrative function). khmer Bakong/Bakheng inscription wording is a
minor, low-confidence ambiguity left as-is.
