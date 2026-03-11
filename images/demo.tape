Output images/demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Type "# 🎮 CivAgent — Choose Your Civilization"
Enter
Sleep 1s

Type "# List all 57 civilizations"
Enter
Sleep 500ms
Type "./scripts/list-regimes.sh | head -30"
Enter
Sleep 3s

Type "# Validate a regime"
Enter
Sleep 500ms
Type "./scripts/validate-regime.sh china/qin"
Enter
Sleep 3s

Type "# Switch to Qin Dynasty (centralized hierarchy)"
Enter
Sleep 500ms
Type "./scripts/switch-regime.sh china/qin"
Enter
Sleep 3s

Type "# Switch to Athenian Democracy"
Enter
Sleep 500ms
Type "./scripts/switch-regime.sh global/athens"
Enter
Sleep 3s

Type "# Create your own civilization (MOD)"
Enter
Sleep 500ms
Type "./scripts/create-regime.sh global/my-empire"
Enter
Sleep 2s

Type "# Clean up demo"
Enter
Type "rm -rf regimes/global/my-empire"
Enter
Sleep 1s
